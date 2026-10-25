/**
 * The AI services that film the scenes of a video: Google Gemini Omni (the default, with the seller's Gemini key or
 * their points: see videoJobs.ts), Pollinations (one key, many models, a few cents a second) or fal.ai (Kling,
 * Seedance, Wan, with the seller's fal key). This file holds the models and builds each service's requests and reads
 * its answers, without any network call: the server makes them with the seller's key, which never leaves the server.
 * Each service films in the background: the server starts the job, the browser polls, the server streams the file.
 */
import type { VideoRequest } from './videoJobs';

export type VideoProvider = 'gemini' | 'pollinations' | 'fal';
/** In the order the settings list them; the first is the default. */
export const VIDEO_PROVIDERS: readonly VideoProvider[] = ['gemini', 'pollinations', 'fal'];
export const DEFAULT_VIDEO_PROVIDER: VideoProvider = 'gemini';
export const VIDEO_PROVIDER_NAMES: Record<VideoProvider, string> = { gemini: 'Google Gemini', pollinations: 'Pollinations', fal: 'fal.ai' };
export const isVideoProvider = (value: unknown): value is VideoProvider => VIDEO_PROVIDERS.includes(value as VideoProvider);

export interface VideoModel {
  id: string;
  name: string;
  /** the price of a filmed second, in US dollars or in Pollen (about a dollar each) */
  perSecond: number;
  currency: 'usd' | 'pollen';
  /** whether the clip comes with its own sound */
  audio: boolean;
  /** the lengths it can film, in seconds */
  durations: readonly number[];
  /** fal's image-to-video models cannot film without the product photo */
  needsPhoto?: boolean;
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/** Each service's models, its default first (prices from the services' own price lists, October 2026). */
export const VIDEO_MODELS: Record<VideoProvider, readonly VideoModel[]> = {
  gemini: [{ id: 'gemini-omni-1.1-flash', name: 'Gemini Omni Flash', perSecond: 0.1, currency: 'usd', audio: true, durations: [4, 6, 8] }],
  pollinations: [
    { id: 'bytedance/seedance-2.0-fast', name: 'Seedance 2.0 Fast', perSecond: 0.07, currency: 'pollen', audio: true, durations: [4, 5] },
    { id: 'google/veo-3.1-fast', name: 'Veo 3.1 Fast', perSecond: 0.1, currency: 'pollen', audio: true, durations: [4, 6, 8] },
    { id: 'alibaba/wan-2.2-fast', name: 'Wan 2.2 Fast', perSecond: 0.01, currency: 'pollen', audio: false, durations: range(2, 15) },
  ],
  fal: [
    { id: 'fal-ai/kling-video/v3/standard/image-to-video', name: 'Kling 3 Standard', perSecond: 0.126, currency: 'usd', audio: true, durations: range(3, 15), needsPhoto: true },
    { id: 'bytedance/seedance-2.0/mini/image-to-video', name: 'Seedance 2.0 Mini', perSecond: 0.155, currency: 'usd', audio: true, durations: range(4, 15), needsPhoto: true },
    { id: 'wan/v2.6/image-to-video/flash', name: 'Wan 2.6 Flash', perSecond: 0.05, currency: 'usd', audio: true, durations: [5, 10, 15], needsPhoto: true },
  ],
};

export const isVideoModel = (provider: VideoProvider, id: unknown): id is string => VIDEO_MODELS[provider].some((m) => m.id === id);
/** The model chosen for the service, or the service's default. */
export const videoModelFor = (provider: VideoProvider, id: string | null | undefined): VideoModel =>
  VIDEO_MODELS[provider].find((m) => m.id === id) ?? VIDEO_MODELS[provider][0];

/** The length the model films for `wanted` seconds: that one when it can, otherwise the nearest (the longer on a tie). */
export function pickDuration(durations: readonly number[], wanted: number): number {
  return durations.reduce((best, d) => {
    const gap = Math.abs(d - wanted) - Math.abs(best - wanted);
    return gap < 0 || (gap === 0 && d > best) ? d : best;
  });
}

export const VIDEO_HOSTS = {
  fal: 'https://queue.fal.run',
  pollinations: 'https://gen.pollinations.ai',
  pollinationsMedia: 'https://media.pollinations.ai',
} as const;

export interface VideoCall {
  url: string;
  headers: Record<string, string>;
  body: string;
}

const dataUrl = (image: NonNullable<VideoRequest['image']>) => `data:${image.mimeType};base64,${image.data}`;

/** fal's queue: the request for the model, each model with its own field names. */
export function falSubmitCall(request: VideoRequest, key: string, modelId: string, host: string = VIDEO_HOSTS.fal): VideoCall {
  const model = videoModelFor('fal', modelId);
  const duration = String(pickDuration(model.durations, request.durationSeconds));
  const image = request.image ? dataUrl(request.image) : '';
  const fields: Record<string, unknown> = model.id.startsWith('fal-ai/kling-video')
    ? { prompt: request.prompt, start_image_url: image, duration, generate_audio: true }
    : model.id.startsWith('bytedance/seedance')
      ? { prompt: request.prompt, image_url: image, duration, aspect_ratio: request.aspectRatio, resolution: '720p', generate_audio: true }
      : { prompt: request.prompt, image_url: image, duration, resolution: '720p', generate_audio: true };
  return { url: `${host}/${model.id}`, headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(fields) };
}

/** fal's status and result addresses use only the owner and app part of the model id. */
export const falAppPath = (modelId: string) => modelId.split('/').slice(0, 2).join('/');

export type ClipState = 'running' | 'done' | 'failed';

export function readFalStatus(answer: unknown): ClipState {
  const status = (answer as { status?: unknown; error?: unknown } | null)?.status;
  if (status === 'IN_QUEUE' || status === 'IN_PROGRESS') return 'running';
  return status === 'COMPLETED' && !(answer as { error?: unknown }).error ? 'done' : 'failed';
}

const FAL_MEDIA = /^https:\/\/(?:[a-z0-9-]+\.)*fal\.media\//;
/** The finished clip's address; only fal's own media host is fetched. */
export function readFalVideoUrl(answer: unknown): string | null {
  const url = (answer as { video?: { url?: unknown } } | null)?.video?.url;
  return typeof url === 'string' && FAL_MEDIA.test(url) ? url : null;
}

/** Pollinations takes the photo as an address: it is uploaded to its media storage first, its metadata stripped. */
export function pollinationsUploadCall(image: NonNullable<VideoRequest['image']>, key: string, host: string = VIDEO_HOSTS.pollinationsMedia): VideoCall {
  return {
    url: `${host}/upload?safe=privacy`,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: image.data, contentType: image.mimeType, name: `product.${image.mimeType.split('/')[1]}` }),
  };
}

