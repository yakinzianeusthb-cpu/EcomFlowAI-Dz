import "dotenv/config";
import express from "express";
import path from "path";
import { Readable } from "stream";
import cors from "cors";
import compression from "compression";
// @google/genai and the Telegram client are heavy: they are loaded on first use so a cold start stays quick.
// Local modules must stay STATIC imports, though: under `npm run dev` Tailwind's Vite plugin registers a Node
// loader hook that makes the first dynamic import() of a local .ts file resolve to an empty module.
import { getTelegramPulse } from "./server-telegram";
import { prisma } from "./src/lib/prisma";
import { getCurrentUser, purposeSigner, SessionPayload } from "./src/lib/session";
import { requireAuth } from "./src/lib/requireAuth";
import { revealSecret } from "./src/lib/crypto";
import { createRateLimiter } from "./src/lib/rateLimit";
import { PLAN_REQUIRED_MESSAGE, createPaidAccessGuard } from "./src/lib/planGuard";
import { canUsePaidTools } from "./src/lib/access";
import { CREDIT_ERRORS, textCharge, videoCharge } from "./src/lib/credits";
import { addCreditsOnce, openBill, resolveAiAccess, type AiAccess, type Bill } from "./src/lib/creditStore";
import { finalImage } from "./src/lib/generatedImage";
import { TEXT_ENGINES, TEXT_ENGINE_ERRORS, isTextProvider, modelFor, type TextProvider } from "./src/lib/textEngines";
import { fromGemini } from "./src/lib/textEngineRequest";
import { TextEngineError, callTextEngine, listTextModels } from "./src/lib/textEngineCall";
import { localizeResponses } from "./src/lib/localizeResponses";
import { languageFromCookies, localizeBody } from "./src/i18n/serverMessages";
import { SAVED_WORK_ERRORS } from "./src/lib/savedWork";
import { IMAGE_MODEL_FALLBACKS, TEXT_MODEL_FALLBACKS, aiErrorResponse, generateWithFallback, isQuotaError } from "./src/lib/aiFallback";
import {
  CLOUDFLARE_REFERENCE_MAX, DEFAULT_IMAGE_PROVIDER, IMAGE_ERRORS, KEEPS_PRODUCT, OPENAI_DRAW_MODELS, OPENAI_EDIT_MODELS, POLLINATIONS_DRAW_MODELS,
  POLLINATIONS_EDIT_MODELS, PROMPT_MAX, PROVIDER_HOSTS, cloudflareCall, cloudflareSchnellCall, falCall, isAspectRatio, isCloudflareAccountId,
  isImageProvider, isModelUnavailable, openAiCall, pollinationsImageCall, providerError, readImage, readReference,
  type AspectRatio, type ImageRequest, type ProviderCall,
} from "./src/lib/imageProviders";
import { createVoiceRouter } from "./src/routes/voice";
import { VideoServiceFailure, openServiceClip, pollServiceClip, startServiceClip, videoServiceOf } from "./src/routes/videoServices";
import { imageDimensions } from "./src/lib/imageDimensions";
import { refusalForLog } from "./src/lib/refusalLog";
import {
  GOOGLE_API_BASE, VIDEO_ERRORS, buildInteractionBody, fileDownloadUrl, isGoogleFileUri, parseVideoRequest, readInteraction, readJobDetails, signJob,
} from "./src/lib/videoJobs";
import { authRouter } from "./src/routes/auth";
import { catalogRouter } from "./src/routes/catalog";
import dashboardRouter from "./src/routes/dashboard";
import { historyRouter } from "./src/routes/history";
import { preferencesRouter } from "./src/routes/preferences";
import { sessionsRouter } from "./src/routes/sessions";
import { settingsRouter } from "./src/routes/settings";
import adminRouter from "./src/routes/admin";
import { assetsRouter } from "./src/routes/assets";
import { creditsRouter } from "./src/routes/credits";

const signVideoJob = purposeSigner("video-job");

// Keep in sync with src/services/gemini.ts MODEL_NAME.
const MODEL_NAME = "gemini-3-flash-preview";

// Only these models may be invoked through the server proxy — the client can
// no longer pick arbitrary (potentially expensive) models. Any image model is
// served by the current image chain, so a page still open from before an
// update keeps working.
const ALLOWED_MODELS = new Set([MODEL_NAME, ...IMAGE_MODEL_FALLBACKS]);

// A model out of quota, overloaded or closed to this key is replaced by the next one in its chain (see src/lib/aiFallback.ts).
const logModelFallback = (from: string, to: string) => console.warn(`Gemini model ${from} unavailable for this request; retrying with ${to}`);

// Config keys the proxy will forward to Gemini. Anything else (tools,
// toolConfig, safety settings, …) is dropped so a caller can't escalate
// the request shape.
const SAFE_CONFIG_KEYS = new Set([
  "responseMimeType",
  "responseSchema",
  "maxOutputTokens",
  "temperature",
  "topP",
  "topK",
  "candidateCount",
  "systemInstruction",
]);

