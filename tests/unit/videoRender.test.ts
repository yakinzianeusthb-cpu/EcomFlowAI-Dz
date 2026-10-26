import { describe, expect, it } from 'vitest';
import { coverKeeps, highlightIndex, inkOn } from '../../src/lib/videoRender';

describe('coverKeeps', () => {
  it('keeps the whole photo when it has the shape of the frame', () => {
    expect(coverKeeps(720, 1280, 720, 1280)).toBe(1);
    expect(coverKeeps(1080, 1080, 720, 720)).toBe(1);
  });

  it('keeps a little over half of a square photo in a story frame (it fills the frame)', () => {
    expect(coverKeeps(1000, 1000, 720, 1280)).toBeCloseTo(0.5625);
  });

  it('keeps under a third of a wide photo in a story frame (it is shown whole instead)', () => {
    expect(coverKeeps(1200, 630, 720, 1280)).toBeLessThan(0.3);
    expect(coverKeeps(600, 1000, 1280, 720)).toBeLessThan(0.5);
  });
});

describe('highlightIndex', () => {
  it('highlights the word with a number first (a price, a quantity)', () => {
    expect(highlightIndex(['Livraison', 'en', '48h', 'partout'])).toBe(2);
    expect(highlightIndex(['التوصيل', 'في', '58', 'ولاية'])).toBe(2);
  });

  it('otherwise highlights the longest word of four letters or more', () => {
    expect(highlightIndex(['Fini', 'la', 'fatigue'])).toBe(2);
  });

  it('highlights nothing in a caption of short words', () => {
    expect(highlightIndex(['oui', 'et', 'non'])).toBe(-1);
    expect(highlightIndex([])).toBe(-1);
  });
});

describe('inkOn', () => {
  it('writes black on a light brand colour and white on a dark one', () => {
    expect(inkOn('#ffd23f')).toBe('#111111');
    expect(inkOn('#fff')).toBe('#111111');
    expect(inkOn('#0b1f4d')).toBe('#ffffff');
    expect(inkOn('#d21034')).toBe('#ffffff');
  });

  it('falls back to black for anything that is not a hex colour', () => {
    expect(inkOn('rebeccapurple')).toBe('#111111');
    expect(inkOn('')).toBe('#111111');
  });
});
