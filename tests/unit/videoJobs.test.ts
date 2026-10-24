import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import {
  GOOGLE_API_BASE, VIDEO_ERRORS, VIDEO_MODEL, buildInteractionBody, fileDownloadUrl, isGoogleFileUri, parseVideoRequest, readInteraction, readJob, readJobDetails, signJob,
} from '../../src/lib/videoJobs';

const sign = (value: string) => createHmac('sha256', 'test-secret').update(value).digest('base64url');
const ID = 'v1_ChdpbnRlcmFjdGlvbi1hYmMxMjM';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('video job tokens', () => {
  it('gives the interaction back to the user who started it', () => {
    const token = signJob(ID, 'user-1', sign);
    expect(readJob(token, 'user-1', sign)).toBe(ID);
  });

  it('refuses another user, so nobody can watch someone else\'s video', () => {
    expect(readJob(signJob(ID, 'user-1', sign), 'user-2', sign)).toBeNull();
  });

  it('refuses a token that was changed or signed with another secret', () => {
    const token = signJob(ID, 'user-1', sign);
    const [body] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ i: ID, u: 'user-2' })).toString('base64url');
    expect(readJob(`${forged}.${token.split('.')[1]}`, 'user-2', sign)).toBeNull();
    expect(readJob(`${body}.xxxx`, 'user-1', sign)).toBeNull();
    const otherSecret = (v: string) => createHmac('sha256', 'other').update(v).digest('base64url');
    expect(readJob(token, 'user-1', otherSecret)).toBeNull();
  });

  it('refuses garbage and anything that is not an interaction id (no path can be smuggled into the URL)', () => {
    expect(readJob('', 'user-1', sign)).toBeNull();
    expect(readJob('no-dot', 'user-1', sign)).toBeNull();
    expect(readJob(signJob('../../etc/passwd', 'user-1', sign), 'user-1', sign)).toBeNull();
    expect(readJob(signJob('files/abc', 'user-1', sign), 'user-1', sign)).toBeNull();
    expect(readJob(signJob('abc?key=x', 'user-1', sign), 'user-1', sign)).toBeNull();
  });

  it('carries the points paid for a clip made on the platform key, signed with the rest', () => {
    const paid = { ref: '3f2b9c1e-aaaa-bbbb', points: 64 };
    expect(readJobDetails(signJob(ID, 'user-1', sign, paid), 'user-1', sign)).toEqual({ id: ID, paid });
    expect(readJobDetails(signJob(ID, 'user-1', sign), 'user-1', sign)).toEqual({ id: ID, paid: null });
    // a token whose payment was tampered with fails its signature, and a malformed payment is refused
    const token = signJob(ID, 'user-1', sign, paid);
    const richer = Buffer.from(JSON.stringify({ i: ID, u: 'user-1', p: { r: paid.ref, c: 6400 } })).toString('base64url');
    expect(readJobDetails(`${richer}.${token.split('.')[1]}`, 'user-1', sign)).toBeNull();
    expect(readJobDetails(signJob(ID, 'user-1', sign, { ref: 'bad ref', points: 5 }), 'user-1', sign)).toBeNull();
    expect(readJobDetails(signJob(ID, 'user-1', sign, { ref: paid.ref, points: -1 }), 'user-1', sign)).toBeNull();
  });
});

describe('parseVideoRequest', () => {
  it('accepts a scene description and fills the defaults', () => {
    expect(parseVideoRequest({ prompt: '  A woman shows the blender in her kitchen  ' })).toEqual({ prompt: 'A woman shows the blender in her kitchen', aspectRatio: '9:16', durationSeconds: 8 });
  });

  it('keeps 16:9 and maps the other formats to vertical, the only two the model makes', () => {
    expect(parseVideoRequest({ prompt: 'scene one', aspectRatio: '16:9' })).toMatchObject({ aspectRatio: '16:9' });
    expect(parseVideoRequest({ prompt: 'scene one', aspectRatio: '1:1' })).toMatchObject({ aspectRatio: '9:16' });
    expect(parseVideoRequest({ prompt: 'scene one', aspectRatio: '4:5' })).toMatchObject({ aspectRatio: '9:16' });
  });

  it('accepts only the scene lengths the video maker uses', () => {
    expect(parseVideoRequest({ prompt: 'scene one', durationSeconds: 4 })).toMatchObject({ durationSeconds: 4 });
    expect(parseVideoRequest({ prompt: 'scene one', durationSeconds: 6 })).toMatchObject({ durationSeconds: 6 });
    expect(parseVideoRequest({ prompt: 'scene one', durationSeconds: 30 })).toMatchObject({ durationSeconds: 8 });
  });

  it('turns the product photo into the image the video starts from', () => {
    expect(parseVideoRequest({ prompt: 'scene one', image: PNG })).toMatchObject({ image: { data: PNG.split(',')[1], mimeType: 'image/png' } });
  });

  it('refuses an empty or huge description', () => {
    expect(parseVideoRequest({ prompt: '' })).toEqual({ error: VIDEO_ERRORS.prompt });
    expect(parseVideoRequest({ prompt: 'x'.repeat(2001) })).toEqual({ error: VIDEO_ERRORS.prompt });
    expect(parseVideoRequest(null)).toEqual({ error: VIDEO_ERRORS.prompt });
  });

  it('refuses anything that is not a PNG, JPEG or WebP photo', () => {
    expect(parseVideoRequest({ prompt: 'scene one', image: 'data:text/html;base64,PHNjcmlwdD4=' })).toEqual({ error: VIDEO_ERRORS.image });
    expect(parseVideoRequest({ prompt: 'scene one', image: 'https://example.com/a.png' })).toEqual({ error: VIDEO_ERRORS.image });
    expect(parseVideoRequest({ prompt: 'scene one', image: `data:image/png;base64,${'A'.repeat(9_000_000)}` })).toEqual({ error: VIDEO_ERRORS.image });
  });

  it('only uses messages the server can translate', () => {
    for (const message of Object.values(VIDEO_ERRORS)) expect(SERVER_MESSAGES[message], message).toBeDefined();
  });
});

