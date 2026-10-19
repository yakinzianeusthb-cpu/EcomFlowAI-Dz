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
import { getCurrentUser, purposeSigner, requireAuth, SessionPayload } from "./src/lib/session";
import { decryptSecret, isEncryptedSecret } from "./src/lib/crypto";
import { createRateLimiter } from "./src/lib/rateLimit";
import { createPaidAccessGuard } from "./src/lib/planGuard";
import { localizeResponses } from "./src/lib/localizeResponses";
import { languageFromCookies, localizeBody } from "./src/i18n/serverMessages";
import { SAVED_WORK_ERRORS } from "./src/lib/savedWork";
import { IMAGE_MODEL_FALLBACKS, TEXT_MODEL_FALLBACKS, aiErrorResponse, generateWithFallback, isQuotaError } from "./src/lib/aiFallback";
import { VIDEO_ERRORS, VIDEO_MODEL_FALLBACKS, isGoogleFileUri, parseVideoRequest, readJob, signJob } from "./src/lib/videoJobs";
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
// no longer pick arbitrary (potentially expensive) models.
const ALLOWED_MODELS = new Set([MODEL_NAME, "gemini-2.5-flash-image"]);

// A model out of quota is replaced by the next one in TEXT_MODEL_FALLBACKS (see src/lib/aiFallback.ts).
const logModelFallback = (from: string, to: string) => console.warn(`Gemini quota used up on ${from}; retrying with ${to}`);

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

function sanitizeConfig(config: unknown): Record<string, unknown> | undefined {
  if (!config || typeof config !== "object") return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SAFE_CONFIG_KEYS.has(k)) out[k] = v;
  }
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
    const models = model === MODEL_NAME ? TEXT_MODEL_FALLBACKS : model === IMAGE_MODEL_FALLBACKS[0] ? IMAGE_MODEL_FALLBACKS : [model];
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

// AI video with Google Veo. Generation is a long-running job: start it, poll it, then stream the file.
// Free Gemini keys get no Veo allowance; they receive a clear "billing needed" message (see aiErrorResponse).
app.post("/api/ai/video", requireAuth, requirePaidAccess, aiRateLimiter, async (req, res) => {
  const parsed = parseVideoRequest(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    const user = req.user as SessionPayload;
    const apiKey = await resolveGeminiKey(user);
    if (!apiKey) return res.status(400).json({ error: NO_KEY_MSG });
    const ai = await makeAiClient(apiKey);
    const { result: operation } = await generateWithFallback(
      VIDEO_MODEL_FALLBACKS,
      (model) => ai.models.generateVideos({
        model,
        prompt: parsed.prompt,
        image: parsed.image,
        config: { aspectRatio: parsed.aspectRatio, numberOfVideos: 1, durationSeconds: parsed.durationSeconds },
      }),
      logModelFallback,
    );
    if (!operation?.name) throw new Error("Veo returned no operation name");
    res.json({ job: signJob(operation.name, user.sub, signVideoJob) });
  } catch (error) {
    console.error("AI Video Error:", error);
    if (isQuotaError(error)) return res.status(402).json({ error: VIDEO_ERRORS.quota });
    const { status, error: message } = aiErrorResponse(error);
    res.status(status).json({ error: message });
  }
});

/** The Veo operation behind a job token, refreshed from Google; sends the error response itself and returns null on failure. */
async function loadVideoJob(req: express.Request, res: express.Response) {
  const user = req.user as SessionPayload;
  const name = readJob(String(req.params.job ?? ""), user.sub, signVideoJob);
  if (!name) { res.status(404).json({ error: VIDEO_ERRORS.job }); return null; }
  const apiKey = await resolveGeminiKey(user);
  if (!apiKey) { res.status(400).json({ error: NO_KEY_MSG }); return null; }
  const ai = await makeAiClient(apiKey);
  const { GenerateVideosOperation } = await import("@google/genai");
  const operation = await ai.operations.getVideosOperation({ operation: Object.assign(new GenerateVideosOperation(), { name }) });
  return { operation, apiKey };
}

app.get("/api/ai/video/:job", requireAuth, async (req, res) => {
  try {
    const loaded = await loadVideoJob(req, res);
    if (!loaded) return;
    const { operation } = loaded;
    if (!operation.done) return res.json({ done: false });
    if (operation.error || !operation.response?.generatedVideos?.[0]?.video) return res.status(502).json({ done: true, error: VIDEO_ERRORS.failed });
    res.json({ done: true });
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
    const { operation, apiKey } = loaded;
    if (!operation.done) return res.status(409).json({ error: VIDEO_ERRORS.notReady });
    const video = operation.response?.generatedVideos?.[0]?.video;
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (video?.videoBytes) {
      res.setHeader("Content-Type", video.mimeType || "video/mp4");
      return res.end(Buffer.from(video.videoBytes, "base64"));
    }
    if (!isGoogleFileUri(video?.uri)) return res.status(502).json({ error: VIDEO_ERRORS.failed });
    const upstream = await fetch(video!.uri!, { headers: { "x-goog-api-key": apiKey } });
    if (!upstream.ok || !upstream.body) return res.status(502).json({ error: VIDEO_ERRORS.failed });
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "video/mp4");
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

