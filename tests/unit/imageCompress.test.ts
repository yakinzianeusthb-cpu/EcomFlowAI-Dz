import { describe, expect, it } from 'vitest';
import { fitWithin, shouldCompress } from '../../src/lib/imageCompress';

describe('fitWithin', () => {
  it('scales a large landscape photo down to the longest side', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
  });

  it('scales a large portrait photo down to the longest side', () => {
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('never enlarges an image that is already small enough', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1600, 1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('keeps at least one pixel on each side for extreme aspect ratios', () => {
    expect(fitWithin(10000, 3, 1600)).toEqual({ width: 1600, height: 1 });
  });

  it('returns the input untouched when a size is not a usable number', () => {
    expect(fitWithin(0, 100, 1600)).toEqual({ width: 0, height: 100 });
    expect(fitWithin(NaN, 100, 1600)).toEqual({ width: NaN, height: 100 });
  });
});

describe('shouldCompress', () => {
  const MB = 1024 * 1024;

  it('compresses large photos', () => {
    expect(shouldCompress({ type: 'image/jpeg', size: 4 * MB })).toBe(true);
    expect(shouldCompress({ type: 'image/png', size: 2 * MB })).toBe(true);
    expect(shouldCompress({ type: 'image/webp', size: 1 * MB })).toBe(true);
  });

  it('leaves small images alone to avoid needless quality loss', () => {
    expect(shouldCompress({ type: 'image/jpeg', size: 200 * 1024 })).toBe(false);
  });

  it('never touches animations, vector images or documents', () => {
    expect(shouldCompress({ type: 'image/gif', size: 5 * MB })).toBe(false);
    expect(shouldCompress({ type: 'image/svg+xml', size: 5 * MB })).toBe(false);
    expect(shouldCompress({ type: 'application/pdf', size: 5 * MB })).toBe(false);
    expect(shouldCompress({ type: '', size: 5 * MB })).toBe(false);
  });
});
