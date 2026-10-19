import { Router, type Request, type Response } from "express";
import { prisma } from "../lib/prisma";
import { parseCookies, purposeSigner, requireAuth, type SessionPayload } from "../lib/session";
import { createPaidAccessGuard } from "../lib/planGuard";
import { createRateLimiter } from "../lib/rateLimit";
import { UUID, accountKey } from "../lib/routeHelpers";
import { encryptSecret } from "../lib/crypto";
import { connectionClient, markMetaExpired } from "../lib/metaAccount";
import {
  META_ERRORS,
  MetaApiError,
  adPayload,
  adSetPayload,
  buildOAuthUrl,
  campaignPayload,
  createOAuthState,
  creativePayload,
  exchangeCodeForToken,
  graphClient,
  metaConfig,
  parseCampaignDraft,
  verifyOAuthState,
} from "../lib/meta";

/**
 * Meta (Facebook / Instagram) ads: OAuth connection, ad account and Page lists, and campaigns created PAUSED.
 * A campaign only goes live through /activate with `confirm: true`. Statuses always come from Meta.
 */
const router = Router();

const NONCE_COOKIE = "dz_meta_nonce";
const signState = purposeSigner("meta-oauth-state");
const RETURN_COOKIE = "dz_meta_return";
const META_ID = /^\d{5,25}$/;

const metaLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyFn: accountKey });
const requirePaidAccess = createPaidAccessGuard((userId) =>
  prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, planStatus: true, planExpiresAt: true } }),
);

const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/api/meta", maxAge: 10 * 60_000 };

/** Only same-site paths are allowed as the page to come back to after logging in. */
const safeReturn = (value: unknown) => (typeof value === "string" && /^\/(?!\/)[\w\-/?=&.%]*$/.test(value) ? value : "/settings");
const withParam = (path: string, key: string, value: string) => `${path}${path.includes("?") ? "&" : "?"}${key}=${value}`;

async function sendError(res: Response, err: unknown, userId?: string) {
  if (err instanceof MetaApiError) {
    // Meta no longer accepts the token: show the connection as expired, so the page offers to reconnect
    if (err.reconnect && userId) await markMetaExpired(userId);
    return res.status(err.reconnect ? 401 : 502).json({ error: err.message, reconnect: err.reconnect });
  }
  console.error("Meta route error:", err);
  return res.status(500).json({ error: META_ERRORS.failed });
}

/**
 * The Meta campaign record saved in one of the user's projects (the proof that it is theirs). Records are only
 * written by these routes, from Meta's answers; the ids are checked again before they are used in a Graph path.
 */
async function ownedCampaign(userId: string, campaignId: string) {
  if (!META_ID.test(campaignId)) return null;
  const output = await prisma.projectOutput.findFirst({
    where: { userId, kind: "meta_campaign", data: { path: ["campaignId"], equals: campaignId } },
    orderBy: { version: "desc" },
  });
  const data = output?.data as Record<string, any> | undefined;
  if (!output || !data || ![data.campaignId, data.adSetId, data.adId].every((id) => typeof id === "string" && META_ID.test(id))) return null;
  return { output, data };
}

async function saveCampaignVersion(projectId: string, userId: string, data: Record<string, unknown>) {
  const last = await prisma.projectOutput.findFirst({ where: { projectId, kind: "meta_campaign" }, orderBy: { version: "desc" }, select: { version: true } });
  return prisma.projectOutput.create({
    data: { projectId, userId, kind: "meta_campaign", version: (last?.version ?? 0) + 1, data: data as object, size: Buffer.byteLength(JSON.stringify(data)) },
    select: { id: true, version: true, createdAt: true, data: true },
  });
}

// GET /api/meta/status — is Meta set up on this site, and is this account connected?
router.get("/api/meta/status", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const { config, missing } = metaConfig();
  try {
    const [connection, account] = await Promise.all([
      prisma.metaConnection.findUnique({ where: { userId: user.sub }, select: { metaUserName: true, expiresAt: true, scopes: true, adAccountId: true, pageId: true } }),
      prisma.user.findUnique({ where: { id: user.sub }, select: { isAdmin: true } }),
    ]);
    res.json({
      configured: Boolean(config),
      // which settings are missing is only shown to administrators
      missing: account?.isAdmin ? missing : undefined,
      connected: Boolean(connection),
      expired: Boolean(connection?.expiresAt && connection.expiresAt.getTime() < Date.now()),
      user: connection ? { name: connection.metaUserName } : null,
      expiresAt: connection?.expiresAt ?? null,
      scopes: connection?.scopes ?? [],
      adAccountId: connection?.adAccountId ?? null,
      pageId: connection?.pageId ?? null,
    });
  } catch (err) {
    await sendError(res, err, user.sub);
  }
});