// The image shapes every Gemini image model accepts. Only the shape is forwarded
// from imageConfig: the size stays Google's default (1K), so the cost of one
// image cannot be raised from the browser.
const IMAGE_ASPECT_RATIOS = new Set(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]);

function sanitizeConfig(config: unknown): Record<string, unknown> | undefined {
  if (!config || typeof config !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SAFE_CONFIG_KEYS.has(k)) out[k] = v;
  }
  const ratio = (config as { imageConfig?: { aspectRatio?: unknown } }).imageConfig?.aspectRatio;
  if (typeof ratio === "string" && IMAGE_ASPECT_RATIOS.has(ratio)) out.imageConfig = { aspectRatio: ratio };
  return Object.keys(out).length ? out : undefined;
}

// All client AI traffic (chat, image gen, every tool) goes through the
// generic proxy now, so keep this generous enough for a real session.
const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  keyFn: (req: any) => req.user?.sub || req.ip,
  message: "Trop de requêtes IA. Réessaie dans une minute.",
});

const app = express();
const PORT = 3000;

// req.ip must be the real client for the rate limits. Trust exactly the proxies in front of the app (one: Vercel's
// edge, or nginx on a Node host; set TRUST_PROXY to another count if needed). Trusting every hop would let a client
// pick its own address with an X-Forwarded-For header.
const proxyHops = Number.parseInt(process.env.TRUST_PROXY ?? "1", 10);
app.set("trust proxy", Number.isInteger(proxyHops) && proxyHops >= 0 ? proxyHops : 1);

// Security headers (helmet-equivalent). The content security policy is a <meta> tag in the built index.html
// (vite.config.ts), so it also applies where Vercel serves the files without Express.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

// CORS allowlist — no open reflection. Same-origin SPA is unaffected.
const APP_URL = process.env.APP_URL || "";
const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS || APP_URL)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || ALLOWED_ORIGINS.has(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: false,
  }),
);
// Vercel compresses responses at the edge; on a plain Node host we have to do it ourselves
// (the JS bundle is ~450 KB raw, ~140 KB gzipped).
if (process.env.VERCEL !== "1") app.use(compression());
// Request bodies: 1 MB by default. The routes that take images (uploads, AI calls with photos, payment proofs, admin
// content, saved work) accept up to 10 MB, and only for a signed-in request: an anonymous client can never make the
// server parse a large body.
const LARGE_BODY_PATHS = ["/api/ai/", "/api/assets", "/api/user/payment-proof", "/api/credits/purchase", "/api/admin/", "/api/catalog", "/api/preferences", "/api/lp-sessions", "/api/chat-sessions"];
const smallJson = express.json({ limit: "1mb" });
const largeJson = express.json({ limit: "10mb" });
app.use((req, res, next) => {
  const large = LARGE_BODY_PATHS.some((prefix) => req.path.startsWith(prefix)) && getCurrentUser(req) !== null;
  return (large ? largeJson : smallJson)(req, res, next);
});
// A body over the limit, or one that is not JSON, gets a short JSON answer in the visitor's language (Express would
// otherwise send an HTML error page). Only parsing errors reach this handler: it sits right after the parser.
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const type = (err as { type?: unknown } | null)?.type;
  const language = languageFromCookies(req.headers.cookie);
  if (type === "entity.too.large") return res.status(413).json(localizeBody({ error: SAVED_WORK_ERRORS.tooBig }, language));
  if (type === "entity.parse.failed") return res.status(400).json(localizeBody({ error: SAVED_WORK_ERRORS.invalid }, language));
  return next(err);
});
// Error messages are written in French in the routes; send them in the language the browser displays.
app.use(localizeResponses);

// Register all API routes before the SPA catch-all.
app.use(authRouter);
app.use(catalogRouter);
app.use(dashboardRouter);
app.use(historyRouter);
app.use(preferencesRouter);
app.use(sessionsRouter);
app.use(settingsRouter);
app.use(adminRouter);
app.use(assetsRouter);
app.use(creditsRouter);

async function makeAiClient(apiKey?: string) {
  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const NO_KEY_MSG = "Ajoute ta clé Gemini dans Paramètres pour utiliser l'IA.";

// The paid AI tools all go through /api/ai/generate, so that is where the paywall is enforced server-side.
const requirePaidAccess = createPaidAccessGuard((userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, planStatus: true, planExpiresAt: true },
  }),
);

// Who pays for a seller's AI (src/lib/creditStore.ts): their own Gemini key, stored encrypted and set from
// Paramètres, or without one, points spent on the platform's key set in /admin. With neither, NO_KEY_MSG.
const NO_CREDITS = { error: CREDIT_ERRORS.notEnough, code: "CREDITS_REQUIRED" };

/** The balance after a call paid in points, so the app can show it without asking again. */
function sendBalance(res: express.Response, bill: Bill | null) {
  if (bill?.balance != null) res.setHeader("X-Credits-Left", String(bill.balance));
}

