/**
 * The AI services that film the scenes of a video: Google Gemini Omni (the default, with the seller's Gemini key or
 * their points: see videoJobs.ts), Pollinations (one key, many models, a few cents a second) or fal.ai (Kling,
 * Seedance, Wan, with the seller's fal key). This file holds the models and builds each service's requests and reads
 * its answers, without any network call: the server makes them with the seller's key, which never leaves the server.
 * Each service films in the background: the server starts the job, the browser polls, the server streams the file.
 */
import type { VideoRequest } from './videoJobs';

export type VideoProvider = 'gemini' | 'huggingface' | 'pollinations' | 'fal' | 'higgsfield';
/** In the order the settings list them; the first is the default. */
export const VIDEO_PROVIDERS: readonly VideoProvider[] = ['gemini', 'huggingface', 'pollinations', 'fal', 'higgsfield'];
export const DEFAULT_VIDEO_PROVIDER: VideoProvider = 'gemini';
export const VIDEO_PROVIDER_NAMES: Record<VideoProvider, string> = {
  gemini: 'Google Gemini', huggingface: 'Hugging Face', pollinations: 'Pollinations', fal: 'fal.ai', higgsfield: 'Higgsfield',
};
export const isVideoProvider = (value: unknown): value is VideoProvider => VIDEO_PROVIDERS.includes(value as VideoProvider);

export interface VideoModel {
  id: string;
  name: string;
  /**
   * The price of a filmed second, in US dollars or in Pollen (about a dollar each); 0 for a free model, null when the
   * service does not publish it (it is shown on the seller's account there).
   */
  perSecond: number | null;
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
  // a public Space on Hugging Face's free GPUs: free within the daily GPU time of the seller's Hugging Face account
  huggingface: [{ id: 'zerogpu-aoti/wan2-2-fp8da-aoti-faster', name: 'Wan 2.2', perSecond: 0, currency: 'usd', audio: false, durations: [2, 3, 4, 5], needsPhoto: true }],
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
  // Higgsfield bills its own credits per model, shown in its console only
  higgsfield: [
    { id: 'kling-video/v3.0/std/image-to-video', name: 'Kling 3.0 Standard', perSecond: null, currency: 'usd', audio: true, durations: range(3, 15), needsPhoto: true },
    { id: 'bytedance/seedance-2.0/image-to-video', name: 'Seedance 2.0', perSecond: null, currency: 'usd', audio: true, durations: range(4, 15), needsPhoto: true },
    { id: 'wan/v2.7/image-to-video', name: 'Wan 2.7', perSecond: null, currency: 'usd', audio: false, durations: range(2, 15), needsPhoto: true },
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
  higgsfield: 'https://api.higgsfield.ai',
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

const isHttps = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

/** Higgsfield takes the photo as an address: it is uploaded first through a presigned storage address. */
export function higgsfieldUploadCall(contentType: string, key: string, host: string = VIDEO_HOSTS.higgsfield): VideoCall {
  return { url: `${host}/files/generate-upload-url`, headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ content_type: contentType }) };
}

/** The storage address to PUT the photo to, the headers it needs (storage ones only) and the photo's public address. */
export function readHiggsfieldTicket(answer: unknown, allowHttp = false): { publicUrl: string; uploadUrl: string; headers: Record<string, string> } | null {
  const a = (answer ?? {}) as { public_url?: unknown; upload_url?: unknown; upload_headers?: Record<string, unknown> };
  const ok = (url: unknown): url is string => isHttps(url) || (allowHttp && typeof url === 'string' && url.startsWith('http://'));
  if (!ok(a.public_url) || !ok(a.upload_url)) return null;
  // the key never goes to the storage address: only the content headers it asked for
  const headers = Object.fromEntries(Object.entries(a.upload_headers ?? {}).filter(([k, v]) => typeof v === 'string' && /^(content-type|x-amz-[a-z-]+)$/i.test(k))) as Record<string, string>;
  return { publicUrl: a.public_url, uploadUrl: a.upload_url, headers };
}

/** A generation request for the model, each model with its own fields; the idempotency key makes a retry safe. */
export function higgsfieldSubmitCall(request: VideoRequest, key: string, modelId: string, imageUrl: string, host: string = VIDEO_HOSTS.higgsfield): VideoCall {
  const model = videoModelFor('higgsfield', modelId);
  const duration = pickDuration(model.durations, request.durationSeconds);
  const fields: Record<string, unknown> = model.id.startsWith('kling-video')
    ? { prompt: request.prompt, image_url: imageUrl, duration, sound: 'on' }
    : model.id.startsWith('bytedance/seedance')
      ? { prompt: request.prompt, image_url: imageUrl, duration, resolution: '720p', generate_audio: true }
      : { prompt: request.prompt, image_url: imageUrl, duration, resolution: '720p' };
  return {
    url: `${host}/${model.id}`,
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(fields),
  };
}

