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
import { decryptSecret, isEncryptedSecret } from "./src/lib/crypto";
import { createRateLimiter } from "./src/lib/rateLimit";
import { createPaidAccessGuard } from "./src/lib/planGuard";
import { localizeResponses } from "./src/lib/localizeResponses";
import { languageFromCookies, localizeBody } from "./src/i18n/serverMessages";
import { SAVED_WORK_ERRORS } from "./src/lib/savedWork";
import { IMAGE_MODEL_FALLBACKS, TEXT_MODEL_FALLBACKS, aiErrorResponse, generateWithFallback, isQuotaError } from "./src/lib/aiFallback";
import {
  DEFAULT_IMAGE_PROVIDER, IMAGE_ERRORS, KEEPS_PRODUCT, OPENAI_DRAW_MODELS, OPENAI_EDIT_MODELS, PROMPT_MAX, PROVIDER_HOSTS,
  cloudflareCall, falCall, isAspectRatio, isCloudflareAccountId, isImageProvider, isModelUnavailable, openAiCall,
  providerError, readImage, readReference, type ProviderCall,
} from "./src/lib/imageProviders";
import {
  GOOGLE_API_BASE, VIDEO_ERRORS, buildInteractionBody, fileDownloadUrl, isGoogleFileUri, parseVideoRequest, readInteraction, readJob, signJob,
} from "./src/lib/videoJobs";
import { authRouter } from "./src/routes/auth";
import { catalogRouter } from "./src/routes/catalog";
import dashboardRouter from "./src/routes/dashboard";
import { historyRouter } from "./src/routes/history";
import { preferencesRouter } from "./src/routes/preferences";
import { sessionsRouter } from "./src/routes/sessions";
import { settingsRouter } from "./src/routes/settings";
import adminRouter from "./src/routes/admin";
import { projectsRouter } from "./src/routes/projects";
import { assetsRouter } from "./src/routes/assets";
import { brandRouter } from "./src/routes/brand";
import { metaRouter } from "./src/routes/meta";

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
const LARGE_BODY_PATHS = ["/api/ai/", "/api/assets", "/api/meta/campaigns", "/api/user/payment-proof", "/api/admin/", "/api/catalog", "/api/preferences", "/api/lp-sessions", "/api/chat-sessions", "/api/projects/"];
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
app.use(projectsRouter);
app.use(assetsRouter);
app.use(brandRouter);
app.use(metaRouter);

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

// Per-user Gemini key resolution. Every account (admin included) uses its own
// key, stored encrypted in api_settings and set from the Paramètres page.
// There is no platform-wide key. Returns null when the user has no key
// configured → the caller responds with NO_KEY_MSG.
async function resolveGeminiKey(session: SessionPayload): Promise<string | null> {
  const row = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { apiSettings: { select: { geminiApiKey: true } } },
  });
  const blob = row?.apiSettings?.geminiApiKey;
  if (blob && isEncryptedSecret(blob)) {
    try {
      return decryptSecret(blob);
    } catch (err) {
      console.error("Failed to decrypt user Gemini API key:", err);
    }
  }
  return null;
}

// API routes setup
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

app.post("/api/ai/generate-product", requireAuth, aiRateLimiter, async (req, res) => {
  try {
    const apiKey = await resolveGeminiKey(req.user as SessionPayload);
    if (!apiKey) return res.status(400).json({ error: NO_KEY_MSG });
    const ai = await makeAiClient(apiKey);

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

    const { result: response } = await generateWithFallback(TEXT_MODEL_FALLBACKS, (model) => ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: {
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
      }
    }), logModelFallback);

    const result = JSON.parse(response.text || '{}');
    res.json(result);
  } catch (error) {
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
  try {
    const { model = MODEL_NAME, contents, config } = req.body || {};
    if (!contents) {
      return res.status(400).json({ error: "Missing 'contents' in request body" });
    }
    if (typeof model !== "string" || !ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: "Modèle non autorisé." });
    }
    const apiKey = await resolveGeminiKey(req.user as SessionPayload);
    if (!apiKey) return res.status(400).json({ error: NO_KEY_MSG });
    const ai = await makeAiClient(apiKey);
    const models = model === MODEL_NAME ? TEXT_MODEL_FALLBACKS : IMAGE_MODEL_FALLBACKS.includes(model) ? IMAGE_MODEL_FALLBACKS : [model];
    const { result: response } = await generateWithFallback(
      models,
      (candidate) => ai.models.generateContent({ model: candidate, contents, config: sanitizeConfig(config) }),
      logModelFallback,
    );
    res.json({
      text: response.text ?? "",
      candidates: response.candidates ?? [],
      usageMetadata: response.usageMetadata ?? null,
    });
  } catch (error: any) {
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
    select: { imageProvider: true, openaiApiKey: true, falApiKey: true, cloudflareAccountId: true, cloudflareApiToken: true },
  });
  const secret = (blob?: string | null) => {
    if (!blob || !isEncryptedSecret(blob)) return null;
    try {
      return decryptSecret(blob);
    } catch {
      return null;
    }
  };
  return {
    provider: isImageProvider(row?.imageProvider) ? row.imageProvider : DEFAULT_IMAGE_PROVIDER,
    openai: secret(row?.openaiApiKey),
    fal: secret(row?.falApiKey),
    cloudflareAccount: row?.cloudflareAccountId ?? null,
    cloudflare: secret(row?.cloudflareApiToken),
  };
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

