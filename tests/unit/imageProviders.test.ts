import { describe, expect, it } from 'vitest';
import { SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import {
  ASPECT_RATIOS, CLOUDFLARE_SIZES, DEFAULT_IMAGE_PROVIDER, FAL_RATIOS, IMAGE_ERRORS, IMAGE_PROVIDERS, KEEPS_PRODUCT, OPENAI_SIZES,
  cloudflareCall, falCall, isCloudflareAccountId, isModelUnavailable, openAiCall, providerError, readImage, readReference,
  type ImageRequest,
} from '../../src/lib/imageProviders';

const PHOTO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PHOTO = `data:image/png;base64,${PHOTO_B64}`;
const withPhoto: ImageRequest = { prompt: 'Keep the product', reference: { mimeType: 'image/png', data: PHOTO_B64 }, aspectRatio: '4:5' };
const wordsOnly: ImageRequest = { ...withPhoto, reference: null, aspectRatio: '16:9' };

describe('the image services', () => {
  it('keeps Gemini as the main service, first in the list', () => {
    expect(DEFAULT_IMAGE_PROVIDER).toBe('gemini');
    expect(IMAGE_PROVIDERS[0]).toBe('gemini');
  });

  it('knows which services keep the product of a photo: all of them start from it', () => {
    expect(KEEPS_PRODUCT).toEqual({ gemini: true, openai: true, fal: true, cloudflare: true });
  });
});

describe('readReference', () => {
  it('takes a PNG, JPG or WebP data URL and refuses anything else', () => {
    expect(readReference(PHOTO)).toEqual({ mimeType: 'image/png', data: PHOTO_B64 });
    expect(readReference(null)).toBeNull();
    expect(readReference('')).toBeNull();
    expect(readReference('data:image/svg+xml;base64,PHN2Zz4=')).toBe('invalid');
    expect(readReference('https://example.com/a.png')).toBe('invalid');
    expect(readReference(`data:image/png;base64,${'A'.repeat(9 * 1024 * 1024)}`)).toBe('invalid');
  });
});

describe('OpenAI', () => {
  it('sends the photo to the edits endpoint as a multipart form', async () => {
    const call = openAiCall(withPhoto, 'sk-test', 'gpt-image-2.5-sunburst');
    expect(call.url).toBe('https://api.openai.com/v1/images/edits');
    expect(call.headers).toEqual({ Authorization: 'Bearer sk-test' });
    const form = call.body as FormData;
    expect(form.get('model')).toBe('gpt-image-2.5-sunburst');
    expect(form.get('prompt')).toBe('Keep the product');
    expect(form.get('size')).toBe('1024x1280');
    expect(form.get('output_format')).toBe('jpeg');
    const image = form.get('image') as File;
    expect(image.type).toBe('image/png');
    expect(image.name).toBe('product.png');
    expect(new Uint8Array(await image.arrayBuffer()).slice(1, 4)).toEqual(new Uint8Array([0x50, 0x4e, 0x47]));
  });

  it('asks the generations endpoint in JSON when there is no photo', () => {
    const call = openAiCall(wordsOnly, 'sk-test', 'gpt-image-2.5-flare');
    expect(call.url).toBe('https://api.openai.com/v1/images/generations');
    expect(JSON.parse(call.body as string)).toEqual({ model: 'gpt-image-2.5-flare', prompt: 'Keep the product', size: '1792x1008', n: 1, output_format: 'jpeg', output_compression: 90 });
  });

  it('gives every shape a size GPT Image accepts: multiples of 16, ratio between 1:3 and 3:1, the right shape', () => {
    for (const ratio of ASPECT_RATIOS) {
      const [w, h] = OPENAI_SIZES[ratio].split('x').map(Number);
      const [rw, rh] = ratio.split(':').map(Number);
      expect(w % 16, ratio).toBe(0);
      expect(h % 16, ratio).toBe(0);
      expect(w / h).toBeGreaterThanOrEqual(1 / 3);
      expect(w / h).toBeLessThanOrEqual(3);
      expect(Math.abs(w / h - rw / rh), ratio).toBeLessThan(0.02);
      expect(w * h, ratio).toBeGreaterThanOrEqual(655_360);
    }
  });
});

describe('FLUX Kontext on fal.ai', () => {
  it('edits the photo with Kontext, or draws from words with its text-to-image version, the picture in the answer', () => {
    const edit = falCall(withPhoto, 'fal-key');
    expect(edit.url).toBe('https://fal.run/fal-ai/flux-pro/kontext');
    expect(edit.headers.Authorization).toBe('Key fal-key');
    expect(JSON.parse(edit.body as string)).toMatchObject({ prompt: 'Keep the product', image_url: PHOTO, aspect_ratio: '3:4', sync_mode: true, num_images: 1 });
    const draw = falCall(wordsOnly, 'fal-key');
    expect(draw.url).toBe('https://fal.run/fal-ai/flux-pro/kontext/text-to-image');
    expect(JSON.parse(draw.body as string)).not.toHaveProperty('image_url');
  });

  it('maps every shape to one fal offers', () => {
    const offered = ['21:9', '16:9', '4:3', '3:2', '1:1', '2:3', '3:4', '9:16', '9:21'];
    for (const ratio of ASPECT_RATIOS) expect(offered, ratio).toContain(FAL_RATIOS[ratio]);
  });
});

describe('Cloudflare Workers AI', () => {
  const account = '0123456789abcdef0123456789abcdef';

  it('sends the photo to FLUX.2 klein on the seller\'s account as a multipart form, at the shape asked', async () => {
    const call = cloudflareCall(withPhoto, account, 'cf-token');
    expect(call.url).toBe(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`);
    // no Content-Type: fetch writes the multipart one, with its boundary
    expect(call.headers).toEqual({ Authorization: 'Bearer cf-token' });
    const form = call.body as FormData;
    expect(form.get('prompt')).toBe('Keep the product');
    expect([form.get('width'), form.get('height')].join('x')).toBe(CLOUDFLARE_SIZES['4:5']);
    const image = form.get('input_image_0') as File;
    expect(image.type).toBe('image/png');
    expect(new Uint8Array(await image.arrayBuffer()).slice(1, 4)).toEqual(new Uint8Array([0x50, 0x4e, 0x47]));
  });

  it('draws from words alone without a photo field, with a prompt cut to its limit', () => {
    const form = cloudflareCall({ ...wordsOnly, prompt: 'x'.repeat(3000) }, account, 'cf-token').body as FormData;
    expect(form.has('input_image_0')).toBe(false);
    expect(form.get('prompt')).toHaveLength(2048);
    expect([form.get('width'), form.get('height')].join('x')).toBe(CLOUDFLARE_SIZES['16:9']);
  });

  it('gives every shape a size FLUX.2 klein accepts: multiples of 16, 256 to 1920 a side, the right shape', () => {
    for (const ratio of ASPECT_RATIOS) {
      const [w, h] = CLOUDFLARE_SIZES[ratio].split('x').map(Number);
      const [rw, rh] = ratio.split(':').map(Number);
      expect(w % 16, ratio).toBe(0);
      expect(h % 16, ratio).toBe(0);
      expect(Math.min(w, h), ratio).toBeGreaterThanOrEqual(256);
      expect(Math.max(w, h), ratio).toBeLessThanOrEqual(1920);
      expect(Math.abs(w / h - rw / rh), ratio).toBeLessThan(0.02);
    }
  });

  it('only accepts an account id of 32 hexadecimal characters (it goes into the address)', () => {
    expect(isCloudflareAccountId('0123456789abcdef0123456789ABCDEF')).toBe(true);
    for (const bad of ['', '0123', '../../../user/tokens/verify', '0123456789abcdef0123456789abcdeg', null]) expect(isCloudflareAccountId(bad)).toBe(false);
  });
});

describe('readImage', () => {
  it('reads each service\'s answer as an image data URL', () => {
    expect(readImage('openai', { data: [{ b64_json: 'QUJD' }] })).toBe('data:image/jpeg;base64,QUJD');
    expect(readImage('fal', { images: [{ url: 'data:image/jpeg;base64,QUJD' }] })).toBe('data:image/jpeg;base64,QUJD');
    expect(readImage('cloudflare', { result: { image: 'QUJD' }, success: true })).toBe('data:image/jpeg;base64,QUJD');
    // the type follows the picture's own first bytes
    expect(readImage('cloudflare', { result: { image: PHOTO_B64 } })).toBe(PHOTO);
  });

  it('refuses an answer without a usable picture', () => {
    expect(readImage('openai', { data: [] })).toBeNull();
    expect(readImage('openai', { data: [{ b64_json: '<script>' }] })).toBeNull();
    expect(readImage('fal', { images: [{ url: 'javascript:alert(1)' }] })).toBeNull();
    expect(readImage('fal', { images: [{ url: 'https://v3.fal.media/files/a.jpg' }] })).toBeNull();
    expect(readImage('cloudflare', null)).toBeNull();
  });
});

describe('providerError', () => {
  it('turns a refusal into the seller\'s message, never the service\'s own words', () => {
    expect(providerError(401, '{"error":{"message":"Incorrect API key provided: sk-ab***cd"}}')).toEqual({ status: 403, error: IMAGE_ERRORS.badKey });
    expect(providerError(429, '{"error":{"code":"insufficient_quota"}}')).toEqual({ status: 402, error: IMAGE_ERRORS.noCredit });
    expect(providerError(403, 'Exhausted balance')).toEqual({ status: 402, error: IMAGE_ERRORS.noCredit });
    expect(providerError(429, 'rate limit')).toEqual({ status: 429, error: IMAGE_ERRORS.busy });
    expect(providerError(400, '{"error":{"code":"moderation_blocked"}}')).toEqual({ status: 422, error: IMAGE_ERRORS.refused });
    expect(providerError(500, 'boom')).toEqual({ status: 502, error: IMAGE_ERRORS.failed });
  });

  it('tells a model the account cannot use (the next one is tried) from other refusals', () => {
    expect(isModelUnavailable(404, '')).toBe(true);
    expect(isModelUnavailable(403, 'Your organization must be verified to use the model gpt-image-2.5-sunburst')).toBe(true);
    expect(isModelUnavailable(401, 'Incorrect API key')).toBe(false);
    expect(isModelUnavailable(429, 'insufficient_quota')).toBe(false);
  });

  it('has every message in English and Arabic for the seller', () => {
    for (const message of Object.values(IMAGE_ERRORS)) expect(SERVER_MESSAGES[message], message).toBeDefined();
  });
});