/** Gives back the points of a failed call; a refund that fails is logged, never shown instead of the real error. */
const refundQuietly = (bill: Bill | null) => bill?.refund().catch((err) => console.error("Credit refund failed:", err));

/** After a text call paid in points: the blocks used beyond the first one, reserved before the call (see textCharge). */
async function settleText(bill: Bill | null, access: AiAccess, usage: { totalTokenCount?: number } | null | undefined) {
  if (!bill || access.mode !== "points") return;
  await bill.topUp(textCharge(usage?.totalTokenCount, access.settings.textCost) - access.settings.textCost, "text");
}

const ENGINE_KEY_SELECT = { textProvider: true, textModel: true, openaiApiKey: true, anthropicApiKey: true, mistralApiKey: true, deepseekApiKey: true, xaiApiKey: true, openrouterApiKey: true } as const;

/** The engine that writes this seller's texts (src/lib/textEngines.ts), the model and its key. */
async function textEngineOf(userId: string): Promise<{ provider: TextProvider; model: string; key: string | null }> {
  const row = await prisma.apiSettings.findUnique({ where: { userId }, select: ENGINE_KEY_SELECT });
  const provider = isTextProvider(row?.textProvider) ? row.textProvider : "gemini";
  if (provider === "gemini") return { provider, model: "", key: null };
  const blob = (row as Record<string, string | null> | null)?.[TEXT_ENGINES[provider].keyField];
  return { provider, model: modelFor(provider, row?.textModel), key: revealSecret(blob) };
}

/** Sends an error already worded for the seller (a text engine's or an image service's); false for any other error. */
function sendWordedError(res: express.Response, error: unknown): boolean {
  if (!(error instanceof TextEngineError)) return false;
  res.status(error.status).json({ error: error.message });
  return true;
}

/** Points pay for the AI, the plan opens the tools: a seller on points needs a live plan too (admins excepted). */
async function hasLivePlan(userId: string) {
  return canUsePaidTools(await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, planStatus: true, planExpiresAt: true } }));
}

// API routes setup
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

app.post("/api/ai/generate-product", requireAuth, aiRateLimiter, async (req, res) => {
  let bill: Bill | null = null;
  try {
    const user = req.user as SessionPayload;
    const { Type } = await import("@google/genai");
    const { image, currentName, purchasePrice, sellingPrice } = req.body;

    let prompt = "Tu es un expert en e-commerce pour le marché algérien. ";
    prompt += "Génère un nom de produit accrocheur EN FRANÇAIS et une description convaincante (mettant en avant les points forts) EN ARABE (Daridja algérienne ou Arabe standard). ";
    prompt += "Choisis la catégorie la plus appropriée parmi: Electronique, Maison, Beauté, Mode, Cuisine, Fitness. ";

    if (purchasePrice && sellingPrice) {
      prompt += `\nEn tenant compte d'un prix d'achat de ${purchasePrice} DZD et d'un prix de vente de ${sellingPrice} DZD, suggère un CPA cible (le coût par acquisition maximum acceptable pour rester rentable) en Euros (€). Prends en compte les frais de livraison (env. 600-800 DZD) et le taux de confirmation/livraison moyen en Algérie (40-60%).`;
    } else {
      prompt += "\nSuggère également un CPA cible réaliste en Euros (€) pour ce type de produit sur le marché algérien.";
    }

    prompt += "\nRéponds uniquement en JSON avec les champs: name, description, category, targetCPA (nombre ou chaîne représentant le montant en €).";

    if (currentName) {
      prompt += `\nNom actuel du produit: ${currentName}`;
    }

    const contents: any[] = [{ text: prompt }];

    if (image && image.includes('base64,')) {
      const base64Data = image.split('base64,')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          targetCPA: { type: Type.STRING }
        },
        required: ["name", "description", "category", "targetCPA"]
      }
    };

    // the engine the seller chose for texts; Gemini (own key or points) when it is Gemini
    const engine = await textEngineOf(user.sub);
    if (engine.provider !== "gemini") {
      if (!engine.key) return res.status(400).json({ error: TEXT_ENGINE_ERRORS.noKey });
      const answer = await callTextEngine(engine.provider, engine.key, engine.model, fromGemini({ parts: contents }, config));
      return res.json(JSON.parse(answer.text || "{}"));
    }

    const access = await resolveAiAccess(user.sub);
    if (access.mode === "none") return res.status(400).json({ error: NO_KEY_MSG });
    if (access.mode === "points") {
      if (!(await hasLivePlan(user.sub))) return res.status(403).json({ error: PLAN_REQUIRED_MESSAGE, code: "PLAN_REQUIRED" });
      bill = openBill(user.sub, access.free);
      if (!(await bill.reserve(access.settings.textCost, "text"))) return res.status(402).json(NO_CREDITS);
    }
    const ai = await makeAiClient(access.apiKey);
    const { result: response } = await generateWithFallback(TEXT_MODEL_FALLBACKS, (model) => ai.models.generateContent({
      model,
      contents: { parts: contents },
      config,
    }), logModelFallback);

    const result = JSON.parse(response.text || '{}');
    await settleText(bill, access, response.usageMetadata);
    sendBalance(res, bill);
    res.json(result);
  } catch (error) {
    await refundQuietly(bill);
    if (sendWordedError(res, error)) return;
    console.error("AI Generation Error:", error);
    // a wrong key or a used-up quota gets its own message; anything else stays generic
    const { status, error: message } = aiErrorResponse(error);
    res.status(status).json({ error: status === 500 ? "Failed to generate product info" : message });
  }
});

