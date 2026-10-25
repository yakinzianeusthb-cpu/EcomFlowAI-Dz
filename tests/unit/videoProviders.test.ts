import { describe, expect, it } from 'vitest';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import {
  DEFAULT_VIDEO_PROVIDER, VIDEO_MODELS, VIDEO_PROVIDERS, VIDEO_SERVICE_ERRORS,
  falAppPath, falSubmitCall, isVideoModel, isVideoProvider, pickDuration, pollinationsUploadCall, pollinationsVideoCall,
  readFalStatus, readFalVideoUrl, readPollinationsJob, readUploadUrl, videoModelFor, videoServiceError,
} from '../../src/lib/videoProviders';

const PHOTO = { data: 'iVBORw0KGgo=', mimeType: 'image/png' };
const request = { prompt: 'The chopper on a kitchen counter', aspectRatio: '9:16' as const, durationSeconds: 8 as const, image: PHOTO };

describe('the video services', () => {
  it('keeps Gemini first and the default, then Pollinations and fal.ai', () => {
    expect(VIDEO_PROVIDERS).toEqual(['gemini', 'pollinations', 'fal']);
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

  it('gives every model a price, a currency and the lengths it can film', () => {
    for (const provider of VIDEO_PROVIDERS) {
      for (const model of VIDEO_MODELS[provider]) {
        expect(model.perSecond, model.id).toBeGreaterThan(0);
        expect(['usd', 'pollen']).toContain(model.currency);
        expect(model.durations.length, model.id).toBeGreaterThan(0);
      }
    }
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
