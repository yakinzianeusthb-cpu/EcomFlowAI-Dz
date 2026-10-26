import { describe, expect, it } from 'vitest';
import { chroma, contrast, inkOn, legibleOn, luminance, mix, parseHex, toRgbList } from '../../src/lib/color';

describe('parseHex', () => {
  it('reads #rgb and #rrggbb colours', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('#0F766E')).toEqual([15, 118, 110]);
    expect(parseHex(' #000000 ')).toEqual([0, 0, 0]);
  });

  it('refuses anything else', () => {
    expect(parseHex('red')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('')).toBeNull();
  });
});

describe('contrast and luminance', () => {
  it('gives the WCAG contrast ratio', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });

  it('measures relative luminance', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
    expect(luminance('#000000')).toBe(0);
  });
});

describe('inkOn', () => {
  it('writes black on a light colour and white on a dark one', () => {
    expect(inkOn('#ffd23f')).toBe('#111111');
    expect(inkOn('#E5E5E5')).toBe('#111111');
    expect(inkOn('#0b1f4d')).toBe('#ffffff');
    expect(inkOn('#d21034')).toBe('#ffffff');
    expect(inkOn('#000000')).toBe('#ffffff');
  });

  it('falls back to black for anything that is not a hex colour', () => {
    expect(inkOn('rebeccapurple')).toBe('#111111');
  });
});

describe('mix', () => {
  it('blends two colours by the share of the second', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#0f766e', '#ffffff', 0)).toBe('#0f766e');
    expect(mix('#0f766e', '#ffffff', 1)).toBe('#ffffff');
  });
});

describe('legibleOn', () => {
  it('keeps a colour that already reads well on the background', () => {
    expect(legibleOn('#0f766e', '#ffffff', 4.5)).toBe('#0f766e');
  });

  it('darkens a light colour on a light background until it reads', () => {
    const fixed = legibleOn('#f59e0b', '#ffffff', 4.5);
    expect(contrast(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('lightens a dark colour on a dark background until it reads', () => {
    const fixed = legibleOn('#1a1a1a', '#0a0c10', 3);
    expect(contrast(fixed, '#0a0c10')).toBeGreaterThanOrEqual(3);
  });
});

describe('chroma and toRgbList', () => {
  it('tells a vivid colour from a grey', () => {
    expect(chroma('#d4af37')).toBeGreaterThan(0.5);
    expect(chroma('#e5e5e5')).toBe(0);
  });

  it('writes a colour as "r, g, b" for rgba()', () => {
    expect(toRgbList('#0f766e')).toBe('15, 118, 110');
  });
});
