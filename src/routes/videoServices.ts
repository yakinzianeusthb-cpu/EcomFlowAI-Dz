/**
 * AI clips filmed by another service than Gemini, with the seller's own key (Gemini clips stay in server.ts, where the
 * points apply): Pollinations, fal.ai, Higgsfield, or a free Hugging Face Space. Each is a background job: started
 * here, polled, then its file streamed through the server, so the key never reaches the browser. A service's own words
 * (which may quote part of the key) are logged redacted, never passed on. Tests point the services at a local
 * stand-in (VIDEO_PROVIDERS_BASE_URL, ignored in production).
 */
import { prisma } from '../lib/prisma';
import { revealSecret } from '../lib/crypto';
import { refusalForLog } from '../lib/refusalLog';
import type { JobService, VideoRequest } from '../lib/videoJobs';
import {
  DEFAULT_VIDEO_PROVIDER, VIDEO_HOSTS, VIDEO_SERVICE_ERRORS, falAppPath, falSubmitCall, gradioSubmitCall, higgsfieldSubmitCall, higgsfieldUploadCall,
  isGradioFile, isVideoModel, isVideoProvider, pollinationsUploadCall, pollinationsVideoCall, readFalStatus, readFalVideoUrl, readGradioEvents,
  readGradioUpload, readHiggsfieldStatus, readHiggsfieldTicket, readPollinationsJob, readUploadUrl, spaceHost, videoModelFor, videoServiceError,
  type ClipState, type VideoProvider,
} from '../lib/videoProviders';

const BASE = process.env.NODE_ENV !== 'production' ? process.env.VIDEO_PROVIDERS_BASE_URL : undefined;
const HOSTS = {
  fal: BASE ? `${BASE}/fal` : VIDEO_HOSTS.fal,
  pollinations: BASE ? `${BASE}/pollinations` : VIDEO_HOSTS.pollinations,
  pollinationsMedia: BASE ? `${BASE}/pollinations-media` : VIDEO_HOSTS.pollinationsMedia,
  higgsfield: BASE ? `${BASE}/higgsfield` : VIDEO_HOSTS.higgsfield,
};
const space = (model: string) => (BASE ? `${BASE}/space` : spaceHost(model));
const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UPLOADED = new RegExp(`^${escapeRe(HOSTS.pollinationsMedia)}/[A-Za-z0-9._-]+$`);
const JOB_ID = /^[A-Za-z0-9_-]{4,256}$/;
const CALL_TIMEOUT_MS = 60_000;
/** how long one poll listens to a Space's event stream before answering "still filming" */
const SPACE_LISTEN_MS = 12_000;

type ServiceProvider = JobService['provider'];
type ServiceJob = { id: string; service: JobService };

/** A refusal already worded for the seller, with the status to answer with. */
export class VideoServiceFailure extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** The seller's video service, the model chosen there and the keys (decrypted here, used here only). */
export async function videoServiceOf(userId: string) {
  const row = await prisma.apiSettings.findUnique({
    where: { userId },
    select: { videoProvider: true, videoModel: true, pollinationsApiKey: true, falApiKey: true, higgsfieldApiKey: true, huggingfaceApiKey: true },
  });
  const provider: VideoProvider = isVideoProvider(row?.videoProvider) ? row.videoProvider : DEFAULT_VIDEO_PROVIDER;
  return {
    provider,
    model: videoModelFor(provider, isVideoModel(provider, row?.videoModel) ? row?.videoModel : null).id,
    keys: {
      pollinations: revealSecret(row?.pollinationsApiKey),
      fal: revealSecret(row?.falApiKey),
      higgsfield: revealSecret(row?.higgsfieldApiKey),
      huggingface: revealSecret(row?.huggingfaceApiKey),
    } satisfies Record<ServiceProvider, string | null>,
  };
}
export type VideoService = Awaited<ReturnType<typeof videoServiceOf>>;

/** One call; a refusal is thrown with the service's status and text (kept on the server). */
async function send(url: string, init: RequestInit, timeoutMs = CALL_TIMEOUT_MS): Promise<Response> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
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

const keyFor = (service: VideoService, provider: ServiceProvider) => {
  const key = service.keys[provider];
  if (!key) throw new VideoServiceFailure(400, VIDEO_SERVICE_ERRORS.noKey);
  return key;
};
const failed = (message: string = VIDEO_SERVICE_ERRORS.failed, status = 502) => new VideoServiceFailure(status, message);

