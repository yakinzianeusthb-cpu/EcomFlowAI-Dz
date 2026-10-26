/**
 * Pieces of the AI video route (Google Gemini Omni Flash, a key with billing is needed): request checks, the
 * request sent to Google, reading its answer, job tokens, safe file URLs. Omni runs through the Interactions API as
 * a background job: the server starts it, the browser polls, the server streams the finished file.
 * (It replaces Veo 3.1, which Google shuts down on 2026-10-22.)
 */
import { timingSafeEqual } from 'crypto';
import { isVideoModel, isVideoProvider, type VideoProvider } from './videoProviders';

export const VIDEO_MODEL = 'gemini-omni-1.1-flash';
/** 720p is the model's native size (1080p and 4K are upscaled) and the price quoted to the seller (~$0.10 a second). */
export const VIDEO_RESOLUTION = '720p';
export const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com';

/** French messages (translated on the way out, see src/i18n/serverMessages.ts). */
export const VIDEO_ERRORS = {
  prompt: 'Décris la scène à filmer (3 à 2000 caractères).',
  image: 'Image invalide : utilise une photo PNG, JPG ou WebP de moins de 6 Mo.',
  job: 'Vidéo introuvable ou expirée.',
  notReady: "La vidéo n'est pas encore prête.",
  failed: 'La génération de la vidéo a échoué. Essaie une autre description.',
  // video has no free allowance: on a free key every request is refused as "quota exceeded"
  quota: "Google refuse la vidéo IA avec cette clé : il faut une clé Gemini avec facturation activée (ou ton quota vidéo du jour est épuisé).",
} as const;

export type Signer = (value: string) => string;

export interface VideoRequest {
  prompt: string;
  aspectRatio: '9:16' | '16:9';
  /** the scene's length in the video; said in the prompt (the model has no length setting) */
  durationSeconds: 4 | 6 | 8;
  image?: { data: string; mimeType: string };
}

const MAX_IMAGE_BASE64 = 8_000_000; // ≈ 6 MB of image
/** Interaction ids are opaque; letters, digits, "_" and "-" only, so nothing can be smuggled into the request path. */
const INTERACTION_ID = /^[A-Za-z0-9_-]{4,256}$/;

/** A clip paid in points on the platform's key: the points taken and the charge's reference, for a refund if it fails. */
export interface PaidJob {
  ref: string;
  points: number;
}

/** A clip filmed by another service than Gemini (src/lib/videoProviders.ts), polled and fetched there. */
export interface JobService {
  provider: Exclude<VideoProvider, 'gemini'>;
  model: string;
  /** the finished clip's address, when the service can tell it only once (a Hugging Face Space) */
  file?: string;
}

/**
 * A token that binds a clip's job to the user who started it, so nobody else can poll or download it. A clip made
 * on the platform's key carries `paid`, so it is polled with that key and refunded if Google cannot make it; a clip
 * filmed by another service carries `service`.
 */
export function signJob(interactionId: string, userId: string, sign: Signer, paid?: PaidJob, service?: JobService): string {
  const body = Buffer.from(JSON.stringify({
    i: interactionId,
    u: userId,
    ...(paid ? { p: { r: paid.ref, c: paid.points } } : {}),
    ...(service ? { v: service.provider, m: service.model, ...(service.file ? { f: service.file } : {}) } : {}),
  })).toString('base64url');
  return `${body}.${sign(body)}`;
}

const REF = /^[A-Za-z0-9_-]{8,64}$/;