// Generic Gemini proxy — keeps the API key server-side.
// The client builds the prompt + config and sends them here; the server
// performs the actual Gemini call with the user's own stored key and relays
// the result. Returns NO_KEY_MSG when the user hasn't set a key in Paramètres.
app.post("/api/ai/generate", requireAuth, requirePaidAccess, aiRateLimiter, async (req, res) => {
  let bill: Bill | null = null;
  try {
    const { model = MODEL_NAME, contents, config } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: "Missing 'contents' in request body" });
    }
    if (typeof model !== "string" || !ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: "Modèle non autorisé." });
    }
    const user = req.user as SessionPayload;
    const isImage = IMAGE_MODEL_FALLBACKS.includes(model);
    if (!isImage) {
      // texts go to the engine the seller chose (src/lib/textEngines.ts); Gemini goes on below
      const engine = await textEngineOf(user.sub);
      if (engine.provider !== "gemini") {
        if (!engine.key) return res.status(400).json({ error: TEXT_ENGINE_ERRORS.noKey });
        return res.json(await callTextEngine(engine.provider, engine.key, engine.model, fromGemini(contents, config)));
      }
    }
    const access = await resolveAiAccess(user.sub);
    if (access.mode === "none") {
      // no Gemini at all: an image is drawn by the seller's image service when there is one
      const drawn = isImage ? await imageFromGeminiRequest(user, contents, config) : null;
      return drawn ? res.json(drawn) : res.status(400).json({ error: NO_KEY_MSG });
    }
    if (access.mode === "points") {
      // an image costs a fixed price; text costs its first block now and the rest once its length is known
      bill = openBill(user.sub, access.free);
      const first = isImage ? access.settings.imageCost : access.settings.textCost;
      if (!(await bill.reserve(first, isImage ? "image" : "text"))) return res.status(402).json(NO_CREDITS);
    }
    const ai = await makeAiClient(access.apiKey);
    const models = model === MODEL_NAME ? TEXT_MODEL_FALLBACKS : IMAGE_MODEL_FALLBACKS.includes(model) ? IMAGE_MODEL_FALLBACKS : [model];
    const { result: response } = await generateWithFallback(
      models,
      (candidate) => ai.models.generateContent({ model: candidate, contents, config: sanitizeConfig(config) }),
      logModelFallback,
    );
    // an image model that answered without an image (a refusal) costs nothing
    if (isImage && !finalImage(response.candidates)) await refundQuietly(bill);
    if (!isImage) await settleText(bill, access, response.usageMetadata);
    sendBalance(res, bill);
    res.json({
      text: response.text ?? "",
      candidates: response.candidates ?? [],
      usageMetadata: response.usageMetadata ?? null,
    });
  } catch (error: any) {
    await refundQuietly(bill);
    if (sendWordedError(res, error)) return;
    console.error("AI Proxy Error:", error);
    // Every model was tried (see generateWithFallback). Say why in plain words; never pass upstream details on.
    const { status, error: message } = aiErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

// Images made by the AI service the seller chose in Paramètres instead of Gemini (OpenAI, FLUX on fal.ai or
// Cloudflare); Gemini images keep going through /api/ai/generate. The service and its key come from the seller's
// settings, never from the request, and the key never leaves the server. Tests point the services at a local
// stand-in (IMAGE_PROVIDERS_BASE_URL, ignored in production).
const IMAGE_PROVIDERS_BASE = process.env.NODE_ENV !== "production" ? process.env.IMAGE_PROVIDERS_BASE_URL : undefined;
const providerHost = (provider: keyof typeof PROVIDER_HOSTS) => (IMAGE_PROVIDERS_BASE ? `${IMAGE_PROVIDERS_BASE}/${provider}` : PROVIDER_HOSTS[provider]);
/** image models can take a while, especially when they edit a photo */
const IMAGE_TIMEOUT_MS = 180_000;
const FAL_MEDIA = /^https:\/\/(?:[a-z0-9-]+\.)*fal\.media\//;
const DOWNLOAD_MAX_BYTES = 15 * 1024 * 1024;

/** The seller's image service and the keys it needs (decrypted here, used here only). */
async function imageServiceOf(session: SessionPayload) {
  const row = await prisma.apiSettings.findUnique({
    where: { userId: session.sub },
    select: { imageProvider: true, openaiApiKey: true, falApiKey: true, cloudflareAccountId: true, cloudflareApiToken: true, pollinationsApiKey: true },
  });
  return {
    provider: isImageProvider(row?.imageProvider) ? row.imageProvider : DEFAULT_IMAGE_PROVIDER,
    openai: revealSecret(row?.openaiApiKey),
    fal: revealSecret(row?.falApiKey),
    cloudflareAccount: row?.cloudflareAccountId ?? null,
    cloudflare: revealSecret(row?.cloudflareApiToken),
    pollinations: revealSecret(row?.pollinationsApiKey),
  };
}
type ImageService = Awaited<ReturnType<typeof imageServiceOf>>;

/** Each model in turn until one answers; `next` decides whether a refusal is worth trying the next model for. */
async function firstAnswer(models: readonly string[], call: (model: string) => ProviderCall, next: (error: any) => boolean = (e) => isModelUnavailable(e?.status, e?.text ?? "")): Promise<unknown> {
  for (const [i, model] of models.entries()) {
    try {
      return await sendImageCall(call(model));
    } catch (error: any) {
      if (i < models.length - 1 && next(error)) {
        console.warn("AI Image model refused, trying the next one:", model, refusalForLog(error));
        continue;
      }
      throw error;
    }
  }
  throw new TextEngineError(502, IMAGE_ERRORS.failed);
}

/** Cloudflare: FLUX.2 klein, then for an image from words alone FLUX.1 schnell, unless the token itself was refused. */
function cloudflareAnswer(service: ImageService, request: ImageRequest): Promise<unknown> {
  if (!service.cloudflare || !isCloudflareAccountId(service.cloudflareAccount)) throw new TextEngineError(400, IMAGE_ERRORS.noKey);
  const [account, token, host] = [service.cloudflareAccount, service.cloudflare, providerHost("cloudflare")];
  const models = request.reference ? ["klein"] : ["klein", "schnell"];
  return firstAnswer(models, (m) => (m === "klein" ? cloudflareCall(request, account, token, host) : cloudflareSchnellCall(request, account, token, host)), (e) => e?.status !== 401 && e?.status !== 429 && e?.name !== "TimeoutError");
}

/** One call to an image service; a refusal is thrown with the service's status and text (kept on the server). */
async function sendImageCall(call: ProviderCall): Promise<unknown> {
  const response = await fetch(call.url, { method: call.method, headers: call.headers, body: call.body, signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
  const text = await response.text();
  if (!response.ok) throw Object.assign(new Error(`image service answered ${response.status}`), { status: response.status, text });
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error("image service answered no JSON"), { status: 502, text: "" });
  }
}

/** fal sends the picture in its answer; should it send a link instead, only its own media host is fetched. */
async function falPictureFromLink(answer: unknown): Promise<string | null> {
  const url = (answer as { images?: { url?: unknown }[] } | null)?.images?.[0]?.url;
  if (typeof url !== "string" || !FAL_MEDIA.test(url)) return null;
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000), redirect: "error" });
  const type = response.headers.get("content-type") ?? "";
  if (!response.ok || !/^image\/(?:png|jpeg|webp)$/.test(type.split(";")[0])) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes.length && bytes.length <= DOWNLOAD_MAX_BYTES ? `data:${type.split(";")[0]};base64,${bytes.toString("base64")}` : null;
}

