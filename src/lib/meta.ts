/**
 * Meta (Facebook / Instagram) Marketing API: configuration, login, a small Graph client and the request bodies
 * used to create a campaign. Everything is created PAUSED; going live is a separate, explicitly confirmed step.
 * Server-side only: the app secret and the user's access token never reach the browser.
 */
import crypto from 'node:crypto';
import { AD_CTAS } from './adPack';
import { sniffImageType } from './assetRules';

/** Current Marketing API version (v26.0, July 2026). Override with META_GRAPH_VERSION. */
export const META_GRAPH_DEFAULT_VERSION = 'v26.0';

/** Permissions asked at login: manage and read ads, pick the business, list the Pages that run the ads. */
export const META_SCOPES = ['ads_management', 'ads_read', 'business_management', 'pages_show_list', 'pages_read_engagement', 'pages_manage_ads'];

export const META_OBJECTIVES = ['OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS', 'OUTCOME_SALES'] as const;
export type MetaObjective = (typeof META_OBJECTIVES)[number];

export const META_ERRORS = {
  notConfigured: "La connexion Meta n'est pas encore configurée sur ce site.",
  notConnected: "Connecte d'abord ton compte Meta.",
  reconnect: 'Ta connexion Meta a expiré. Reconnecte ton compte.',
  state: 'La connexion Meta a échoué. Réessaie.',
  account: 'Compte publicitaire invalide.',
  page: 'Page Facebook invalide.',
  objective: 'Objectif Meta invalide.',
  pixel: "Une campagne de ventes demande l'identifiant de ton pixel Meta.",
  budget: 'Budget quotidien invalide.',
  dates: 'La date de fin doit suivre la date de début.',
  countries: 'Pays invalides (codes à 2 lettres, par exemple DZ).',
  age: "Tranche d'âge invalide (13 à 65 ans).",
  link: "Le lien doit être l'adresse https de ta page de vente.",
  copy: 'Le texte et le titre de la publicité sont obligatoires.',
  image: 'Le visuel de la publicité est manquant ou invalide.',
  confirm: "Confirme l'activation pour lancer la campagne.",
  campaignNotFound: 'Campagne introuvable.',
  accountInactive: "Ce compte publicitaire n'est pas actif chez Meta. Choisis-en un autre ou règle le problème dans Meta Business.",
  failed: 'Meta a refusé la demande. Réessaie dans un instant.',
} as const;

export interface MetaConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  version: string;
  /** Facebook Login for Business configuration; when set it replaces the scope list. */
  configId: string | null;
  /** Meta's hosts; only overridden to run the flow against a local stand-in in tests. */
  graphBase: string;
  dialogBase: string;
}

/** The app configuration from the environment, or the names of what is missing. */
export function metaConfig(env: Record<string, string | undefined> = process.env): { config: MetaConfig | null; missing: string[] } {
  const missing: string[] = [];
  if (!env.META_APP_ID) missing.push('META_APP_ID');
  if (!env.META_APP_SECRET) missing.push('META_APP_SECRET');
  const redirectUri = env.META_REDIRECT_URI || (env.SITE_URL ? `${env.SITE_URL.replace(/\/+$/, '')}/api/meta/callback` : '');
  if (!redirectUri) missing.push('META_REDIRECT_URI or SITE_URL');
  if (missing.length) return { config: null, missing };
  return {
    config: {
      appId: env.META_APP_ID!,
      appSecret: env.META_APP_SECRET!,
      redirectUri,
      version: env.META_GRAPH_VERSION || META_GRAPH_DEFAULT_VERSION,
      configId: env.META_LOGIN_CONFIG_ID || null,
      graphBase: (env.NODE_ENV !== 'production' && env.META_GRAPH_BASE_URL) || 'https://graph.facebook.com',
      dialogBase: (env.NODE_ENV !== 'production' && env.META_DIALOG_BASE_URL) || 'https://www.facebook.com',
    },
    missing,
  };
}

