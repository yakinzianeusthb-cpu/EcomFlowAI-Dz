import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
  META_ERRORS,
  META_SCOPES,
  adPayload,
  adSetPayload,
  appSecretProof,
  budgetMinorUnits,
  buildOAuthUrl,
  campaignPayload,
  createOAuthState,
  creativePayload,
  verifyOAuthState,
  graphClient,
  metaConfig,
  parseCampaignDraft,
  MetaApiError,
} from '../../src/lib/meta';

const env = { META_APP_ID: '123', META_APP_SECRET: 'shh', SITE_URL: 'https://ecomflow.example' };

describe('metaConfig', () => {
  it('is null until the app id and secret are set, and says which ones are missing', () => {
    expect(metaConfig({}).config).toBeNull();
    expect(metaConfig({}).missing).toEqual(['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI or SITE_URL']);
    expect(metaConfig({ META_APP_ID: '1' }).missing).toEqual(['META_APP_SECRET', 'META_REDIRECT_URI or SITE_URL']);
  });

  it('derives the callback address from the site address and uses the current API version', () => {
    const { config } = metaConfig(env);
    expect(config).toMatchObject({ appId: '123', redirectUri: 'https://ecomflow.example/api/meta/callback', version: 'v26.0' });
    expect(metaConfig({ ...env, META_GRAPH_VERSION: 'v27.0', META_REDIRECT_URI: 'https://x.test/cb' }).config).toMatchObject({ version: 'v27.0', redirectUri: 'https://x.test/cb' });
  });
});