/**
 * One picture from the seller's image service (not Gemini) as a data URL. A missing key, a service that would not keep
 * the product, a refusal or a timeout is thrown already worded for the seller (TextEngineError); the service's own
 * words stay here, since they may quote part of the key.
 */
async function drawWithService(service: ImageService, request: { prompt: string; reference: ImageRequest["reference"]; aspectRatio: AspectRatio }): Promise<string> {
  if (service.provider === "gemini") throw new TextEngineError(409, IMAGE_ERRORS.geminiChosen);
  // a service that only draws from words would not keep the seller's product
  if (request.reference && !KEEPS_PRODUCT[service.provider]) throw new TextEngineError(400, IMAGE_ERRORS.noReference);
  if (service.provider === "cloudflare" && request.reference) {
    // FLUX.2 klein refuses larger photos; the browser shrinks them first, this catches any that were not
    const size = imageDimensions(request.reference.data);
    if (!size || Math.max(size.width, size.height) > CLOUDFLARE_REFERENCE_MAX) throw new TextEngineError(400, IMAGE_ERRORS.photoTooLarge);
  }
  try {
    let answer: unknown;
    if (service.provider === "openai") {
      const key = service.openai;
      if (!key) throw new TextEngineError(400, IMAGE_ERRORS.noKey);
      answer = await firstAnswer(request.reference ? OPENAI_EDIT_MODELS : OPENAI_DRAW_MODELS, (model) => openAiCall(request, key, model, providerHost("openai")));
    } else if (service.provider === "pollinations") {
      const key = service.pollinations;
      if (!key) throw new TextEngineError(400, IMAGE_ERRORS.noKey);
      // a model this account's tier or balance cannot use: the next one (402 included, the next is cheaper or free)
      answer = await firstAnswer(request.reference ? POLLINATIONS_EDIT_MODELS : POLLINATIONS_DRAW_MODELS, (model) => pollinationsImageCall(request, key, model, providerHost("pollinations")),
        (e) => e?.status === 402 || isModelUnavailable(e?.status, e?.text ?? ""));
    } else if (service.provider === "fal") {
      if (!service.fal) throw new TextEngineError(400, IMAGE_ERRORS.noKey);
      answer = await sendImageCall(falCall(request, service.fal, providerHost("fal")));
    } else {
      answer = await cloudflareAnswer(service, request);
    }
    const image = readImage(service.provider, answer) ?? (service.provider === "fal" ? await falPictureFromLink(answer) : null);
    if (!image) throw new TextEngineError(502, IMAGE_ERRORS.failed);
    return image;
  } catch (error: any) {
    if (error instanceof TextEngineError) throw error;
    console.error("AI Image Error:", service.provider, refusalForLog(error));
    if (error?.name === "TimeoutError") throw new TextEngineError(504, IMAGE_ERRORS.busy);
    const { status, error: message } = typeof error?.status === "number" ? providerError(error.status, error.text ?? "") : { status: 502, error: IMAGE_ERRORS.failed };
    throw new TextEngineError(status, message);
  }
}

