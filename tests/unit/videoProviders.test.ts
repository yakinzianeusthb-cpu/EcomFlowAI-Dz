import { describe, expect, it } from 'vitest';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import {
  DEFAULT_VIDEO_PROVIDER, VIDEO_MODELS, VIDEO_PROVIDERS, VIDEO_SERVICE_ERRORS,
  falAppPath, falSubmitCall, gradioSubmitCall, higgsfieldSubmitCall, higgsfieldUploadCall, isGradioFile, isVideoModel, isVideoProvider,
  pickDuration, pollinationsUploadCall, pollinationsVideoCall, readFalStatus, readFalVideoUrl, readGradioEvents, readHiggsfieldStatus,
  readGradioUpload, readHiggsfieldTicket, readPollinationsJob, readUploadUrl, spaceHost, videoModelFor, videoServiceError,
} from '../../src/lib/videoProviders';

const PHOTO = { data: 'iVBORw0KGgo=', mimeType: 'image/png' };
const request = { prompt: 'The chopper on a kitchen counter', aspectRatio: '9:16' as const, durationSeconds: 8 as const, image: PHOTO };

describe('the video services', () => {
  it('keeps Gemini first and the default, then the free Hugging Face, Pollinations, fal.ai and Higgsfield', () => {
    expect(VIDEO_PROVIDERS).toEqual(['gemini', 'huggingface', 'pollinations', 'fal', 'higgsfield']);
    expect(DEFAULT_VIDEO_PROVIDER).toBe('gemini');
    expect(isVideoProvider('fal')).toBe(true);
    expect(isVideoProvider('openai')).toBe(false);
  });

  it('knows each service\'s models, with a default for each, and refuses a model from another service', () => {
    for (const provider of VIDEO_PROVIDERS) {
      expect(VIDEO_MODELS[provider].length, provider).toBeGreaterThan(0);
      expect(videoModelFor(provider, null).id).toBe(VIDEO_MODELS[provider][0].id);
    }
    expect(isVideoModel('fal', 'wan/v2.6/image-to-video/flash')).toBe(true);
    expect(isVideoModel('pollinations', 'wan/v2.6/image-to-video/flash')).toBe(false);
    expect(videoModelFor('fal', 'not-a-model').id).toBe(VIDEO_MODELS.fal[0].id);
  });

  it('gives every model a price (free, or unknown when the service does not publish it), a currency and the lengths it can film', () => {
    for (const provider of VIDEO_PROVIDERS) {
      for (const model of VIDEO_MODELS[provider]) {
        if (model.perSecond !== null) expect(model.perSecond, model.id).toBeGreaterThanOrEqual(0);
        expect(['usd', 'pollen']).toContain(model.currency);
        expect(model.durations.length, model.id).toBeGreaterThan(0);
      }
    }
    expect(VIDEO_MODELS.huggingface.every((m) => m.perSecond === 0)).toBe(true);
    expect(VIDEO_MODELS.higgsfield.every((m) => m.perSecond === null)).toBe(true);
  });
});

describe('pickDuration', () => {
  it('takes the length asked for when the model can film it, otherwise the nearest (the longer one on a tie)', () => {
    expect(pickDuration([4, 6, 8], 8)).toBe(8);
    expect(pickDuration([4, 5], 8)).toBe(5);
    expect(pickDuration([5, 10, 15], 8)).toBe(10);
    expect(pickDuration([5, 10, 15], 6)).toBe(5);
    expect(pickDuration([5, 10, 15], 7.5)).toBe(10);
  });
});

