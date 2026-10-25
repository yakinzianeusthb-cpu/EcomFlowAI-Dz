/**
 * AI clips filmed by Pollinations or fal.ai, with the seller's own key (Gemini clips stay in server.ts, where the
 * points apply). Each is a background job: started here, polled, then its file streamed through the server, so the
 * key never reaches the browser. A service's own words (which may quote part of the key) are logged redacted, never
 * passed on. Tests point the services at a local stand-in (VIDEO_PROVIDERS_BASE_URL, ignored in production).
 */
import { prisma } from '../lib/prisma';
import { revealSecret } from '../lib/crypto';
import { refusalForLog } from '../lib/refusalLog';
import type { JobService, VideoRequest } from '../lib/videoJobs';
import {
  DEFAULT_VIDEO_PROVIDER, VIDEO_HOSTS, VIDEO_SERVICE_ERRORS, falAppPath, falSubmitCall, isVideoModel, isVideoProvider, pollinationsUploadCall,
  pollinationsVideoCall, readFalStatus, readFalVideoUrl, readPollinationsJob, readUploadUrl, videoModelFor, videoServiceError,
  type ClipState, type VideoProvider,
} from '../lib/videoProviders';

const BASE = process.env.NODE_ENV !== 'production' ? process.env.VIDEO_PROVIDERS_BASE_URL : undefined;
const HOSTS = {
  fal: BASE ? `${BASE}/fal` : VIDEO_HOSTS.fal,
  pollinations: BASE ? `${BASE}/pollinations` : VIDEO_HOSTS.pollinations,
  pollinationsMedia: BASE ? `${BASE}/pollinations-media` : VIDEO_HOSTS.pollinationsMedia,
};
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UPLOADED = new RegExp(`^${escapeRe(HOSTS.pollinationsMedia)}/[A-Za-z0-9._-]+$`);
const FAL_REQUEST_ID = /^[A-Za-z0-9_-]{4,256}$/;
const CALL_TIMEOUT_MS = 60_000;

/** A refusal already worded for the seller, with the status to answer with. */
export class VideoServiceFailure extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** The seller's video service, the model chosen there and the keys (decrypted here, used here only). */
export async function videoServiceOf(userId: string) {
  const row = await prisma.apiSettings.findUnique({ where: { userId }, select: { videoProvider: true, videoModel: true, pollinationsApiKey: true, falApiKey: true } });
  const provider: VideoProvider = isVideoProvider(row?.videoProvider) ? row.videoProvider : DEFAULT_VIDEO_PROVIDER;
  return {
    provider,
    model: videoModelFor(provider, isVideoModel(provider, row?.videoModel) ? row?.videoModel : null).id,
    pollinations: revealSecret(row?.pollinationsApiKey),
    fal: revealSecret(row?.falApiKey),
  };
}
export type VideoService = Awaited<ReturnType<typeof videoServiceOf>>;

/** One call; a refusal is thrown with the service's status and text (kept on the server). */
async function send(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT_MS) });
  if (!response.ok) throw Object.assign(new Error(`video service answered ${response.status}`), { status: response.status, text: await response.text() });
  return response;
}

/** Any failure as one worded for the seller; the service's own words go to the logs only. */
function asFailure(error: any, provider: string): VideoServiceFailure {
  if (error instanceof VideoServiceFailure) return error;
  console.error('AI Video Service Error:', provider, refusalForLog(error));
  if (error?.name === 'TimeoutError') return new VideoServiceFailure(504, VIDEO_SERVICE_ERRORS.busy);
  const { status, error: message } = typeof error?.status === 'number' ? videoServiceError(error.status, error.text ?? '') : { status: 502, error: VIDEO_SERVICE_ERRORS.failed };
  return new VideoServiceFailure(status, message);
}