describe('buildInteractionBody', () => {
  it('asks Gemini Omni for a vertical video with sound, from the product photo, as a background job', () => {
    const request = parseVideoRequest({ prompt: 'scene one', image: PNG });
    if ('error' in request) throw new Error(request.error);
    expect(buildInteractionBody(request)).toEqual({
      model: VIDEO_MODEL,
      input: [
        { type: 'image', data: PNG.split(',')[1], mime_type: 'image/png' },
        { type: 'text', text: 'scene one' },
      ],
      generation_config: { video_config: { task: 'image_to_video' } },
      response_format: { type: 'video', aspect_ratio: '9:16', resolution: '720p', delivery: 'uri' },
      background: true,
    });
  });

  it('films from the words alone when there is no photo', () => {
    const request = parseVideoRequest({ prompt: 'scene one', aspectRatio: '16:9' });
    if ('error' in request) throw new Error(request.error);
    const body = buildInteractionBody(request);
    expect(body.input).toEqual([{ type: 'text', text: 'scene one' }]);
    expect(body.generation_config).toEqual({ video_config: { task: 'text_to_video' } });
    expect(body.response_format).toMatchObject({ aspect_ratio: '16:9' });
  });
});

describe('readInteraction', () => {
  const video = { type: 'video', mime_type: 'video/mp4', uri: `${GOOGLE_API_BASE}/v1beta/files/abc` };

  it('says when the job is still running', () => {
    expect(readInteraction({ id: ID, status: 'in_progress' })).toEqual({ state: 'running' });
  });

  it('finds the finished video in the steps, by link or inline', () => {
    expect(readInteraction({ status: 'completed', steps: [{ type: 'thought' }, { type: 'model_output', content: [video] }] }))
      .toEqual({ state: 'done', video: { uri: video.uri, mimeType: 'video/mp4' } });
    expect(readInteraction({ status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'video', mime_type: 'video/mp4', data: 'AAAA' }] }] }))
      .toEqual({ state: 'done', video: { data: 'AAAA', mimeType: 'video/mp4' } });
  });

  it('also reads the shape the SDKs return', () => {
    expect(readInteraction({ status: 'completed', output_video: { uri: video.uri, mime_type: 'video/mp4' } }))
      .toEqual({ state: 'done', video: { uri: video.uri, mimeType: 'video/mp4' } });
  });

  it('treats a finished job without a video, a failure or a cancellation as failed', () => {
    expect(readInteraction({ status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: 'sorry' }] }] })).toEqual({ state: 'failed' });
    expect(readInteraction({ status: 'failed' })).toEqual({ state: 'failed' });
    expect(readInteraction({ status: 'cancelled' })).toEqual({ state: 'failed' });
    expect(readInteraction({ error: { message: 'blocked' } })).toEqual({ state: 'failed' });
    expect(readInteraction(null)).toEqual({ state: 'failed' });
  });
});

describe('Google files', () => {
  it('only lets the server fetch video files from Google with the user\'s key', () => {
    expect(isGoogleFileUri('https://generativelanguage.googleapis.com/v1beta/files/abc:download?alt=media')).toBe(true);
    expect(isGoogleFileUri('https://evil.example/steal')).toBe(false);
    expect(isGoogleFileUri('https://generativelanguage.googleapis.com.evil.example/x')).toBe(false);
    expect(isGoogleFileUri('http://generativelanguage.googleapis.com/v1beta/files/abc')).toBe(false);
    expect(isGoogleFileUri(undefined)).toBe(false);
  });

  it('accepts the stand-in server only when it is the configured API base (tests)', () => {
    expect(isGoogleFileUri('http://localhost:4600/v1beta/files/abc', 'http://localhost:4600')).toBe(true);
    expect(isGoogleFileUri('http://evil.local:4600/v1beta/files/abc', 'http://localhost:4600')).toBe(false);
  });

  it('turns a file link into its download address', () => {
    expect(fileDownloadUrl('https://generativelanguage.googleapis.com/v1beta/files/abc')).toBe('https://generativelanguage.googleapis.com/v1beta/files/abc:download?alt=media');
    expect(fileDownloadUrl('https://generativelanguage.googleapis.com/v1beta/files/abc:download?alt=media')).toBe('https://generativelanguage.googleapis.com/v1beta/files/abc:download?alt=media');
  });
});

describe('VIDEO_MODEL', () => {
  it('is Gemini Omni Flash, which replaces Veo 3.1 (shut down on 22 October 2026)', () => {
    expect(VIDEO_MODEL).toBe('gemini-omni-1.1-flash');
  });
});