/**
 * A Gemini image request (the tools' shape) drawn by the seller's image service instead, for sellers without any
 * Gemini key or points; null when their image service is Gemini too. Answers in Gemini's shape.
 */
async function imageFromGeminiRequest(session: SessionPayload, contents: unknown, config: unknown) {
  const service = await imageServiceOf(session);
  if (service.provider === "gemini") return null;
  const parts = fromGemini(contents, {}).messages.flatMap((m) => m.parts);
  const prompt = parts.map((p) => p.text ?? "").filter(Boolean).join("\n").slice(0, PROMPT_MAX).trim();
  const photo = parts.find((p) => p.image)?.image;
  const reference = photo ? readReference(`data:${photo.mimeType};base64,${photo.data}`) : null;
  if (!prompt || reference === "invalid") throw new TextEngineError(400, IMAGE_ERRORS.badRequest);
  const ratio = (config as { imageConfig?: { aspectRatio?: unknown } } | null)?.imageConfig?.aspectRatio;
  const image = await drawWithService(service, { prompt, reference, aspectRatio: isAspectRatio(ratio) ? ratio : "1:1" });
  const match = /^data:([^;]+);base64,(.+)$/s.exec(image);
  if (!match) throw new TextEngineError(502, IMAGE_ERRORS.failed);
  return { text: "", candidates: [{ content: { role: "model", parts: [{ inlineData: { mimeType: match[1], data: match[2] } }] } }], usageMetadata: null };
}

// the videos' voice-over, read by the seller's ElevenLabs or Pollinations account (src/routes/voice.ts)
app.use(createVoiceRouter([requireAuth, requirePaidAccess, aiRateLimiter]));

app.post("/api/ai/image", requireAuth, requirePaidAccess, aiRateLimiter, async (req, res) => {
  const { prompt, reference: photo, aspectRatio } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > PROMPT_MAX || !isAspectRatio(aspectRatio)) {
    return res.status(400).json({ error: IMAGE_ERRORS.badRequest });
  }
  const reference = readReference(photo);
  if (reference === "invalid") return res.status(400).json({ error: IMAGE_ERRORS.badImage });
  try {
    const service = await imageServiceOf(req.user as SessionPayload);
    const image = await drawWithService(service, { prompt: prompt.trim(), reference, aspectRatio });
    res.json({ image, provider: service.provider });
  } catch (error) {
    if (sendWordedError(res, error)) return;
    console.error("AI Image Error:", error);
    res.status(502).json({ error: IMAGE_ERRORS.failed });
  }
});

// GET /api/ai/models?provider=… — a text engine's current models, read with the seller's saved key (settings page).
app.get("/api/ai/models", requireAuth, aiRateLimiter, async (req, res) => {
  const provider = req.query.provider;
  if (!isTextProvider(provider) || provider === "gemini") return res.status(400).json({ error: TEXT_ENGINE_ERRORS.provider });
  try {
    const row = await prisma.apiSettings.findUnique({ where: { userId: (req.user as SessionPayload).sub }, select: ENGINE_KEY_SELECT });
    const key = revealSecret((row as Record<string, string | null> | null)?.[TEXT_ENGINES[provider].keyField]);
    if (!key) return res.status(400).json({ error: TEXT_ENGINE_ERRORS.noKey });
    res.json({ models: (await listTextModels(provider, key)).slice(0, 500) });
  } catch (error) {
    if (sendWordedError(res, error)) return;
    console.error("AI Models Error:", error);
    res.status(502).json({ error: TEXT_ENGINE_ERRORS.failed });
  }
});

