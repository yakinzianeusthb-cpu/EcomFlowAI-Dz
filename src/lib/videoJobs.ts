/**
 * Pieces of the AI video route (Google Veo, a key with billing is needed): request checks, job tokens, safe file URLs.
 * Veo works as a long-running job: the server starts it, the browser polls, the server streams the finished file.
 */
import { timingSafeEqual } from 'crypto';

/** Fast first (cheaper, quicker); the others take over when its quota is used up. */
export const VIDEO_MODEL_FALLBACKS = ['veo-3.1-fast-generate-preview', 'veo-3.1-lite-generate-preview', 'veo-3.1-generate-preview'];

/** French messages (translated on the way out, see src/i18n/serverMessages.ts). */
export const VIDEO_ERRORS = {
  prompt: 'Décris la scène à filmer (3 à 2000 caractères).',
  image: 'Image invalide : utilise une photo PNG, JPG ou WebP de moins de 6 Mo.',
  job: 'Vidéo introuvable ou expirée.',
  notReady: "La vidéo n'est pas encore prête.",
  failed: 'La génération de la vidéo a échoué. Essaie une autre description.',
  // Veo has no free allowance: on a free key every request is refused as "quota exceeded"
  quota: "Google refuse la vidéo IA avec cette clé : il faut une clé Gemini avec facturation activée (ou ton quota vidéo du jour est épuisé).",
} as const;

export type Signer = (value: string) => string;

export interface VideoRequest {
  prompt: string;
  aspectRatio: '9:16' | '16:9';
  durationSeconds: 4 | 6 | 8;
  image?: { imageBytes: string; mimeType: string };
}

const MAX_IMAGE_BASE64 = 8_000_000; // ≈ 6 MB of image
const OPERATION_NAME = /^models\/[\w.-]+\/operations\/[\w-]+$/;

/** A token that binds a Veo operation to the user who started it, so nobody else can poll or download it. */
export function signJob(operationName: string, userId: string, sign: Signer): string {
  const body = Buffer.from(JSON.stringify({ op: operationName, u: userId })).toString('base64url');
  return `${body}.${sign(body)}`;
}

/** The operation name in a token, or null when the token is not valid for this user. */
export function readJob(token: string, userId: string, sign: Signer): string | null {
  const [body, signature, extra] = (token ?? '').split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { op?: unknown; u?: unknown };
    if (data.u !== userId || typeof data.op !== 'string' || !OPERATION_NAME.test(data.op)) return null;
    return data.op;
  } catch {
    return null;
  }
}

/** Checks what the browser sent before anything reaches Google. */
export function parseVideoRequest(body: unknown): VideoRequest | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';
  if (prompt.length < 3 || prompt.length > 2000) return { error: VIDEO_ERRORS.prompt };

  const request: VideoRequest = {
    prompt,
    aspectRatio: b.aspectRatio === '16:9' ? '16:9' : '9:16',
    durationSeconds: b.durationSeconds === 4 || b.durationSeconds === 6 ? b.durationSeconds : 8,
  };

  if (b.image !== undefined && b.image !== null && b.image !== '') {
    const match = typeof b.image === 'string' ? /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.image) : null;
    if (!match || match[2].length > MAX_IMAGE_BASE64) return { error: VIDEO_ERRORS.image };
    request.image = { imageBytes: match[2], mimeType: match[1] };
  }
  return request;
}

/** Only Google's own file service may be fetched with the user's key (no request forgery towards other hosts). */
export function isGoogleFileUri(uri: string | undefined): boolean {
  if (!uri) return false;
  try {
    const url = new URL(uri);
    return url.protocol === 'https:' && url.hostname === 'generativelanguage.googleapis.com';
  } catch {
    return false;
  }
}