export type HiggsfieldState = { state: 'running' } | { state: 'done'; video: string } | { state: 'failed'; refused?: true };

export function readHiggsfieldStatus(answer: unknown, allowHttp = false): HiggsfieldState {
  const a = (answer ?? {}) as { status?: unknown; video?: { url?: unknown } };
  if (a.status === 'queued' || a.status === 'in_progress') return { state: 'running' };
  if (a.status === 'nsfw') return { state: 'failed', refused: true };
  const url = a.video?.url;
  if (a.status === 'completed' && (isHttps(url) || (allowHttp && typeof url === 'string' && url.startsWith('http://')))) return { state: 'done', video: url as string };
  return { state: 'failed' };
}

/** A Space's address from its name: "owner/name" → https://owner-name.hf.space. */
export const spaceHost = (repoId: string) => `https://${repoId.toLowerCase().replace(/[/._]/g, '-')}.hf.space`;

/** the Space's own negative prompt (what Wan should avoid), sent as it is */
const WAN_NEGATIVE = '色调艳丽, 过曝, 静态, 细节模糊不清, 字幕, 风格, 作品, 画作, 画面, 静止, 整体发灰, 最差质量, 低质量, JPEG压缩残留, 丑陋的, 残缺的, 多余的手指, 画得不好的手部, 画得不好的脸部, 畸形的, 毁容的, 形态畸形的肢体, 手指融合, 静止不动的画面, 杂乱的背景, 三条腿, 背景人很多, 倒着走';

/** Where the Space stored the photo uploaded to it (POST /gradio_api/upload): its own temporary folder only. */
export function readGradioUpload(answer: unknown): string | null {
  const path = Array.isArray(answer) ? answer[0] : null;
  return typeof path === 'string' && /^\/tmp\/gradio\/[\w-]+\/[\w.-]+$/.test(path) ? path : null;
}

/**
 * The Space's job (Gradio API): the photo uploaded to it first, then its other inputs in order (prompt, steps,
 * negative prompt, length, the two guidance scales, seed, random seed). The seller's token spends their free GPU time.
 */
export function gradioSubmitCall(request: VideoRequest, token: string, modelId: string, imagePath: string | null, host: string = spaceHost(modelId)): VideoCall {
  const model = videoModelFor('huggingface', modelId);
  const mime = request.image?.mimeType ?? 'image/png';
  const image = imagePath ? { path: imagePath, orig_name: `product.${mime.split('/')[1]}`, mime_type: mime, meta: { _type: 'gradio.FileData' } } : null;
  return {
    url: `${host}/gradio_api/call/generate_video`,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [image, request.prompt, 6, WAN_NEGATIVE, pickDuration(model.durations, request.durationSeconds), 1, 1, 42, true] }),
  };
}

/** Only the Space's own files are fetched. */
export const isGradioFile = (url: string, host: string) => url.startsWith(`${host}/gradio_api/file=`);

export type GradioState = { state: 'running' } | { state: 'done'; file: string } | { state: 'failed'; quota?: true };

/** Where a Space's job stands, from the part of its event stream read so far. */
export function readGradioEvents(text: string, host: string): GradioState {
  const events = text.split(/\n\n+/).map((block) => ({
    event: /^event: *(.*)$/m.exec(block)?.[1]?.trim(),
    data: /^data: *(.*)$/m.exec(block)?.[1] ?? '',
  }));
  const error = events.find((e) => e.event === 'error');
  if (error) return /quota|exceeded|gpu time|zerogpu/i.test(error.data) ? { state: 'failed', quota: true } : { state: 'failed' };
  const complete = events.find((e) => e.event === 'complete');
  if (!complete) return { state: 'running' };
  try {
    const [video] = JSON.parse(complete.data) as [{ url?: unknown; video?: { url?: unknown } }];
    const url = typeof video?.video?.url === 'string' ? video.video.url : video?.url;
    return typeof url === 'string' && isGradioFile(url, host) ? { state: 'done', file: url } : { state: 'failed' };
  } catch {
    return { state: 'failed' };
  }
}

/** The messages a seller can get (French, translated on the way out: src/i18n/serverMessages.ts). */
export const VIDEO_SERVICE_ERRORS = {
  quota: "Ton temps de GPU gratuit Hugging Face du jour est épuisé (il revient chaque jour). Réessaie plus tard ou choisis un autre service vidéo.",
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