async function startFal(request: VideoRequest, key: string, model: string): Promise<string> {
  const call = falSubmitCall(request, key, model, HOSTS.fal);
  const answer = await (await send(call.url, { method: 'POST', headers: call.headers, body: call.body })).json();
  if (!JOB_ID.test(String(answer?.request_id ?? ''))) throw failed();
  return answer.request_id;
}

/** Pollinations takes the photo as an address: uploaded to its storage first. */
async function startPollinations(request: VideoRequest, key: string, model: string): Promise<string> {
  let imageUrl: string | null = null;
  if (request.image) {
    const upload = pollinationsUploadCall(request.image, key, HOSTS.pollinationsMedia);
    imageUrl = readUploadUrl(await (await send(upload.url, { method: 'POST', headers: upload.headers, body: upload.body })).json(), UPLOADED);
    if (!imageUrl) throw failed();
  }
  const call = pollinationsVideoCall(request, key, model, imageUrl, HOSTS.pollinations);
  const response = await send(call.url, { headers: call.headers });
  const answer = response.status === 202 ? await response.json().catch(() => null) : null;
  if (!JOB_ID.test(String(answer?.id ?? ''))) throw failed();
  return answer.id;
}

/** Higgsfield too: the photo is put on its storage through a presigned address (the key never goes there). */
async function startHiggsfield(request: VideoRequest, key: string, model: string): Promise<string> {
  const image = request.image!;
  const ask = higgsfieldUploadCall(image.mimeType, key, HOSTS.higgsfield);
  const ticket = readHiggsfieldTicket(await (await send(ask.url, { method: 'POST', headers: ask.headers, body: ask.body })).json(), Boolean(BASE));
  if (!ticket) throw failed();
  await send(ticket.uploadUrl, { method: 'PUT', headers: ticket.headers, body: Buffer.from(image.data, 'base64') });
  const call = higgsfieldSubmitCall(request, key, model, ticket.publicUrl, HOSTS.higgsfield);
  const answer = await (await send(call.url, { method: 'POST', headers: call.headers, body: call.body })).json();
  if (!JOB_ID.test(String(answer?.request_id ?? ''))) throw failed();
  return answer.request_id;
}

/** A free Space: the photo uploaded to it, then the Gradio job, on the seller's free GPU time. */
async function startSpace(request: VideoRequest, token: string, model: string): Promise<string> {
  const host = space(model);
  const image = request.image!;
  const form = new FormData();
  form.append('files', new Blob([Buffer.from(image.data, 'base64')], { type: image.mimeType }), `product.${image.mimeType.split('/')[1]}`);
  const path = readGradioUpload(await (await send(`${host}/gradio_api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })).json());
  if (!path) throw failed();
  const call = gradioSubmitCall(request, token, model, path, host);
  const answer = await (await send(call.url, { method: 'POST', headers: call.headers, body: call.body })).json();
  if (!JOB_ID.test(String(answer?.event_id ?? ''))) throw failed();
  return answer.event_id;
}

const STARTERS: Record<ServiceProvider, (request: VideoRequest, key: string, model: string) => Promise<string>> = {
  fal: startFal, pollinations: startPollinations, higgsfield: startHiggsfield, huggingface: startSpace,
};

/** Starts filming a scene with the seller's service; the job id and service to sign into the job token. */
export async function startServiceClip(service: VideoService, request: VideoRequest): Promise<ServiceJob> {
  const provider = service.provider as ServiceProvider;
  try {
    const key = keyFor(service, provider);
    const model = videoModelFor(provider, service.model);
    if (model.needsPhoto && !request.image) throw new VideoServiceFailure(400, VIDEO_SERVICE_ERRORS.needsPhoto);
    return { id: await STARTERS[provider](request, key, model.id), service: { provider, model: model.id } };
  } catch (error) {
    throw asFailure(error, provider);
  }
}

/** Where a clip stands; a Space's clip comes with its file, which the Space tells only once. */
export type ClipPoll = { state: Exclude<ClipState, 'failed'>; file?: string } | { state: 'failed'; error: string; status: number };

/** Reads a Space's event stream for a few seconds: the clip may finish while we listen. */
async function pollSpace(token: string, job: ServiceJob): Promise<ClipPoll> {
  const host = space(job.service.model);
  let text = '';
  try {
    const response = await fetch(`${host}/gradio_api/call/generate_video/${job.id}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(SPACE_LISTEN_MS) });
    if (!response.ok) throw Object.assign(new Error(`space answered ${response.status}`), { status: response.status, text: await response.text() });
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      // the job's last event has fully arrived
      if (/^event: *(?:complete|error)\r?\ndata:.*\r?\n\r?\n/m.test(text)) break;
    }
    reader.cancel().catch(() => {});
  } catch (error: any) {
    // listening ended before the clip did: still filming (the next poll listens again)
    if (error?.name !== 'TimeoutError' && error?.name !== 'AbortError') throw error;
  }
  const state = readGradioEvents(text, host);
  if (state.state === 'done') return { state: 'done', file: state.file };
  if (state.state === 'failed') {
    if (!state.quota) console.error('AI Video Service Error: huggingface', refusalForLog({ status: 'error', text }));
    return state.quota ? { state: 'failed', error: VIDEO_SERVICE_ERRORS.quota, status: 402 } : { state: 'failed', error: VIDEO_SERVICE_ERRORS.failed, status: 502 };
  }
  return { state: 'running' };
}