export function buildOAuthUrl(config: MetaConfig, state: string): string {
  const params = new URLSearchParams({ client_id: config.appId, redirect_uri: config.redirectUri, state, response_type: 'code' });
  if (config.configId) params.set('config_id', config.configId);
  else params.set('scope', META_SCOPES.join(','));
  return `${config.dialogBase}/${config.version}/dialog/oauth?${params}`;
}

/** Proof that a call comes from our server (recommended by Meta for every call made with a user token). */
export const appSecretProof = (token: string, secret: string) => crypto.createHmac('sha256', secret).update(token).digest('hex');

// --- signed login state (protects the callback against forged requests) ---------------------------------------
const STATE_TTL_MS = 10 * 60_000;

export function createOAuthState(userId: string, sign: (value: string) => string, now = Date.now()): { state: string; nonce: string } {
  const nonce = crypto.randomBytes(16).toString('base64url');
  const body = Buffer.from(JSON.stringify({ u: userId, n: nonce, exp: now + STATE_TTL_MS })).toString('base64url');
  return { state: `${body}.${sign(body)}`, nonce };
}

/** True when `state` was issued by us, for this user and this browser (nonce cookie), and is still fresh. */
export function verifyOAuthState(state: string, userId: string, nonce: string | undefined, sign: (value: string) => string, now = Date.now()): boolean {
  const [body, sig] = String(state ?? '').split('.');
  if (!body || !sig || !nonce) return false;
  const expected = sign(body);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return data.u === userId && data.n === nonce && typeof data.exp === 'number' && data.exp > now;
  } catch {
    return false;
  }
}

// --- Graph client ------------------------------------------------------------------------------------------------
export class MetaApiError extends Error {
  constructor(message: string, readonly code: number | null, readonly subcode: number | null, readonly status: number, readonly reconnect: boolean) {
    super(message);
  }
}

function toMetaError(error: Record<string, unknown> | undefined, status: number): MetaApiError {
  const code = typeof error?.code === 'number' ? error.code : null;
  const subcode = typeof error?.error_subcode === 'number' ? error.error_subcode : null;
  // 190: token expired or revoked; 102: session invalid
  const reconnect = code === 190 || code === 102;
  const userMessage = typeof error?.error_user_msg === 'string' && error.error_user_msg ? error.error_user_msg : null;
  const raw = typeof error?.message === 'string' ? error.message : null;
  return new MetaApiError(reconnect ? META_ERRORS.reconnect : userMessage ?? raw ?? META_ERRORS.failed, code, subcode, status, reconnect);
}

export type GraphParams = Record<string, string>;

/** Graph paths are ids and edges only ("me/adaccounts", "act_123/ads", "120…"): nothing that could alter the request. */
export const GRAPH_PATH = /^[A-Za-z0-9_]+(\/[A-Za-z0-9_]+)*$/;
/** A Graph call that hangs is abandoned, so no request waits on Meta indefinitely. */
const GRAPH_TIMEOUT_MS = 25_000;

export function graphClient(config: MetaConfig, token: string, fetchImpl: typeof fetch = fetch) {
  const base = `${config.graphBase}/${config.version}/`;
  const auth = { access_token: token, appsecret_proof: appSecretProof(token, config.appSecret) };
  async function request(method: 'GET' | 'POST' | 'DELETE', path: string, params: GraphParams) {
    if (!GRAPH_PATH.test(path)) throw new MetaApiError(META_ERRORS.failed, null, null, 400, false);
    const url = base + path;
    const query = new URLSearchParams({ ...params, ...auth }).toString();
    const signal = AbortSignal.timeout(GRAPH_TIMEOUT_MS);
    const res = method === 'POST'
      ? await fetchImpl(url, { method, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: query, signal })
      : await fetchImpl(`${url}?${query}`, { method, signal });
    const body = (await res.json().catch(() => ({}))) as Record<string, any>;
    if (!res.ok || body?.error) throw toMetaError(body?.error, res.status);
    return body;
  }
  return {
    get: (path: string, params: GraphParams = {}) => request('GET', path, params),
    post: (path: string, params: GraphParams = {}) => request('POST', path, params),
    del: (path: string) => request('DELETE', path, {}),
  };
}

