import { describe, expect, it } from 'vitest';
import { stackLayout } from '../../src/lib/longImage';

describe('stackLayout', () => {
  it('stacks the posters at 1080 px wide, each keeping its shape', () => {
    expect(stackLayout([{ width: 864, height: 1080 }, { width: 1080, height: 1350 }], 1080, 30000)).toEqual({
      width: 1080,
      height: 2700,
      rows: [{ y: 0, height: 1350 }, { y: 1350, height: 1350 }],
    });
  });

  it('shrinks everything when the strip would be taller than a browser canvas allows', () => {
    const layout = stackLayout(Array.from({ length: 30 }, () => ({ width: 1080, height: 1350 })), 1080, 30000);
    expect(layout.height).toBeLessThanOrEqual(30000);
    expect(layout.width).toBeLessThan(1080);
    expect(layout.rows.at(-1)!.y + layout.rows.at(-1)!.height).toBe(layout.height);
  });

  it('gives an empty strip for no images', () => {
    expect(stackLayout([], 1080, 30000)).toEqual({ width: 1080, height: 0, rows: [] });
  });
});
