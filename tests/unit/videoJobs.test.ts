import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import { VIDEO_ERRORS, VIDEO_MODEL_FALLBACKS, isGoogleFileUri, parseVideoRequest, readJob, signJob } from '../../src/lib/videoJobs';

const sign = (value: string) => createHmac('sha256', 'test-secret').update(value).digest('base64url');
const OP = 'models/veo-3.1-fast-generate-preview/operations/abc123xyz';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('video job tokens', () => {
  it('gives the operation back to the user who started it', () => {
    const token = signJob(OP, 'user-1', sign);
    expect(readJob(token, 'user-1', sign)).toBe(OP);
  });

  it('refuses another user, so nobody can watch someone else\'s video', () => {
    expect(readJob(signJob(OP, 'user-1', sign), 'user-2', sign)).toBeNull();
  });

  it('refuses a token that was changed or signed with another secret', () => {
    const token = signJob(OP, 'user-1', sign);
    const [body] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ op: OP, u: 'user-2' })).toString('base64url');
    expect(readJob(`${forged}.${token.split('.')[1]}`, 'user-2', sign)).toBeNull();
    expect(readJob(`${body}.xxxx`, 'user-1', sign)).toBeNull();
    const otherSecret = (v: string) => createHmac('sha256', 'other').update(v).digest('base64url');
    expect(readJob(token, 'user-1', otherSecret)).toBeNull();
  });

  it('refuses garbage and operation names that are not Veo operations', () => {
    expect(readJob('', 'user-1', sign)).toBeNull();
    expect(readJob('no-dot', 'user-1', sign)).toBeNull();
    expect(readJob(signJob('../../etc/passwd', 'user-1', sign), 'user-1', sign)).toBeNull();
    expect(readJob(signJob('files/abc', 'user-1', sign), 'user-1', sign)).toBeNull();
  });
});

describe('parseVideoRequest', () => {
  it('accepts a scene description and fills the defaults', () => {
    expect(parseVideoRequest({ prompt: '  A woman shows the blender in her kitchen  ' })).toEqual({ prompt: 'A woman shows the blender in her kitchen', aspectRatio: '9:16', durationSeconds: 8 });
  });

  it('keeps 16:9 and maps the other formats to vertical, the only ones Veo makes', () => {
    expect(parseVideoRequest({ prompt: 'scene one', aspectRatio: '16:9' })).toMatchObject({ aspectRatio: '16:9' });
    expect(parseVideoRequest({ prompt: 'scene one', aspectRatio: '1:1' })).toMatchObject({ aspectRatio: '9:16' });
    expect(parseVideoRequest({ prompt: 'scene one', aspectRatio: '4:5' })).toMatchObject({ aspectRatio: '9:16' });
  });

  it('accepts only the clip lengths Veo supports', () => {
    expect(parseVideoRequest({ prompt: 'scene one', durationSeconds: 4 })).toMatchObject({ durationSeconds: 4 });
    expect(parseVideoRequest({ prompt: 'scene one', durationSeconds: 6 })).toMatchObject({ durationSeconds: 6 });
    expect(parseVideoRequest({ prompt: 'scene one', durationSeconds: 30 })).toMatchObject({ durationSeconds: 8 });
  });

  it('turns the product photo into the image Veo starts from', () => {
    expect(parseVideoRequest({ prompt: 'scene one', image: PNG })).toMatchObject({ image: { imageBytes: PNG.split(',')[1], mimeType: 'image/png' } });
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

describe('isGoogleFileUri', () => {
  it('only lets the server fetch video files from Google with the user\'s key', () => {
    expect(isGoogleFileUri('https://generativelanguage.googleapis.com/v1beta/files/abc:download?alt=media')).toBe(true);
    expect(isGoogleFileUri('https://evil.example/steal')).toBe(false);
    expect(isGoogleFileUri('https://generativelanguage.googleapis.com.evil.example/x')).toBe(false);
    expect(isGoogleFileUri('http://generativelanguage.googleapis.com/v1beta/files/abc')).toBe(false);
    expect(isGoogleFileUri(undefined)).toBe(false);
  });
});

describe('VIDEO_MODEL_FALLBACKS', () => {
  it('tries the fast Veo model first and has backups', () => {
    expect(VIDEO_MODEL_FALLBACKS[0]).toBe('veo-3.1-fast-generate-preview');
    expect(VIDEO_MODEL_FALLBACKS.length).toBeGreaterThan(1);
  });
});