describe('fal.ai', () => {
  it('queues Kling with the photo as its start image, the length as text, and sound', () => {
    const call = falSubmitCall(request, 'fal-key', 'fal-ai/kling-video/v3/standard/image-to-video');
    expect(call.url).toBe('https://queue.fal.run/fal-ai/kling-video/v3/standard/image-to-video');
    expect(call.headers).toEqual({ Authorization: 'Key fal-key', 'Content-Type': 'application/json' });
    expect(JSON.parse(call.body)).toEqual({ prompt: request.prompt, start_image_url: 'data:image/png;base64,iVBORw0KGgo=', duration: '8', generate_audio: true });
  });

  it('asks Seedance for the shape and 720p, and Wan for its nearest length', () => {
    expect(JSON.parse(falSubmitCall(request, 'k', 'bytedance/seedance-2.0/mini/image-to-video').body)).toEqual({
      prompt: request.prompt, image_url: 'data:image/png;base64,iVBORw0KGgo=', duration: '8', aspect_ratio: '9:16', resolution: '720p', generate_audio: true,
    });
    expect(JSON.parse(falSubmitCall(request, 'k', 'wan/v2.6/image-to-video/flash').body)).toMatchObject({ image_url: 'data:image/png;base64,iVBORw0KGgo=', duration: '10', resolution: '720p' });
  });

  it('polls and reads through the owner/app part of the model id', () => {
    expect(falAppPath('fal-ai/kling-video/v3/standard/image-to-video')).toBe('fal-ai/kling-video');
    expect(falAppPath('wan/v2.6/image-to-video/flash')).toBe('wan/v2.6');
  });

  it('reads the queue status and the finished video, from fal\'s own media host only', () => {
    expect(readFalStatus({ status: 'IN_QUEUE' })).toBe('running');
    expect(readFalStatus({ status: 'IN_PROGRESS' })).toBe('running');
    expect(readFalStatus({ status: 'COMPLETED' })).toBe('done');
    expect(readFalStatus({ status: 'COMPLETED', error: 'boom' })).toBe('failed');
    expect(readFalStatus(null)).toBe('failed');
    expect(readFalVideoUrl({ video: { url: 'https://v3.fal.media/files/abc/out.mp4' } })).toBe('https://v3.fal.media/files/abc/out.mp4');
    expect(readFalVideoUrl({ video: { url: 'https://evil.example/out.mp4' } })).toBeNull();
    expect(readFalVideoUrl({ video: { url: 'http://v3.fal.media/x.mp4' } })).toBeNull();
  });
});

describe('Pollinations', () => {
  it('uploads the photo to its media storage first, without its metadata', () => {
    const call = pollinationsUploadCall(PHOTO, 'sk_test');
    expect(call.url).toBe('https://media.pollinations.ai/upload?safe=privacy');
    expect(call.headers).toEqual({ Authorization: 'Bearer sk_test', 'Content-Type': 'application/json' });
    expect(JSON.parse(call.body)).toEqual({ data: 'iVBORw0KGgo=', contentType: 'image/png', name: 'product.png' });
    expect(readUploadUrl({ id: 'x', url: 'https://media.pollinations.ai/abc123' })).toBe('https://media.pollinations.ai/abc123');
    expect(readUploadUrl({ url: 'https://elsewhere.example/abc' })).toBeNull();
  });

  it('asks for the video as a background job, with the model, length, shape, sound and the photo as first frame', () => {
    const call = pollinationsVideoCall(request, 'sk_test', 'bytedance/seedance-2.0-fast', 'https://media.pollinations.ai/abc123');
    const url = new URL(call.url);
    expect(url.origin + url.pathname).toBe('https://gen.pollinations.ai/video/' + encodeURIComponent(request.prompt));
    expect(Object.fromEntries(url.searchParams)).toEqual({ model: 'bytedance/seedance-2.0-fast', duration: '5', aspectRatio: '9:16', audio: 'true', image: 'https://media.pollinations.ai/abc123' });
    expect(call.headers).toEqual({ Authorization: 'Bearer sk_test', Prefer: 'respond-async' });
  });

  it('films from words alone when there is no photo, and leaves the sound off for a silent model', () => {
    const url = new URL(pollinationsVideoCall({ ...request, image: undefined }, 'k', 'alibaba/wan-2.2-fast', null).url);
    expect(url.searchParams.has('image')).toBe(false);
    expect(url.searchParams.has('audio')).toBe(false);
    expect(url.searchParams.get('duration')).toBe('8');
  });

  it('reads where a job stands', () => {
    expect(readPollinationsJob({ id: 'j', status: 'pending' })).toBe('running');
    expect(readPollinationsJob({ status: 'running' })).toBe('running');
    expect(readPollinationsJob({ status: 'succeeded' })).toBe('done');
    expect(readPollinationsJob({ status: 'failed' })).toBe('failed');
    expect(readPollinationsJob(null)).toBe('failed');
  });
});