export type GraphClient = ReturnType<typeof graphClient>;

/** Exchanges the login code for a token, then for a long-lived (about 60 days) one. */
export async function exchangeCodeForToken(config: MetaConfig, code: string, fetchImpl: typeof fetch = fetch): Promise<{ token: string; expiresAt: Date | null }> {
  const call = async (params: Record<string, string>) => {
    const res = await fetchImpl(`${config.graphBase}/${config.version}/oauth/access_token?${new URLSearchParams(params)}`, { signal: AbortSignal.timeout(GRAPH_TIMEOUT_MS) });
    const body = (await res.json().catch(() => ({}))) as Record<string, any>;
    if (!res.ok || body?.error || typeof body?.access_token !== 'string') throw toMetaError(body?.error, res.status);
    return body as { access_token: string; expires_in?: number };
  };
  const short = await call({ client_id: config.appId, client_secret: config.appSecret, redirect_uri: config.redirectUri, code });
  const long = await call({ grant_type: 'fb_exchange_token', client_id: config.appId, client_secret: config.appSecret, fb_exchange_token: short.access_token });
  return { token: long.access_token, expiresAt: long.expires_in ? new Date(Date.now() + long.expires_in * 1000) : null };
}

// --- campaign draft ------------------------------------------------------------------------------------------------
/** Currencies Meta counts without minor units; every other currency is counted in hundredths. */
const ZERO_DECIMAL = new Set(['CLP', 'COP', 'CRC', 'HUF', 'ISK', 'IDR', 'JPY', 'KRW', 'PYG', 'TWD', 'VND']);

export const budgetMinorUnits = (amount: number, currency: string) => Math.round(amount * (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100));

export interface CampaignDraft {
  adAccountId: string;
  pageId: string;
  objective: MetaObjective;
  pixelId: string | null;
  dailyBudget: number;
  currency: string;
  startTime: string;
  endTime: string | null;
  countries: string[];
  ageMin: number;
  ageMax: number;
  link: string;
  name: string;
  primaryText: string;
  headline: string;
  description: string;
  callToAction: (typeof AD_CTAS)[number];
  imageBase64: string;
}

const isIso = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function parseCampaignDraft(body: unknown): { draft: CampaignDraft } | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (typeof b.adAccountId !== 'string' || !/^act_\d{5,25}$/.test(b.adAccountId)) return { error: META_ERRORS.account };
  if (typeof b.pageId !== 'string' || !/^\d{5,25}$/.test(b.pageId)) return { error: META_ERRORS.page };
  if (!(META_OBJECTIVES as readonly unknown[]).includes(b.objective)) return { error: META_ERRORS.objective };
  const objective = b.objective as MetaObjective;
  const pixelId = typeof b.pixelId === 'string' && /^\d{5,25}$/.test(b.pixelId) ? b.pixelId : null;
  if (objective === 'OUTCOME_SALES' && !pixelId) return { error: META_ERRORS.pixel };
  if (typeof b.dailyBudget !== 'number' || !Number.isFinite(b.dailyBudget) || b.dailyBudget <= 0 || b.dailyBudget > 1e9) return { error: META_ERRORS.budget };
  if (typeof b.currency !== 'string' || !/^[A-Z]{3}$/.test(b.currency)) return { error: META_ERRORS.budget };
  if (!isIso(b.startTime) || (b.endTime != null && (!isIso(b.endTime) || Date.parse(b.endTime as string) <= Date.parse(b.startTime as string)))) return { error: META_ERRORS.dates };
  if (!Array.isArray(b.countries) || b.countries.length < 1 || b.countries.length > 25 || !b.countries.every((c) => typeof c === 'string' && /^[A-Z]{2}$/.test(c))) return { error: META_ERRORS.countries };
  const ageMin = b.ageMin;
  const ageMax = b.ageMax;
  if (!Number.isInteger(ageMin) || !Number.isInteger(ageMax) || (ageMin as number) < 13 || (ageMax as number) > 65 || (ageMin as number) > (ageMax as number)) return { error: META_ERRORS.age };

  let link: URL | null = null;
  try {
    link = new URL(String(b.link));
  } catch {
    link = null;
  }
  if (!link || link.protocol !== 'https:' || !link.hostname.includes('.')) return { error: META_ERRORS.link };

  const primaryText = str(b.primaryText, 2000);
  const headline = str(b.headline, 255);
  if (!primaryText || !headline) return { error: META_ERRORS.copy };
  const callToAction = (AD_CTAS as readonly unknown[]).includes(b.callToAction) ? (b.callToAction as CampaignDraft['callToAction']) : 'SHOP_NOW';

  const imageBase64 = typeof b.imageBase64 === 'string' ? b.imageBase64.replace(/\s/g, '') : '';
  if (!imageBase64 || imageBase64.length > 8_000_000 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64) || !sniffImageType(Buffer.from(imageBase64.slice(0, 64), 'base64'))) {
    return { error: META_ERRORS.image };
  }

  return {
    draft: {
      adAccountId: b.adAccountId,
      pageId: b.pageId,
      objective,
      pixelId,
      dailyBudget: b.dailyBudget,
      currency: b.currency,
      startTime: new Date(b.startTime as string).toISOString(),
      endTime: b.endTime ? new Date(b.endTime as string).toISOString() : null,
      countries: [...new Set(b.countries as string[])],
      ageMin: ageMin as number,
      ageMax: ageMax as number,
      link: link.toString(),
      name: str(b.name, 200) || headline,
      primaryText,
      headline,
      description: str(b.description, 255),
      callToAction,
      imageBase64,
    },
  };
}

