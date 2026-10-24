import { describe, expect, it } from 'vitest';
import { imageDimensions } from '../../src/lib/imageDimensions';

const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
const le24 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];
const riff = (chunk: number[]) => [...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP'), ...chunk];

describe('imageDimensions', () => {
  it('reads a PNG from its header', () => {
    const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    expect(imageDimensions(png)).toEqual({ width: 1, height: 1 });
  });

  it('reads a JPEG from its frame header, past the other segments', () => {
    const jpeg = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x03];
    expect(imageDimensions(b64(jpeg))).toEqual({ width: 640, height: 480 });
  });

  it('reads the three kinds of WebP', () => {
    const lossy = riff([...ascii('VP8 '), 0, 0, 0, 0, 0, 0, 0, 0x9d, 0x01, 0x2a, ...le16(800), ...le16(600)]);
    expect(imageDimensions(b64(lossy))).toEqual({ width: 800, height: 600 });
    // lossless: 14 bits of width - 1, then 14 bits of height - 1
    const bits = (300 - 1) | ((200 - 1) << 14);
    const lossless = riff([...ascii('VP8L'), 0, 0, 0, 0, 0x2f, bits & 0xff, (bits >> 8) & 0xff, (bits >> 16) & 0xff, (bits >>> 24) & 0xff]);
    expect(imageDimensions(b64(lossless))).toEqual({ width: 300, height: 200 });
    const extended = riff([...ascii('VP8X'), 10, 0, 0, 0, 0, 0, 0, 0, ...le24(1024 - 1), ...le24(768 - 1)]);
    expect(imageDimensions(b64(extended))).toEqual({ width: 1024, height: 768 });
  });

  it('gives null for anything it cannot read', () => {
    expect(imageDimensions('')).toBeNull();
    expect(imageDimensions(b64(ascii('hello world, not an image')))).toBeNull();
    expect(imageDimensions(b64([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBeNull();
  });
});