/** The job id, payment and service in a token, or null when the token is not valid for this user. */
export function readJobDetails(token: string, userId: string, sign: Signer): { id: string; paid: PaidJob | null; service?: JobService } | null {
  const [body, signature, extra] = (token ?? '').split('.');
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { i?: unknown; u?: unknown; p?: { r?: unknown; c?: unknown }; v?: unknown; m?: unknown; f?: unknown };
    if (data.u !== userId || typeof data.i !== 'string' || !INTERACTION_ID.test(data.i)) return null;
    const p = data.p;
    const paid = p && typeof p.r === 'string' && REF.test(p.r) && Number.isInteger(p.c) && (p.c as number) >= 0 ? { ref: p.r, points: p.c as number } : null;
    if (p && !paid) return null;
    if (data.v === undefined) return { id: data.i, paid };
    if (!isVideoProvider(data.v) || data.v === 'gemini' || !isVideoModel(data.v, data.m)) return null;
    if (data.f !== undefined && (typeof data.f !== 'string' || data.f.length > 2000)) return null;
    return { id: data.i, paid, service: { provider: data.v, model: data.m, ...(typeof data.f === 'string' ? { file: data.f } : {}) } };
  } catch {
    return null;
  }
}

/** The interaction id in a token, or null when the token is not valid for this user. */
export function readJob(token: string, userId: string, sign: Signer): string | null {
  return readJobDetails(token, userId, sign)?.id ?? null;
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
    request.image = { data: match[2], mimeType: match[1] };
  }
  return request;
}

/** The Interactions API request: the photo (when there is one) and the direction, a background job with a file link. */
export function buildInteractionBody(request: VideoRequest): Record<string, unknown> {
  const input: Record<string, string>[] = [];
  if (request.image) input.push({ type: 'image', data: request.image.data, mime_type: request.image.mimeType });
  input.push({ type: 'text', text: request.prompt });
  return {
    model: VIDEO_MODEL,
    input,
    generation_config: { video_config: { task: request.image ? 'image_to_video' : 'text_to_video' } },
    // a link rather than inline bytes: a clip with sound is often over the 4 MB inline limit
    response_format: { type: 'video', aspect_ratio: request.aspectRatio, resolution: VIDEO_RESOLUTION, delivery: 'uri' },
    background: true,
  };
}

export interface FinishedVideo {
  uri?: string;
  data?: string;
  mimeType: string;
}

export type InteractionState = { state: 'running' } | { state: 'done'; video: FinishedVideo } | { state: 'failed' };

/** The first video part in Google's answer (the REST `steps`, or the SDKs' `output_video`), if any. */
function findVideo(node: unknown, depth = 0): FinishedVideo | null {
  if (!node || typeof node !== 'object' || depth > 6) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findVideo(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  const part = node as Record<string, unknown>;
  const uri = typeof part.uri === 'string' ? part.uri : undefined;
  const data = typeof part.data === 'string' ? part.data : undefined;
  const mimeType = typeof part.mime_type === 'string' ? part.mime_type : typeof part.mimeType === 'string' ? part.mimeType : '';
  if ((part.type === 'video' || mimeType.startsWith('video/')) && (uri || data)) {
    return { ...(uri ? { uri } : { data }), mimeType: mimeType || 'video/mp4' };
  }
  for (const key of ['output_video', 'steps', 'content', 'outputs']) {
    const found = findVideo(part[key], depth + 1);
    if (found) return found;
  }
  return null;
}

/** Where a background interaction stands, read from Google's answer. */
export function readInteraction(body: unknown): InteractionState {
  if (!body || typeof body !== 'object') return { state: 'failed' };
  const b = body as Record<string, unknown>;
  if (b.error) return { state: 'failed' };
  if (b.status === 'in_progress') return { state: 'running' };
  if (b.status === 'completed') {
    const video = findVideo(b);
    return video ? { state: 'done', video } : { state: 'failed' };
  }
  return { state: 'failed' };
}

/** Only Google's own file service (or the configured stand-in, in tests) may be fetched with the user's key. */
export function isGoogleFileUri(uri: string | undefined, apiBase: string = GOOGLE_API_BASE): boolean {
  if (!uri) return false;
  try {
    const url = new URL(uri);
    const base = new URL(apiBase);
    return url.protocol === base.protocol && url.host === base.host;
  } catch {
    return false;
  }
}

/** A file link from Google, as the address its bytes are downloaded from. */
export function fileDownloadUrl(uri: string): string {
  return uri.includes(':download') ? uri : `${uri}:download?alt=media`;
}