// --- request bodies --------------------------------------------------------------------------------------------------
export const campaignPayload = (d: CampaignDraft): GraphParams => ({
  name: d.name,
  objective: d.objective,
  status: 'PAUSED',
  special_ad_categories: '[]',
});

const OPTIMIZATION_GOAL: Record<MetaObjective, string> = {
  OUTCOME_TRAFFIC: 'LINK_CLICKS',
  OUTCOME_AWARENESS: 'REACH',
  OUTCOME_SALES: 'OFFSITE_CONVERSIONS',
};

export function adSetPayload(d: CampaignDraft, campaignId: string): GraphParams {
  // Advantage+ audience may widen the audience; Meta only allows it with a minimum age up to 25 and no maximum below 65.
  const expand = d.ageMin <= 25 && d.ageMax === 65 ? 1 : 0;
  const payload: GraphParams = {
    name: d.name,
    campaign_id: campaignId,
    status: 'PAUSED',
    billing_event: 'IMPRESSIONS',
    optimization_goal: OPTIMIZATION_GOAL[d.objective],
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: String(budgetMinorUnits(d.dailyBudget, d.currency)),
    start_time: d.startTime,
    targeting: JSON.stringify({ geo_locations: { countries: d.countries }, age_min: d.ageMin, age_max: d.ageMax, targeting_automation: { advantage_audience: expand } }),
  };
  if (d.objective !== 'OUTCOME_AWARENESS') payload.destination_type = 'WEBSITE';
  if (d.endTime) payload.end_time = d.endTime;
  if (d.objective === 'OUTCOME_SALES' && d.pixelId) payload.promoted_object = JSON.stringify({ pixel_id: d.pixelId, custom_event_type: 'PURCHASE' });
  return payload;
}

export function creativePayload(d: CampaignDraft, imageHash: string): GraphParams {
  const linkData: Record<string, unknown> = {
    image_hash: imageHash,
    link: d.link,
    message: d.primaryText,
    name: d.headline,
    ...(d.description && { description: d.description }),
    call_to_action: { type: d.callToAction, value: { link: d.link } },
  };
  return { name: d.name, object_story_spec: JSON.stringify({ page_id: d.pageId, link_data: linkData }) };
}

export const adPayload = (d: CampaignDraft, adSetId: string, creativeId: string): GraphParams => ({
  name: d.name,
  adset_id: adSetId,
  creative: JSON.stringify({ creative_id: creativeId }),
  status: 'PAUSED',
});
