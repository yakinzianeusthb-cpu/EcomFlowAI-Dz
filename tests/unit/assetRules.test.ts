import { describe, expect, it } from 'vitest';
import { ASSET_ERRORS, MAX_ASSET_BYTES, parseAssetInput, sniffImageType, safeFileName } from '../../src/lib/assetRules';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const WEBP = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const dataUrl = (mime: string, bytes: Buffer) => `data:${mime};base64,${bytes.toString('base64')}`;

describe('sniffImageType', () => {
  it('recognises PNG, JPEG and WebP from their first bytes', () => {
    expect(sniffImageType(PNG)).toBe('image/png');
    expect(sniffImageType(JPEG)).toBe('image/jpeg');
    expect(sniffImageType(WEBP)).toBe('image/webp');
  });

  it('refuses anything else, such as HTML or SVG', () => {
    expect(sniffImageType(Buffer.from('<html><script>alert(1)</script>'))).toBeNull();
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(sniffImageType(Buffer.alloc(3))).toBeNull();
  });
});

describe('parseAssetInput', () => {
  it('accepts an image and trusts its bytes, not its label', () => {
    const r = parseAssetInput({ kind: 'product', name: 'photo.webp', dataUrl: dataUrl('image/png', JPEG), width: 800, height: 600 });
    expect(r).toMatchObject({ kind: 'product', name: 'photo.webp', mimeType: 'image/jpeg', width: 800, height: 600 });
    expect('bytes' in r && r.bytes.equals(JPEG)).toBe(true);
  });

  it('refuses files that are not images, even when labelled as images', () => {
    expect(parseAssetInput({ kind: 'product', name: 'x.png', dataUrl: dataUrl('image/png', Buffer.from('<html></html>')) })).toEqual({ error: ASSET_ERRORS.type });
    expect(parseAssetInput({ kind: 'product', name: 'x.svg', dataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' })).toEqual({ error: ASSET_ERRORS.type });
    expect(parseAssetInput({ kind: 'product', name: 'x', dataUrl: 'not a data url' })).toEqual({ error: ASSET_ERRORS.type });
  });

  it('refuses unknown kinds and oversized files', () => {
    expect(parseAssetInput({ kind: 'malware', name: 'x', dataUrl: dataUrl('image/png', PNG) })).toEqual({ error: ASSET_ERRORS.kind });
    const big = Buffer.concat([PNG, Buffer.alloc(MAX_ASSET_BYTES)]);
    expect(parseAssetInput({ kind: 'product', name: 'x', dataUrl: dataUrl('image/png', big) })).toEqual({ error: ASSET_ERRORS.tooBig });
  });

  it('keeps an optional project id only when it looks like one', () => {
    const id = '0b6f3c1e-8d2a-4f6b-9c3d-2e1f0a9b8c7d';
    expect(parseAssetInput({ kind: 'product', name: 'x', dataUrl: dataUrl('image/png', PNG), projectId: id })).toMatchObject({ projectId: id });
    expect(parseAssetInput({ kind: 'product', name: 'x', dataUrl: dataUrl('image/png', PNG), projectId: "1' OR 1=1" })).toEqual({ error: ASSET_ERRORS.project });
  });

  it('ignores dimensions that are not sensible numbers', () => {
    const r = parseAssetInput({ kind: 'creative', name: 'x', dataUrl: dataUrl('image/png', PNG), width: -5, height: 'big' });
    expect(r).toMatchObject({ width: null, height: null });
  });
});

describe('safeFileName', () => {
  it('keeps a readable name without path or header tricks', () => {
    expect(safeFileName('../../etc/passwd')).toBe('passwd');
    expect(safeFileName('ad "final".png\r\nX-Evil: 1')).toBe('ad final.pngX-Evil 1');
    expect(safeFileName('   ')).toBe('file');
    expect(safeFileName('x'.repeat(300)).length).toBe(120);
  });
});