describe('Higgsfield', () => {
  it('asks for an upload address for the photo, and reads the answer (https only)', () => {
    const call = higgsfieldUploadCall('image/png', 'kid:ksecret');
    expect(call.url).toBe('https://api.higgsfield.ai/files/generate-upload-url');
    expect(call.headers).toEqual({ Authorization: 'Key kid:ksecret', 'Content-Type': 'application/json' });
    expect(JSON.parse(call.body)).toEqual({ content_type: 'image/png' });
    const ticket = { public_url: 'https://cdn.higgsfield.ai/input/a.png', upload_url: 'https://s3.example.com/put?sig=1', upload_headers: { 'Content-Type': 'image/png', 'x-amz-tagging': 'retention=temporary' } };
    expect(readHiggsfieldTicket(ticket)).toEqual({ publicUrl: ticket.public_url, uploadUrl: ticket.upload_url, headers: ticket.upload_headers });
    expect(readHiggsfieldTicket({ ...ticket, upload_url: 'http://s3.example.com/put' })).toBeNull();
    expect(readHiggsfieldTicket({ ...ticket, upload_headers: { Authorization: 'x' } })).toEqual({ publicUrl: ticket.public_url, uploadUrl: ticket.upload_url, headers: {} });
  });

  it('submits each model with its own fields, the photo as image_url, and a fresh idempotency key', () => {
    const kling = higgsfieldSubmitCall(request, 'kid:ks', 'kling-video/v3.0/std/image-to-video', 'https://cdn.higgsfield.ai/input/a.png');
    expect(kling.url).toBe('https://api.higgsfield.ai/kling-video/v3.0/std/image-to-video');
    expect(kling.headers.Authorization).toBe('Key kid:ks');
    expect(kling.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.parse(kling.body)).toEqual({ prompt: request.prompt, image_url: 'https://cdn.higgsfield.ai/input/a.png', duration: 8, sound: 'on' });
    expect(JSON.parse(higgsfieldSubmitCall(request, 'k', 'bytedance/seedance-2.0/image-to-video', 'https://x.example/a.png').body))
      .toEqual({ prompt: request.prompt, image_url: 'https://x.example/a.png', duration: 8, resolution: '720p', generate_audio: true });
    expect(JSON.parse(higgsfieldSubmitCall(request, 'k', 'wan/v2.7/image-to-video', 'https://x.example/a.png').body))
      .toEqual({ prompt: request.prompt, image_url: 'https://x.example/a.png', duration: 8, resolution: '720p' });
  });

  it('reads the request status and the finished video (https only)', () => {
    expect(readHiggsfieldStatus({ status: 'queued' })).toEqual({ state: 'running' });
    expect(readHiggsfieldStatus({ status: 'in_progress' })).toEqual({ state: 'running' });
    expect(readHiggsfieldStatus({ status: 'completed', video: { url: 'https://cdn.higgsfield.ai/out.mp4' } })).toEqual({ state: 'done', video: 'https://cdn.higgsfield.ai/out.mp4' });
    expect(readHiggsfieldStatus({ status: 'completed', video: { url: 'http://cdn/out.mp4' } })).toEqual({ state: 'failed' });
    expect(readHiggsfieldStatus({ status: 'nsfw' })).toEqual({ state: 'failed', refused: true });
    expect(readHiggsfieldStatus({ status: 'failed' })).toEqual({ state: 'failed' });
  });
});