/** Where a clip's job stands now. */
export async function pollServiceClip(service: VideoService, job: ServiceJob): Promise<ClipPoll> {
  const { provider, model } = job.service;
  try {
    const key = keyFor(service, provider);
    if (provider === 'huggingface') return await pollSpace(key, job);
    if (provider === 'higgsfield') {
      const state = readHiggsfieldStatus(await (await send(`${HOSTS.higgsfield}/requests/${job.id}/status`, { headers: { Authorization: `Key ${key}` } })).json(), Boolean(BASE));
      if (state.state === 'failed') return state.refused ? { state: 'failed', error: VIDEO_SERVICE_ERRORS.refused, status: 422 } : { state: 'failed', error: VIDEO_SERVICE_ERRORS.failed, status: 502 };
      return { state: state.state };
    }
    const state = provider === 'fal'
      ? readFalStatus(await (await send(`${HOSTS.fal}/${falAppPath(model)}/requests/${job.id}/status`, { headers: { Authorization: `Key ${key}` } })).json())
      : readPollinationsJob(await (await send(`${HOSTS.pollinations}/v1/jobs/${job.id}`, { headers: { Authorization: `Bearer ${key}` } })).json());
    return state === 'failed' ? { state: 'failed', error: VIDEO_SERVICE_ERRORS.failed, status: 502 } : { state };
  } catch (error) {
    throw asFailure(error, provider);
  }
}

/** The finished clip's address from the service, its own hosts only (in tests, the stand-in's). */
async function clipAddress(provider: ServiceProvider, key: string, job: ServiceJob): Promise<{ url: string; headers: Record<string, string> }> {
  const { model, file } = job.service;
  const standIn = (url: unknown) => (BASE && typeof url === 'string' && url.startsWith(`${BASE}/`) ? url : null);
  if (provider === 'huggingface') {
    if (!file || !isGradioFile(file, space(model))) throw failed();
    return { url: file, headers: { Authorization: `Bearer ${key}` } };
  }
  if (provider === 'higgsfield') {
    const state = readHiggsfieldStatus(await (await send(`${HOSTS.higgsfield}/requests/${job.id}/status`, { headers: { Authorization: `Key ${key}` } })).json(), Boolean(BASE));
    if (state.state !== 'done') throw failed();
    return { url: state.video, headers: {} };
  }
  const result = await (await send(`${HOSTS.fal}/${falAppPath(model)}/requests/${job.id}`, { headers: { Authorization: `Key ${key}` } })).json();
  const url = readFalVideoUrl(result) ?? standIn(result?.video?.url);
  if (!url) throw failed();
  return { url, headers: {} };
}

/** The finished clip, as the service's answer to stream to the browser. */
export async function openServiceClip(service: VideoService, job: ServiceJob): Promise<Response> {
  const { provider } = job.service;
  try {
    const key = keyFor(service, provider);
    if (provider === 'pollinations') return await send(`${HOSTS.pollinations}/v1/jobs/${job.id}/result`, { headers: { Authorization: `Bearer ${key}` } });
    const { url, headers } = await clipAddress(provider, key, job);
    return await send(url, { headers });
  } catch (error) {
    throw asFailure(error, provider);
  }
}