const POLLINATIONS_MEDIA = /^https:\/\/media\.pollinations\.ai\/[A-Za-z0-9._-]+$/;
export function readUploadUrl(answer: unknown, pattern: RegExp = POLLINATIONS_MEDIA): string | null {
  const url = (answer as { url?: unknown } | null)?.url;
  return typeof url === 'string' && pattern.test(url) ? url : null;
}

/** The video as a background job (Prefer: respond-async), the uploaded photo as its first frame. */
export function pollinationsVideoCall(request: VideoRequest, key: string, modelId: string, imageUrl: string | null, host: string = VIDEO_HOSTS.pollinations): Omit<VideoCall, 'body'> {
  const model = videoModelFor('pollinations', modelId);
  const params = new URLSearchParams({ model: model.id, duration: String(pickDuration(model.durations, request.durationSeconds)), aspectRatio: request.aspectRatio });
  if (model.audio) params.set('audio', 'true');
  if (imageUrl) params.set('image', imageUrl);
  return { url: `${host}/video/${encodeURIComponent(request.prompt)}?${params}`, headers: { Authorization: `Bearer ${key}`, Prefer: 'respond-async' } };
}

export function readPollinationsJob(answer: unknown): ClipState {
  const status = (answer as { status?: unknown } | null)?.status;
  if (status === 'succeeded') return 'done';
  return status === 'pending' || status === 'running' || status === 'queued' || status === 'processing' ? 'running' : 'failed';
}

/** The messages a seller can get (French, translated on the way out: src/i18n/serverMessages.ts). */
export const VIDEO_SERVICE_ERRORS = {
  noKey: "Ajoute la clé du service vidéo choisi dans Paramètres (Vidéo IA).",
  badKey: "Le service vidéo refuse ta clé (mal copiée, expirée ou sans accès). Vérifie-la dans Paramètres.",
  noCredit: "Ton compte du service vidéo n'a plus de crédit, ou ce modèle demande un compte payant.",
  busy: "Le service vidéo est occupé ou ta limite est atteinte. Réessaie dans un instant.",
  refused: "Le service vidéo a refusé cette scène (règles de contenu). Modifie la description et réessaie.",
  failed: "Le service vidéo n'a pas pu filmer cette scène. Réessaie.",
  needsPhoto: "Ce modèle filme à partir de la photo du produit : ajoute une photo dans la vidéo.",
} as const;

/** A service's refusal as the seller's message and the status to answer with; nothing of the service's text is passed on. */
export function videoServiceError(status: number, text: string): { status: number; error: string } {
  const body = text.toLowerCase();
  if (status === 402 || /insufficient|exhausted balance|payment|credit|balance/.test(body)) return { status: 402, error: VIDEO_SERVICE_ERRORS.noCredit };
  if (status === 401 || status === 403) return { status: 403, error: VIDEO_SERVICE_ERRORS.badKey };
  if (status === 429 || status === 503) return { status: 429, error: VIDEO_SERVICE_ERRORS.busy };
  if (/content_policy|content_blocked|moderation|safety|nsfw/.test(body)) return { status: 422, error: VIDEO_SERVICE_ERRORS.refused };
  return { status: 502, error: VIDEO_SERVICE_ERRORS.failed };
}