describe('Hugging Face (free Space)', () => {
  const space = 'zerogpu-aoti/wan2-2-fp8da-aoti-faster';
  const host = 'https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space';

  it('finds the Space\'s address from its name', () => {
    expect(spaceHost(space)).toBe(host);
  });

  it('reads where the Space stored the uploaded photo, its own temporary folder only', () => {
    expect(readGradioUpload(['/tmp/gradio/1da7f359/product.png'])).toBe('/tmp/gradio/1da7f359/product.png');
    expect(readGradioUpload(['/etc/passwd'])).toBeNull();
    expect(readGradioUpload(['/tmp/gradio/../x'])).toBeNull();
    expect(readGradioUpload(null)).toBeNull();
  });

  it('starts the Space\'s job with the uploaded photo, the prompt, the free model\'s nearest length and the seller\'s token', () => {
    const call = gradioSubmitCall(request, 'hf_token', space, '/tmp/gradio/1da7f359/product.png');
    expect(call.url).toBe(`${host}/gradio_api/call/generate_video`);
    expect(call.headers).toEqual({ Authorization: 'Bearer hf_token', 'Content-Type': 'application/json' });
    const data = JSON.parse(call.body).data;
    expect(data[0]).toEqual({ path: '/tmp/gradio/1da7f359/product.png', orig_name: 'product.png', mime_type: 'image/png', meta: { _type: 'gradio.FileData' } });
    expect(data[1]).toBe(request.prompt);
    expect(data[4]).toBe(5);
    expect(data).toHaveLength(9);
  });

  it('reads the job\'s event stream: still running, done with its file, or refused (the free quota apart)', () => {
    expect(readGradioEvents('event: heartbeat\ndata: null\n\n', host)).toEqual({ state: 'running' });
    expect(readGradioEvents('', host)).toEqual({ state: 'running' });
    const file = `${host}/gradio_api/file=/tmp/gradio/abc/out.mp4`;
    expect(readGradioEvents(`event: generating\ndata: []\n\nevent: complete\ndata: [{"video": {"path": "/tmp/gradio/abc/out.mp4", "url": "${file}"}, "subtitles": null}, 42]\n\n`, host)).toEqual({ state: 'done', file });
    expect(readGradioEvents(`event: complete\ndata: [{"path": "/tmp/x.mp4", "url": "${file}"}, 7]\n\n`, host)).toEqual({ state: 'done', file });
    expect(readGradioEvents(`event: complete\ndata: [{"url": "https://evil.example/x.mp4"}, 7]\n\n`, host)).toEqual({ state: 'failed' });
    expect(readGradioEvents('event: error\ndata: "You have exceeded your free GPU quota (75s requested vs. 40s left)."\n\n', host)).toEqual({ state: 'failed', quota: true });
    expect(readGradioEvents('event: error\ndata: null\n\n', host)).toEqual({ state: 'failed' });
  });

  it('only accepts files from the Space itself', () => {
    expect(isGradioFile(`${host}/gradio_api/file=/tmp/a.mp4`, host)).toBe(true);
    expect(isGradioFile('https://other.hf.space/gradio_api/file=/tmp/a.mp4', host)).toBe(false);
  });
});

describe('videoServiceError', () => {
  it('turns a refusal into the seller\'s message, never the service\'s own words', () => {
    expect(videoServiceError(401, 'Invalid key sk_abc')).toEqual({ status: 403, error: VIDEO_SERVICE_ERRORS.badKey });
    expect(videoServiceError(402, 'Insufficient pollen balance')).toEqual({ status: 402, error: VIDEO_SERVICE_ERRORS.noCredit });
    expect(videoServiceError(403, '{"detail":"User is locked. Reason: Exhausted balance"}')).toEqual({ status: 402, error: VIDEO_SERVICE_ERRORS.noCredit });
    expect(videoServiceError(429, 'rate')).toEqual({ status: 429, error: VIDEO_SERVICE_ERRORS.busy });
    expect(videoServiceError(422, 'content_policy_violation')).toEqual({ status: 422, error: VIDEO_SERVICE_ERRORS.refused });
    expect(videoServiceError(500, 'boom')).toEqual({ status: 502, error: VIDEO_SERVICE_ERRORS.failed });
  });

  it('has every message in English and Arabic for the seller', () => {
    for (const message of Object.values(VIDEO_SERVICE_ERRORS)) expect(SERVER_MESSAGES[message], message).toBeDefined();
  });
});
