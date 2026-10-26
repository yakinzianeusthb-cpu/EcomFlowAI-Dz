import { describe, expect, it } from 'vitest';
import { anchorPoint, cubicBezier, damp, EASE_OUT, nextPixelRatio, panelRange, pickQuality, scrollProgress } from '../../src/lib/heroMotion';

describe('cubicBezier', () => {
  it('matches the CSS "ease" curve at its midpoint', () => {
    // the browser's ease (0.25, 0.1, 0.25, 1) is 0.8024 at t = 0.5
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3);
  });

  it('is the identity for the linear curve', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    for (const t of [0, 0.1, 0.33, 0.5, 0.9, 1]) expect(linear(t)).toBeCloseTo(t, 5);
  });

  it('starts at 0, ends at 1, and never goes back', () => {
    let previous = -1;
    for (let i = 0; i <= 100; i++) {
      const v = EASE_OUT(i / 100);
      expect(v).toBeGreaterThanOrEqual(previous);
      previous = v;
    }
    expect(EASE_OUT(0)).toBe(0);
    expect(EASE_OUT(1)).toBe(1);
  });

  it('is a strong ease-out: most of the way there by the middle', () => {
    expect(EASE_OUT(0.5)).toBeGreaterThan(0.9);
  });

  it('clamps times outside 0..1', () => {
    expect(EASE_OUT(-2)).toBe(0);
    expect(EASE_OUT(3)).toBe(1);
  });
});

describe('damp', () => {
  it('does not move without time, and arrives after a long time', () => {
    expect(damp(0, 10, 4, 0)).toBe(0);
    expect(damp(0, 10, 4, 100)).toBeCloseTo(10, 6);
  });

  it('gives the same result at any frame rate', () => {
    const once = damp(0, 1, 5, 1 / 30);
    const twice = damp(damp(0, 1, 5, 1 / 60), 1, 5, 1 / 60);
    expect(twice).toBeCloseTo(once, 10);
  });
});

describe('scrollProgress', () => {
  it('goes from 0 at the top of the hero to 1 once it has scrolled away', () => {
    expect(scrollProgress(0, 800)).toBe(0);
    expect(scrollProgress(120, 800)).toBe(0);
    expect(scrollProgress(-400, 800)).toBe(0.5);
    expect(scrollProgress(-1600, 800)).toBe(1);
  });

  it('is 0 for an element without height', () => {
    expect(scrollProgress(-50, 0)).toBe(0);
  });
});

describe('pickQuality', () => {
  it('gives a desktop real glass and a sharp picture', () => {
    const q = pickQuality({ width: 1440, coarsePointer: false, devicePixelRatio: 2, cores: 8, memoryGb: 8 });
    expect(q).toEqual({ pixelRatio: 1.75, transmission: true, detail: 'high' });
  });

  it('keeps a phone light: no glass pass, capped resolution', () => {
    const q = pickQuality({ width: 390, coarsePointer: true, devicePixelRatio: 3, cores: 8, memoryGb: 4 });
    expect(q).toEqual({ pixelRatio: 1.5, transmission: false, detail: 'low' });
  });

  it('treats a weak machine as weak whatever its screen', () => {
    expect(pickQuality({ width: 1920, coarsePointer: false, devicePixelRatio: 1, cores: 2, memoryGb: 8 }).transmission).toBe(false);
    expect(pickQuality({ width: 1920, coarsePointer: false, devicePixelRatio: 2, cores: 8, memoryGb: 2 })).toEqual({ pixelRatio: 1, transmission: false, detail: 'low' });
  });

  it('never renders above the screen resolution', () => {
    expect(pickQuality({ width: 1440, coarsePointer: false, devicePixelRatio: 1, cores: 8, memoryGb: 8 }).pixelRatio).toBe(1);
  });
});

describe('nextPixelRatio', () => {
  it('lowers the resolution while frames are slow, down to a floor', () => {
    expect(nextPixelRatio(1.5, 30, 0.75)).toBeCloseTo(1.2, 6);
    expect(nextPixelRatio(0.8, 30, 0.75)).toBe(0.75);
  });

  it('keeps it when frames are on time', () => {
    expect(nextPixelRatio(1.5, 14, 0.75)).toBe(1.5);
  });
});

describe('panelRange', () => {
  const canvas = { left: 0, width: 1000 };
  it('gives the glass panel as a share of the canvas width', () => {
    expect(panelRange({ left: 0, right: 470 }, canvas)).toEqual({ start: 0, end: 0.47 });
  });

  it('works for a panel on the right (Arabic layout)', () => {
    expect(panelRange({ left: 530, right: 1000 }, canvas)).toEqual({ start: 0.53, end: 1 });
  });

  it('clamps a panel that overflows the canvas', () => {
    expect(panelRange({ left: -40, right: 1200 }, { left: 0, width: 1000 })).toEqual({ start: 0, end: 1 });
  });
});

describe('anchorPoint', () => {
  const canvas = { left: 0, top: 0, width: 1000, height: 800 };
  it('maps the centre of the canvas to 0,0', () => {
    expect(anchorPoint({ left: 400, top: 300, width: 200, height: 200 }, canvas)).toEqual({ x: 0, y: 0, size: 0.25 });
  });

  it('uses screen axes: right is +x, up is +y', () => {
    const p = anchorPoint({ left: 750, top: 0, width: 250, height: 200 }, canvas);
    expect(p.x).toBeCloseTo(0.75, 6);
    expect(p.y).toBeCloseTo(0.75, 6);
  });

  it('is relative to the canvas, wherever it sits on the page', () => {
    const p = anchorPoint({ left: 500, top: 1100, width: 0, height: 400 }, { left: 0, top: 900, width: 1000, height: 800 });
    expect(p).toEqual({ x: 0, y: 0, size: 0.5 });
  });

  it('fits the object in the box: a narrow box limits its size', () => {
    expect(anchorPoint({ left: 450, top: 200, width: 100, height: 400 }, canvas).size).toBe(0.125);
    expect(anchorPoint({ left: 300, top: 350, width: 400, height: 100 }, canvas).size).toBe(0.125);
  });
});