// GET /api/meta/connect — sends the browser to Meta's login, with a signed state bound to this user and browser.
router.get("/api/meta/connect", requireAuth, (req, res) => {
  const user = req.user as SessionPayload;
  const back = safeReturn(req.query.return);
  const { config } = metaConfig();
  if (!config) return res.redirect(withParam(back, "meta", "unavailable"));
  const { state, nonce } = createOAuthState(user.sub, signState);
  res.cookie(NONCE_COOKIE, nonce, cookieOptions);
  res.cookie(RETURN_COOKIE, back, cookieOptions);
  res.redirect(buildOAuthUrl(config, state));
});

// GET /api/meta/callback — Meta sends the browser back here with a code (or an error).
router.get("/api/meta/callback", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as SessionPayload;
  const cookies = parseCookies(req);
  const back = safeReturn(cookies[RETURN_COOKIE]);
  res.clearCookie(NONCE_COOKIE, { path: "/api/meta" });
  res.clearCookie(RETURN_COOKIE, { path: "/api/meta" });
  const { config } = metaConfig();
  if (!config) return res.redirect(withParam(back, "meta", "unavailable"));
  if (!verifyOAuthState(String(req.query.state ?? ""), user.sub, cookies[NONCE_COOKIE], signState)) return res.redirect(withParam(back, "meta", "failed"));
  if (req.query.error || typeof req.query.code !== "string") return res.redirect(withParam(back, "meta", "denied"));
  try {
    const { token, expiresAt } = await exchangeCodeForToken(config, req.query.code);
    const client = graphClient(config, token);
    const [me, permissions] = await Promise.all([client.get("me", { fields: "id,name" }), client.get("me/permissions")]);
    const scopes = (permissions.data ?? []).filter((p: { status?: string }) => p.status === "granted").map((p: { permission: string }) => p.permission);
    const data = { metaUserId: String(me.id), metaUserName: String(me.name ?? ""), accessToken: encryptSecret(token), expiresAt, scopes };
    await prisma.metaConnection.upsert({ where: { userId: user.sub }, create: { ...data, userId: user.sub }, update: data });
    res.redirect(withParam(back, "meta", "connected"));
  } catch (err) {
    console.error("Meta login error:", err instanceof MetaApiError ? err.message : err);
    res.redirect(withParam(back, "meta", "failed"));
  }
});

// POST /api/meta/disconnect — forgets the token and asks Meta to revoke the app's access.
router.post("/api/meta/disconnect", requireAuth, metaLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    const result = await connectionClient(user.sub);
    if ("client" in result) await result.client.del("me/permissions").catch(() => null);
    await prisma.metaConnection.deleteMany({ where: { userId: user.sub } });
    res.json({ ok: true });
  } catch (err) {
    await sendError(res, err, user.sub);
  }
});

// GET /api/meta/accounts — the ad accounts and Pages this login can use.
router.get("/api/meta/accounts", requireAuth, metaLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const result = await connectionClient(user.sub);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  try {
    const [accounts, pages] = await Promise.all([
      result.client.get("me/adaccounts", { fields: "id,name,account_status,currency", limit: "50" }),
      result.client.get("me/accounts", { fields: "id,name", limit: "50" }),
    ]);
    res.json({
      adAccounts: (accounts.data ?? []).map((a: any) => ({ id: String(a.id), name: String(a.name ?? a.id), currency: String(a.currency ?? ""), active: a.account_status === 1 })),
      pages: (pages.data ?? []).map((p: any) => ({ id: String(p.id), name: String(p.name ?? p.id) })),
      defaults: { adAccountId: result.connection.adAccountId, pageId: result.connection.pageId },
    });
  } catch (err) {
    await sendError(res, err, user.sub);
  }
});

// PUT /api/meta/defaults — remember the ad account and Page picked last time.
router.put("/api/meta/defaults", requireAuth, metaLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const { adAccountId, pageId } = req.body ?? {};
  if (adAccountId != null && (typeof adAccountId !== "string" || !/^act_\d{5,25}$/.test(adAccountId))) return res.status(400).json({ error: META_ERRORS.account });
  if (pageId != null && (typeof pageId !== "string" || !META_ID.test(pageId))) return res.status(400).json({ error: META_ERRORS.page });
  try {
    const updated = await prisma.metaConnection.updateMany({ where: { userId: user.sub }, data: { adAccountId: adAccountId ?? null, pageId: pageId ?? null } });
    if (!updated.count) return res.status(409).json({ error: META_ERRORS.notConnected });
    res.json({ ok: true });
  } catch (err) {
    await sendError(res, err, user.sub);
  }
});