// AI video with Google Gemini Omni Flash, through the Interactions API. Generation is a background job: start it,
// poll it, then stream the file. Free Gemini keys get no video allowance; they receive a clear "billing needed"
// message (see aiErrorResponse). Tests point the API at a local stand-in (GEMINI_API_BASE_URL, ignored in production).
const GEMINI_API = (process.env.NODE_ENV !== "production" && process.env.GEMINI_API_BASE_URL) || GOOGLE_API_BASE;

/** One call to the Gemini REST API with the user's key; a refusal is thrown with Google's status and message. */
async function geminiRest(apiKey: string, method: "GET" | "POST", path: string, body?: unknown): Promise<any> {
  const response = await fetch(`${GEMINI_API}/v1beta/${path}`, {
    method,
    headers: { "x-goog-api-key": apiKey, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60_000),
  });
  const text = await response.text();
  if (!response.ok) throw Object.assign(new Error(text.slice(0, 4000) || response.statusText), { status: response.status });
  return text ? JSON.parse(text) : {};
}

/** A clip filmed by Pollinations or fal.ai (src/routes/videoServices.ts): its job, when the token is one. */
function serviceJobOf(req: express.Request) {
  const job = readJobDetails(String(req.params.job ?? ""), (req.user as SessionPayload).sub, signVideoJob);
  return job?.service ? { id: job.id, service: job.service } : null;
}

/** Sends a video service's refusal already worded for the seller; false for any other error. */
function sendVideoServiceFailure(res: express.Response, error: unknown): boolean {
  if (!(error instanceof VideoServiceFailure)) return false;
  if (!res.headersSent) res.status(error.status).json({ error: error.message });
  return true;
}