app.post("/api/ai/image", requireAuth, requirePaidAccess, aiRateLimiter, async (req, res) => {
  const { prompt, reference: photo, aspectRatio } = req.body || {};
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > PROMPT_MAX || !isAspectRatio(aspectRatio)) {
    return res.status(400).json({ error: IMAGE_ERRORS.badRequest });
  }
  const reference = readReference(photo);
  if (reference === "invalid") return res.status(400).json({ error: IMAGE_ERRORS.badImage });
  try {
    const service = await imageServiceOf(req.user as SessionPayload);
    if (service.provider === "gemini") return res.status(409).json({ error: IMAGE_ERRORS.geminiChosen });
    // a service that only draws from words would not keep the seller's product
    if (reference && !KEEPS_PRODUCT[service.provider]) return res.status(400).json({ error: IMAGE_ERRORS.noReference });
    const request = { prompt: prompt.trim(), reference, aspectRatio };
    let answer: unknown;
    if (service.provider === "openai") {
      if (!service.openai) return res.status(400).json({ error: IMAGE_ERRORS.noKey });
      const models = reference ? OPENAI_EDIT_MODELS : OPENAI_DRAW_MODELS;
      for (const [i, model] of models.entries()) {
        try {
          answer = await sendImageCall(openAiCall(request, service.openai, model, providerHost("openai")));
          break;
        } catch (error: any) {
          // a model this account cannot use yet: the next one
          if (i < models.length - 1 && isModelUnavailable(error?.status, error?.text ?? "")) continue;
          throw error;
        }
      }
    } else if (service.provider === "fal") {
      if (!service.fal) return res.status(400).json({ error: IMAGE_ERRORS.noKey });
      answer = await sendImageCall(falCall(request, service.fal, providerHost("fal")));
    } else {
      if (!service.cloudflare || !isCloudflareAccountId(service.cloudflareAccount)) return res.status(400).json({ error: IMAGE_ERRORS.noKey });
      answer = await sendImageCall(cloudflareCall(request, service.cloudflareAccount, service.cloudflare, providerHost("cloudflare")));
    }
    const image = readImage(service.provider, answer) ?? (service.provider === "fal" ? await falPictureFromLink(answer) : null);
    if (!image) return res.status(502).json({ error: IMAGE_ERRORS.failed });
    res.json({ image, provider: service.provider });
  } catch (error: any) {
    // the service's own words stay here: they may quote part of the key
    console.error("AI Image Error:", error?.status ?? error?.name ?? "unknown");
    if (error?.name === "TimeoutError") return res.status(504).json({ error: IMAGE_ERRORS.busy });
    const { status, error: message } = typeof error?.status === "number" ? providerError(error.status, error.text ?? "") : { status: 502, error: IMAGE_ERRORS.failed };
    res.status(status).json({ error: message });
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

app.post("/api/ai/video", requireAuth, requirePaidAccess, aiRateLimiter, async (req, res) => {
  const parsed = parseVideoRequest(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    const user = req.user as SessionPayload;
    const apiKey = await resolveGeminiKey(user);
    if (!apiKey) return res.status(400).json({ error: NO_KEY_MSG });
    const interaction = await geminiRest(apiKey, "POST", "interactions", buildInteractionBody(parsed));
    if (typeof interaction?.id !== "string") throw new Error("Gemini returned no interaction id");
    res.json({ job: signJob(interaction.id, user.sub, signVideoJob) });
  } catch (error) {
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
  const id = readJob(String(req.params.job ?? ""), user.sub, signVideoJob);
  if (!id) { res.status(404).json({ error: VIDEO_ERRORS.job }); return null; }
  const apiKey = await resolveGeminiKey(user);
  if (!apiKey) { res.status(400).json({ error: NO_KEY_MSG }); return null; }
  const state = readInteraction(await geminiRest(apiKey, "GET", `interactions/${id}`));
  if (state.state !== "done" || !state.video.uri) return { state, apiKey, fileReady: state.state === "done" };
  if (!isGoogleFileUri(state.video.uri, GEMINI_API)) return { state: { state: "failed" as const }, apiKey, fileReady: false };
  const file = await fetch(state.video.uri, { headers: { "x-goog-api-key": apiKey }, signal: AbortSignal.timeout(30_000) })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  // a file resource without a state is taken as ready; PROCESSING means wait
  return { state, apiKey, fileReady: !file?.state || file.state === "ACTIVE" };
}

app.get("/api/ai/video/:job", requireAuth, async (req, res) => {
  try {
    const loaded = await loadVideoJob(req, res);
    if (!loaded) return;
    if (loaded.state.state === "failed") return res.status(502).json({ done: true, error: VIDEO_ERRORS.failed });
    res.json({ done: loaded.state.state === "done" && loaded.fileReady });
  } catch (error) {
    console.error("AI Video Poll Error:", error);
    const { status, error: message } = aiErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

app.get("/api/ai/video/:job/file", requireAuth, async (req, res) => {
  try {
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