// POST /api/meta/campaigns — uploads the image and creates campaign, ad set, creative and ad, all PAUSED.
router.post("/api/meta/campaigns", requireAuth, requirePaidAccess, metaLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const projectId = req.body?.projectId;
  if (typeof projectId !== "string" || !UUID.test(projectId)) return res.status(404).json({ error: META_ERRORS.campaignNotFound });
  const parsed = parseCampaignDraft(req.body?.draft);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  const requested = parsed.draft;

  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.sub }, select: { id: true } });
  if (!project) return res.status(404).json({ error: META_ERRORS.campaignNotFound });
  const result = await connectionClient(user.sub);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  const { client } = result;

  let campaignId: string | null = null;
  try {
    // the currency, and so the budget's minor units, comes from the ad account at Meta, never from the browser
    const account = await client.get(requested.adAccountId, { fields: "currency,account_status" });
    if (account.account_status !== 1) throw new MetaApiError(META_ERRORS.accountInactive, null, null, 409, false);
    const draft = { ...requested, currency: typeof account.currency === "string" && /^[A-Z]{3}$/.test(account.currency) ? account.currency : requested.currency };
    const images = await client.post(`${draft.adAccountId}/adimages`, { bytes: draft.imageBase64 });
    const imageHash = Object.values(images.images ?? {}).map((i: any) => i?.hash).find(Boolean);
    if (!imageHash) throw new MetaApiError(META_ERRORS.image, null, null, 502, false);
    campaignId = String((await client.post(`${draft.adAccountId}/campaigns`, campaignPayload(draft))).id);
    const adSetId = String((await client.post(`${draft.adAccountId}/adsets`, adSetPayload(draft, campaignId))).id);
    const creativeId = String((await client.post(`${draft.adAccountId}/adcreatives`, creativePayload(draft, String(imageHash)))).id);
    const adId = String((await client.post(`${draft.adAccountId}/ads`, adPayload(draft, adSetId, creativeId))).id);

    const { imageBase64: _image, ...settings } = draft;
    const saved = await saveCampaignVersion(project.id, user.sub, {
      adAccountId: draft.adAccountId,
      campaignId,
      adSetId,
      creativeId,
      adId,
      status: "PAUSED",
      settings,
      createdAt: new Date().toISOString(),
      activatedAt: null,
    });
    res.status(201).json(saved);
  } catch (err) {
    // leave nothing half-made behind: deleting the campaign removes what was created under it
    if (campaignId) await client.del(campaignId).catch(() => null);
    await sendError(res, err, user.sub);
  }
});

// GET /api/meta/campaigns/:id — status and results, read from Meta.
router.get("/api/meta/campaigns/:id", requireAuth, metaLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const owned = await ownedCampaign(user.sub, req.params.id as string);
  if (!owned) return res.status(404).json({ error: META_ERRORS.campaignNotFound });
  const result = await connectionClient(user.sub);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  try {
    const [campaign, ad, insights] = await Promise.all([
      result.client.get(owned.data.campaignId, { fields: "name,status,effective_status" }),
      result.client.get(owned.data.adId, { fields: "status,effective_status,ad_review_feedback" }),
      result.client.get(`${owned.data.campaignId}/insights`, { fields: "impressions,reach,clicks,spend,ctr,cpc", date_preset: "maximum" }),
    ]);
    res.json({
      campaign: { status: campaign.status, effectiveStatus: campaign.effective_status },
      ad: { status: ad.status, effectiveStatus: ad.effective_status, reviewFeedback: ad.ad_review_feedback ?? null },
      insights: insights.data?.[0] ?? null,
    });
  } catch (err) {
    await sendError(res, err, user.sub);
  }
});

async function setStatus(req: Request, res: Response, status: "ACTIVE" | "PAUSED") {
  const user = req.user as SessionPayload;
  if (status === "ACTIVE" && req.body?.confirm !== true) return res.status(400).json({ error: META_ERRORS.confirm });
  const owned = await ownedCampaign(user.sub, req.params.id as string);
  if (!owned) return res.status(404).json({ error: META_ERRORS.campaignNotFound });
  const result = await connectionClient(user.sub);
  if ("error" in result) return res.status(result.status).json({ error: result.error });
  try {
    // the ad set and the ad were created paused too: all three switch together
    for (const id of status === "ACTIVE" ? [owned.data.adId, owned.data.adSetId, owned.data.campaignId] : [owned.data.campaignId]) {
      await result.client.post(id, { status });
    }
    const campaign = await result.client.get(owned.data.campaignId, { fields: "status,effective_status" });
    const saved = await saveCampaignVersion(owned.output.projectId, user.sub, {
      ...owned.data,
      status: campaign.status,
      effectiveStatus: campaign.effective_status,
      ...(status === "ACTIVE" && { activatedAt: new Date().toISOString() }),
    });
    res.json(saved);
  } catch (err) {
    await sendError(res, err, user.sub);
  }
}

// POST /api/meta/campaigns/:id/activate — body { confirm: true }: the explicit go-live.
router.post("/api/meta/campaigns/:id/activate", requireAuth, requirePaidAccess, metaLimiter, (req, res) => void setStatus(req, res, "ACTIVE"));
// POST /api/meta/campaigns/:id/pause
router.post("/api/meta/campaigns/:id/pause", requireAuth, metaLimiter, (req, res) => void setStatus(req, res, "PAUSED"));

export const metaRouter = router;
