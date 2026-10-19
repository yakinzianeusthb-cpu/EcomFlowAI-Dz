/**
 * Each Gemini model has its own free-tier allowance; on a free key `gemini-3-flash-preview` stops after 20 requests
 * a day. When the model in use is out of quota, the request is retried on the next one, so the tools keep working.
 * The first entry must stay the model the browser asks for (src/services/gemini.ts MODEL_NAME); a test checks it.
 */
export const TEXT_MODEL_FALLBACKS = ['gemini-3-flash-preview', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-flash-lite-latest'];

/** Image models, the one the browser asks for first (src/services/gemini.ts IMAGE_MODEL_NAME). They need a key with billing. */
export const IMAGE_MODEL_FALLBACKS = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image'];

/** Sent when the user's key has used its free requests for the day on every model we try. */
export const AI_DAILY_QUOTA_MSG = "Ta clé Gemini a atteint sa limite gratuite du jour. Réessaie demain, ou active la facturation dans Google AI Studio.";
/** Sent when Google gives this key no allowance at all for the request (free keys cannot make images or videos). */
export const AI_PAID_ONLY_MSG = "Ta clé Gemini gratuite ne permet pas de créer des images ni des vidéos. Active la facturation dans Google AI Studio pour utiliser cette fonction.";
/** Sent when every model we try is overloaded on Google's side. */
export const AI_BUSY_MSG = "Le service IA de Google est surchargé. Réessaie dans un instant.";
/** Sent when Google refuses the saved key itself. */
export const AI_INVALID_KEY_MSG = "Ta clé Gemini n'est pas valide (mal copiée, expirée ou bloquée). Crée une nouvelle clé dans Google AI Studio et colle-la dans Paramètres.";

/** True when Google refused the key itself: mistyped, expired, deleted, or blocked after a leak. */
export function isInvalidKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const message = String((error as { message?: unknown }).message ?? '');
  return /API_KEY_INVALID|API key not valid|API key expired|reported as leaked/i.test(message);
}

/** True when Google refused the request because a quota or rate limit is used up (HTTP 429 / RESOURCE_EXHAUSTED). */
export function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { status?: unknown; code?: unknown; message?: unknown };
  if (e.status === 429 || e.code === 429 || e.status === 'RESOURCE_EXHAUSTED') return true;
  const message = String(e.message ?? '');
  return /RESOURCE_EXHAUSTED|"code":\s*429|quota/i.test(message);
}

/** True when the model is overloaded or failed on Google's side (HTTP 503 UNAVAILABLE / 500 INTERNAL), not because of the request. */
export function isModelBusyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { status?: unknown; code?: unknown; message?: unknown };
  if (e.status === 503 || e.status === 500 || e.code === 503 || e.code === 500) return true;
  if (e.status === 'UNAVAILABLE' || e.status === 'INTERNAL') return true;
  return /"status":\s*"(UNAVAILABLE|INTERNAL)"/.test(String(e.message ?? ''));
}

/**
 * The status and French message (translated on the way out, see src/i18n/serverMessages.ts) for a failed AI call.
 * Upstream details are never passed on.
 */
export function aiErrorResponse(error: unknown): { status: number; error: string } {
  // 400 like a missing key: the browser shows the message instead of retrying
  if (isInvalidKeyError(error)) return { status: 400, error: AI_INVALID_KEY_MSG };
  if (isQuotaError(error)) {
    const message = String((error as { message?: unknown }).message ?? '');
    if (/limit:\s*0\b/.test(message)) return { status: 402, error: AI_PAID_ONLY_MSG };
    const daily = /PerDay/i.test(message);
    return { status: 429, error: daily ? AI_DAILY_QUOTA_MSG : 'Quota Gemini dépassé. Réessaie dans un instant.' };
  }
  if (isModelBusyError(error)) return { status: 503, error: AI_BUSY_MSG };
  return { status: 500, error: 'Erreur serveur IA.' };
}

/**
 * Calls `generate` with each model in turn until one answers. A quota error or an overloaded model moves on to the
 * next model; any other failure (an invalid key, a bad request) is thrown at once. When every model fails that way,
 * the last error is thrown.
 */
export async function generateWithFallback<T>(
  models: string[],
  generate: (model: string) => Promise<T>,
  onFallback?: (from: string, to: string) => void,
): Promise<{ result: T; model: string }> {
  if (!models.length) throw new Error('generateWithFallback needs at least one model');
  let lastError: unknown;
  for (let i = 0; i < models.length; i++) {
    try {
      return { result: await generate(models[i]), model: models[i] };
    } catch (error) {
      if (!isQuotaError(error) && !isModelBusyError(error)) throw error;
      lastError = error;
      if (i + 1 < models.length) onFallback?.(models[i], models[i + 1]);
    }
  }
  throw lastError;
}