describe('buildOAuthUrl', () => {
  const { config } = metaConfig(env);

  it('asks for the ads permissions with a state value', () => {
    const url = new URL(buildOAuthUrl(config!, 'state-1'));
    expect(url.origin + url.pathname).toBe('https://www.facebook.com/v26.0/dialog/oauth');
    expect(url.searchParams.get('client_id')).toBe('123');
    expect(url.searchParams.get('redirect_uri')).toBe('https://ecomflow.example/api/meta/callback');
    expect(url.searchParams.get('state')).toBe('state-1');
    expect(url.searchParams.get('scope')!.split(',')).toEqual(META_SCOPES);
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  it('uses a Facebook Login for Business configuration when one is set', () => {
    const url = new URL(buildOAuthUrl(metaConfig({ ...env, META_LOGIN_CONFIG_ID: '999' }).config!, 's'));
    expect(url.searchParams.get('config_id')).toBe('999');
    expect(url.searchParams.get('scope')).toBeNull();
  });
});

describe('login state', () => {
  const sign = (v: string) => crypto.createHmac('sha256', 'session-secret').update(v).digest('base64url');
  const now = 1_800_000_000_000;

  it('accepts its own state, for the same user and browser, while fresh', () => {
    const { state, nonce } = createOAuthState('user-1', sign, now);
    expect(verifyOAuthState(state, 'user-1', nonce, sign, now + 60_000)).toBe(true);
  });

  it('refuses another user, another browser, an old state or a forged one', () => {
    const { state, nonce } = createOAuthState('user-1', sign, now);
    expect(verifyOAuthState(state, 'user-2', nonce, sign, now)).toBe(false);
    expect(verifyOAuthState(state, 'user-1', 'other-nonce', sign, now)).toBe(false);
    expect(verifyOAuthState(state, 'user-1', undefined, sign, now)).toBe(false);
    expect(verifyOAuthState(state, 'user-1', nonce, sign, now + 11 * 60_000)).toBe(false);
    const [body] = state.split('.');
    expect(verifyOAuthState(`${body}.forged`, 'user-1', nonce, sign, now)).toBe(false);
    expect(verifyOAuthState('garbage', 'user-1', nonce, sign, now)).toBe(false);
  });
});

describe('appSecretProof', () => {
  it('signs the token with the app secret (HMAC-SHA256, hex)', () => {
    expect(appSecretProof('tok', 'shh')).toBe(crypto.createHmac('sha256', 'shh').update('tok').digest('hex'));
  });
});

describe('budgetMinorUnits', () => {
  it('converts to the smallest currency unit Meta expects', () => {
    expect(budgetMinorUnits(1500, 'DZD')).toBe(150000);
    expect(budgetMinorUnits(12.5, 'USD')).toBe(1250);
    expect(budgetMinorUnits(3000, 'JPY')).toBe(3000);
  });
});

const draftBody = {
  adAccountId: 'act_1234567890',
  pageId: '1122334455',
  objective: 'OUTCOME_TRAFFIC',
  dailyBudget: 1500,
  currency: 'DZD',
  startTime: '2026-11-01T08:00:00.000Z',
  endTime: null,
  countries: ['DZ'],
  ageMin: 18,
  ageMax: 65,
  link: 'https://boutique.example/lampe',
  name: 'Lampe LED — test',
  primaryText: 'Fini le noir pendant les coupures.',
  headline: 'Lumière 12 h',
  description: 'Paiement à la livraison',
  callToAction: 'ORDER_NOW',
  imageBase64: Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString('base64'),
};

describe('parseCampaignDraft', () => {
  it('accepts a complete draft', () => {
    const r = parseCampaignDraft(draftBody);
    expect('draft' in r && r.draft).toMatchObject({ adAccountId: 'act_1234567890', dailyBudget: 1500, countries: ['DZ'] });
  });

  it('only sends people to a secure web page', () => {
    expect(parseCampaignDraft({ ...draftBody, link: 'http://boutique.example' })).toEqual({ error: META_ERRORS.link });
    expect(parseCampaignDraft({ ...draftBody, link: 'javascript:alert(1)' })).toEqual({ error: META_ERRORS.link });
  });

  it('refuses ids, budgets, ages and countries that are not valid', () => {
    expect(parseCampaignDraft({ ...draftBody, adAccountId: '1234; DROP' })).toEqual({ error: META_ERRORS.account });
    expect(parseCampaignDraft({ ...draftBody, pageId: 'abc' })).toEqual({ error: META_ERRORS.page });
    expect(parseCampaignDraft({ ...draftBody, dailyBudget: 0 })).toEqual({ error: META_ERRORS.budget });
    expect(parseCampaignDraft({ ...draftBody, ageMin: 12 })).toEqual({ error: META_ERRORS.age });
    expect(parseCampaignDraft({ ...draftBody, ageMin: 40, ageMax: 30 })).toEqual({ error: META_ERRORS.age });
    expect(parseCampaignDraft({ ...draftBody, countries: ['Algeria'] })).toEqual({ error: META_ERRORS.countries });
    expect(parseCampaignDraft({ ...draftBody, objective: 'OUTCOME_APP_PROMOTION' })).toEqual({ error: META_ERRORS.objective });
  });

  it('needs a pixel for a sales campaign, and an end after the start', () => {
    expect(parseCampaignDraft({ ...draftBody, objective: 'OUTCOME_SALES' })).toEqual({ error: META_ERRORS.pixel });
    expect('draft' in parseCampaignDraft({ ...draftBody, objective: 'OUTCOME_SALES', pixelId: '5566778899' })).toBe(true);
    expect(parseCampaignDraft({ ...draftBody, endTime: '2026-10-01T08:00:00.000Z' })).toEqual({ error: META_ERRORS.dates });
  });

  it('needs the ad text and an image', () => {
    expect(parseCampaignDraft({ ...draftBody, headline: '' })).toEqual({ error: META_ERRORS.copy });
    expect(parseCampaignDraft({ ...draftBody, imageBase64: '' })).toEqual({ error: META_ERRORS.image });
  });
});

describe('request payloads', () => {
  const draft = (parseCampaignDraft(draftBody) as { draft: any }).draft;

  it('creates the campaign paused, with the special ad category list Meta requires', () => {
    expect(campaignPayload(draft)).toEqual({ name: 'Lampe LED — test', objective: 'OUTCOME_TRAFFIC', status: 'PAUSED', special_ad_categories: '[]' });
  });

  it('creates a paused traffic ad set with an explicit audience setting and the budget in minor units', () => {
    const p = adSetPayload(draft, 'C1');
    expect(p).toMatchObject({
      campaign_id: 'C1', status: 'PAUSED', billing_event: 'IMPRESSIONS', optimization_goal: 'LINK_CLICKS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP', destination_type: 'WEBSITE', daily_budget: '150000', start_time: '2026-11-01T08:00:00.000Z',
    });
    const targeting = JSON.parse(p.targeting);
    expect(targeting).toEqual({ geo_locations: { countries: ['DZ'] }, age_min: 18, age_max: 65, targeting_automation: { advantage_audience: 1 } });
    expect(p).not.toHaveProperty('end_time');
  });

  it('turns the audience expansion off when the age range is narrowed', () => {
    const narrow = (parseCampaignDraft({ ...draftBody, ageMin: 30, ageMax: 45 }) as { draft: any }).draft;
    expect(JSON.parse(adSetPayload(narrow, 'C1').targeting).targeting_automation).toEqual({ advantage_audience: 0 });
  });

  it('optimises a sales ad set for purchases on the pixel', () => {
    const sales = (parseCampaignDraft({ ...draftBody, objective: 'OUTCOME_SALES', pixelId: '5566778899' }) as { draft: any }).draft;
    const p = adSetPayload(sales, 'C1');
    expect(p.optimization_goal).toBe('OFFSITE_CONVERSIONS');
    expect(JSON.parse(p.promoted_object)).toEqual({ pixel_id: '5566778899', custom_event_type: 'PURCHASE' });
  });

  it('builds a link ad creative from the uploaded image', () => {
    const p = creativePayload(draft, 'HASH');
    expect(JSON.parse(p.object_story_spec)).toEqual({
      page_id: '1122334455',
      link_data: {
        image_hash: 'HASH',
        link: 'https://boutique.example/lampe',
        message: 'Fini le noir pendant les coupures.',
        name: 'Lumière 12 h',
        description: 'Paiement à la livraison',
        call_to_action: { type: 'ORDER_NOW', value: { link: 'https://boutique.example/lampe' } },
      },
    });
  });

  it('creates the ad paused', () => {
    expect(adPayload(draft, 'S1', 'K1')).toEqual({ name: 'Lampe LED — test', adset_id: 'S1', creative: '{"creative_id":"K1"}', status: 'PAUSED' });
  });
});

describe('graphClient', () => {
  const { config } = metaConfig(env);

  it('sends the token with its proof, and reads the answer', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: '42' }), { status: 200 }));
    const client = graphClient(config!, 'tok', fetchImpl as unknown as typeof fetch);
    await expect(client.post('act_1/campaigns', { name: 'x' })).resolves.toEqual({ id: '42' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://graph.facebook.com/v26.0/act_1/campaigns');
    const body = new URLSearchParams(String(init.body));
    expect(body.get('access_token')).toBe('tok');
    expect(body.get('appsecret_proof')).toBe(appSecretProof('tok', 'shh'));
    expect(body.get('name')).toBe('x');
  });

  it('turns Meta errors into a readable error, preferring the message meant for users', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { message: 'raw', code: 100, error_subcode: 1885183, error_user_msg: 'Budget too low' } }), { status: 400 }));
    const client = graphClient(config!, 'tok', fetchImpl as unknown as typeof fetch);
    const err = await client.get('me').catch((e) => e);
    expect(err).toBeInstanceOf(MetaApiError);
    expect(err).toMatchObject({ code: 100, subcode: 1885183, message: 'Budget too low' });
  });

  it('flags an expired or revoked login so the user can reconnect', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Session has expired', code: 190 } }), { status: 400 }));
    const err = await graphClient(config!, 'tok', fetchImpl as unknown as typeof fetch).get('me').catch((e) => e);
    expect(err.reconnect).toBe(true);
  });

  it('refuses any path that is not plain ids and edges, before calling Meta', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const client = graphClient(config!, 'tok', fetchImpl as unknown as typeof fetch);
    for (const path of ['120?method=delete', '../oauth/access_token', '1#x', '/me', 'me/ads%2F1', 'act_1/../1', '']) {
      await expect(client.post(path, { status: 'ACTIVE' }), path).rejects.toBeInstanceOf(MetaApiError);
    }
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(client.get('act_123/adsets')).resolves.toEqual({});
  });

  it('gives up on a call that hangs instead of waiting forever', async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response('{}', { status: 200 });
    });
    await graphClient(config!, 'tok', fetchImpl as unknown as typeof fetch).get('me');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