app.post("/api/ai/video", requireAuth, requirePaidAccess, aiRateLimiter, async (req, res) => {
  const parsed = parseVideoRequest(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  let bill: Bill | null = null;
  try {
    const user = req.user as SessionPayload;
    // another video service chosen in Paramètres: filmed there with the seller's key (no points)
    const service = await videoServiceOf(user.sub);
    if (service.provider !== "gemini") {
      const started = await startServiceClip(service, parsed);
      return res.json({ job: signJob(started.id, user.sub, signVideoJob, undefined, started.service) });
    }
    const access = await resolveAiAccess(user.sub);
    if (access.mode === "none") return res.status(400).json({ error: NO_KEY_MSG });
    let points = 0;
    if (access.mode === "points") {
      bill = openBill(user.sub, access.free);
      points = access.free ? 0 : videoCharge(parsed.durationSeconds, access.settings.videoSecondCost);
      if (!(await bill.reserve(points, "video"))) return res.status(402).json(NO_CREDITS);
    }
    const interaction = await geminiRest(access.apiKey, "POST", "interactions", buildInteractionBody(parsed));
    if (typeof interaction?.id !== "string") throw new Error("Gemini returned no interaction id");
    // a clip on the platform's key is polled with that key, and refunded if Google cannot make it
    const paid = bill ? { ref: bill.ref, points } : undefined;
    sendBalance(res, bill);
    res.json({ job: signJob(interaction.id, user.sub, signVideoJob, paid) });
  } catch (error) {
    await refundQuietly(bill);
    if (sendVideoServiceFailure(res, error)) return;
    console.error("AI Video Error:", error);
    if (isQuotaError(error)) return res.status(402).json({ error: VIDEO_ERRORS.quota });
    const { status, error: message } = aiErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

/**
 * The interaction behind a job token, as Google sees it now, with the file's state when the video is a link (a file
 * can be listed before it is downloadable). Sends the error response itself and returns null on failure.
 */
async function loadVideoJob(req: express.Request, res: express.Response) {
  const user = req.user as SessionPayload;
  const job = readJobDetails(String(req.params.job ?? ""), user.sub, signVideoJob);
  if (!job) { res.status(404).json({ error: VIDEO_ERRORS.job }); return null; }
  const access = await resolveAiAccess(user.sub);
  // the key that started the clip: the platform's for a clip paid in points, otherwise the seller's own
  const apiKey = job.paid ? (access.mode === "points" ? access.apiKey : null) : access.mode === "own-key" ? access.apiKey : null;
  if (!apiKey) { res.status(400).json({ error: NO_KEY_MSG }); return null; }
  const failed = async () => {
    // once per clip, whatever the number of polls (see addCreditsOnce)
    if (job.paid?.points) await addCreditsOnce(user.sub, job.paid.points, "refund", job.paid.ref).catch((err) => console.error("Credit refund failed:", err));
    return { state: { state: "failed" as const }, apiKey, fileReady: false };
  };
  const state = readInteraction(await geminiRest(apiKey, "GET", `interactions/${job.id}`));
  if (state.state === "failed") return failed();
  if (state.state !== "done" || !state.video.uri) return { state, apiKey, fileReady: state.state === "done" };
  if (!isGoogleFileUri(state.video.uri, GEMINI_API)) return failed();
  const file = await fetch(state.video.uri, { headers: { "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(30_000) })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  // a file resource without a state is taken as ready; PROCESSING means wait
  return { state, apiKey, fileReady: !file?.state || file.state === "ACTIVE" };
}

app.get("/api/ai/video/:job", requireAuth, async (req, res) => {
  try {
    const serviceJob = serviceJobOf(req);
    if (serviceJob) {
      const state = await pollServiceClip(await videoServiceOf((req.user as SessionPayload).sub), serviceJob);
      if (state === "failed") return res.status(502).json({ done: true, error: VIDEO_ERRORS.failed });
      return res.json({ done: state === "done" });
    }
    const loaded = await loadVideoJob(req, res);
    if (!loaded) return;
    if (loaded.state.state === "failed") return res.status(502).json({ done: true, error: VIDEO_ERRORS.failed });
    res.json({ done: loaded.state.state === "done" && loaded.fileReady });
  } catch (error) {
    if (sendVideoServiceFailure(res, error)) return;
    console.error("AI Video Poll Error:", error);
    const { status, error: message } = aiErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

app.get("/api/ai/video/:job/file", requireAuth, async (req, res) => {
  try {
    const serviceJob = serviceJobOf(req);
    if (serviceJob) {
      const upstream = await openServiceClip(await videoServiceOf((req.user as SessionPayload).sub), serviceJob);
      if (!upstream.body) return res.status(502).json({ error: VIDEO_ERRORS.failed });
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.setHeader("Content-Type", upstream.headers.get("content-type")?.startsWith("video/") ? upstream.headers.get("content-type")! : "video/mp4");
      return Readable.fromWeb(upstream.body as any).pipe(res);
    }
    const loaded = await loadVideoJob(req, res);
    if (!loaded) return;
    const { state, apiKey, fileReady } = loaded;
    if (state.state === "failed") return res.status(502).json({ error: VIDEO_ERRORS.failed });
    if (state.state !== "done" || !fileReady) return res.status(409).json({ error: VIDEO_ERRORS.notReady });
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (state.video.data) {
      res.setHeader("Content-Type", state.video.mimeType);
      return res.end(Buffer.from(state.video.data, "base64"));
    }
    const upstream = await fetch(fileDownloadUrl(state.video.uri!), { headers: { "x-goog-api-key": apiKey } });
    if (!upstream.ok || !upstream.body) return res.status(502).json({ error: VIDEO_ERRORS.failed });
    res.setHeader("Content-Type", upstream.headers.get("content-type") || state.video.mimeType);
    Readable.fromWeb(upstream.body as any).pipe(res);
  } catch (error) {
    if (sendVideoServiceFailure(res, error)) return;
    console.error("AI Video File Error:", error);
    if (!res.headersSent) {
      const { status, error: message } = aiErrorResponse(error);
      res.status(status).json({ error: message });
    }
  }
});

// Telegram product trends — real MTProto read when credentials are configured,
// otherwise a clearly-labeled simulation (see server-telegram.ts).
app.get("/api/telegram-trends", requireAuth, async (_req, res) => {
  const pulse = await getTelegramPulse();
  res.json(pulse);
});

// In production (or fallback), serve static files
const distPath = path.resolve(process.cwd(), 'dist');
console.log(`Checking for static directory at: ${distPath}`);

// Files in /assets have content-hashed names, so browsers can keep them forever; index.html must stay fresh.
app.use(
  express.static(distPath, {
    setHeaders(res, filePath) {
      res.setHeader(
        "Cache-Control",
        /[\\/]assets[\\/]/.test(filePath) ? "public, max-age=31536000, immutable" : "no-cache",
      );
    },
  }),
);

// Catch-all route for SPA - handles all other GET requests
// In Express 5, use *all to catch everything
app.get('*all', (req, res, next) => {
  // Skip if it's an API route that wasn't matched
  if (req.url.startsWith('/api/')) return next();
  // In development, let Vite handle SPA routing
  if (process.env.NODE_ENV !== 'production') return next();

  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If index.html is missing, return a basic error instead of crashing
      console.error(`Error sending index.html from ${indexPath}:`, err);
      res.status(500).send("Application root (index.html) not found. Please ensure the build completed successfully.");
    }
  });
});

async function startServer() {
  try {
    // Connect to PostgreSQL via Prisma
    try {
      await prisma.$connect();
      console.log("Connected to PostgreSQL via Prisma");
    } catch (dbErr) {
      console.warn("Prisma connection warning (DB offline or unconfigured):", dbErr);
    }

    // 2. Vite middleware (development only)
    // We explicitly check for production to avoid starting Vite in the deployed container
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) {
      console.log("Starting in development mode with Vite middleware...");
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (err) {
        console.error("Failed to start Vite dev server, falling back to static:", err);
      }
    }

    if (process.env.VERCEL !== "1") {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is listening on 0.0.0.0:${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);
      });

      server.on('error', (err) => {
        console.error("Server listener error:", err);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

export default app;