const keyFor = (service: VideoService, provider: JobService['provider']) => {
  const key = provider === 'fal' ? service.fal : service.pollinations;
  if (!key) throw new VideoServiceFailure(400, VIDEO_SERVICE_ERRORS.noKey);
  return key;
};

/** Starts filming a scene with the seller's service; the job id and service to sign into the job token. */
export async function startServiceClip(service: VideoService, request: VideoRequest): Promise<{ id: string; service: JobService }> {
  const provider = service.provider as JobService['provider'];
  try {
    const key = keyFor(service, provider);
    const model = videoModelFor(provider, service.model);
    if (provider === 'fal') {
      if (model.needsPhoto && !request.image) throw new VideoServiceFailure(400, VIDEO_SERVICE_ERRORS.needsPhoto);
      const call = falSubmitCall(request, key, model.id, HOSTS.fal);
      const answer = await (await send(call.url, { method: 'POST', headers: call.headers, body: call.body })).json();
      if (!FAL_REQUEST_ID.test(String(answer?.request_id ?? ''))) throw new VideoServiceFailure(502, VIDEO_SERVICE_ERRORS.failed);
      return { id: answer.request_id, service: { provider, model: model.id } };
    }
    // Pollinations takes the photo as an address: uploaded to its storage first
    let imageUrl: string | null = null;
    if (request.image) {
      const upload = pollinationsUploadCall(request.image, key, HOSTS.pollinationsMedia);
      imageUrl = readUploadUrl(await (await send(upload.url, { method: 'POST', headers: upload.headers, body: upload.body })).json(), UPLOADED);
      if (!imageUrl) throw new VideoServiceFailure(502, VIDEO_SERVICE_ERRORS.failed);
    }
    const call = pollinationsVideoCall(request, key, model.id, imageUrl, HOSTS.pollinations);
    const response = await send(call.url, { headers: call.headers });
    const answer = response.status === 202 ? await response.json().catch(() => null) : null;
    if (!FAL_REQUEST_ID.test(String(answer?.id ?? ''))) throw new VideoServiceFailure(502, VIDEO_SERVICE_ERRORS.failed);
    return { id: answer.id, service: { provider, model: model.id } };
  } catch (error) {
    throw asFailure(error, provider);
  }
}

/** Where a clip's job stands now. */
export async function pollServiceClip(service: VideoService, job: { id: string; service: JobService }): Promise<ClipState> {
  const { provider, model } = job.service;
  try {
    const key = keyFor(service, provider);
    if (provider === 'fal') {
      const response = await send(`${HOSTS.fal}/${falAppPath(model)}/requests/${job.id}/status`, { headers: { Authorization: `Key ${key}` } });
      return readFalStatus(await response.json());
    }
    return readPollinationsJob(await (await send(`${HOSTS.pollinations}/v1/jobs/${job.id}`, { headers: { Authorization: `Bearer ${key}` } })).json());
  } catch (error) {
    throw asFailure(error, provider);
  }
}

/** The finished clip, as the service's answer to stream to the browser. */
export async function openServiceClip(service: VideoService, job: { id: string; service: JobService }): Promise<Response> {
  const { provider, model } = job.service;
  try {
    const key = keyFor(service, provider);
    if (provider === 'fal') {
      const result = await (await send(`${HOSTS.fal}/${falAppPath(model)}/requests/${job.id}`, { headers: { Authorization: `Key ${key}` } })).json();
      // fal's own media host only (in tests, the stand-in's)
      const standIn = BASE && typeof result?.video?.url === 'string' && result.video.url.startsWith(`${BASE}/`) ? result.video.url : null;
      const url = readFalVideoUrl(result) ?? standIn;
      if (!url) throw new VideoServiceFailure(502, VIDEO_SERVICE_ERRORS.failed);
      return await send(url, {});
    }
    return await send(`${HOSTS.pollinations}/v1/jobs/${job.id}/result`, { headers: { Authorization: `Bearer ${key}` } });
  } catch (error) {
    throw asFailure(error, provider);
  }
}
