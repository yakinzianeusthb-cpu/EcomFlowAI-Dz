import { describe, expect, it } from 'vitest';
import { joinDigitGroups, keepNumbersTogether } from '../../src/lib/numberSpacing';

const NBSP = ' ';

describe('keepNumbersTogether', () => {
  it('joins the digit groups of a spaced number with a no-break space', () => {
    expect(keepNumbersTogether('2 900 دج')).toBe(`2${NBSP}900 دج`);
    expect(keepNumbersTogether('1 250 000 DA')).toBe(`1${NBSP}250${NBSP}000 DA`);
    expect(keepNumbersTogether('السعر 4 500 دج فقط')).toBe(`السعر 4${NBSP}500 دج فقط`);
  });

  it('leaves every other space alone', () => {
    expect(keepNumbersTogether('Top 5 1000 clients')).toBe('Top 5 1000 clients');
    expect(keepNumbersTogether('0555 12 34 56')).toBe('0555 12 34 56');
    expect(keepNumbersTogether('le 18 2026')).toBe('le 18 2026');
    expect(keepNumbersTogether('اطلب الآن')).toBe('اطلب الآن');
    expect(keepNumbersTogether('')).toBe('');
  });
});

describe('joinDigitGroups', () => {
  it('writes a spaced number without its spaces, for text whose no-break spaces may be lost', () => {
    expect(joinDigitGroups('2 900 DA')).toBe('2900 DA');
    expect(joinDigitGroups(`1 250${NBSP}000 دج`)).toBe('1250000 دج');
  });

  it('leaves every other space alone', () => {
    expect(joinDigitGroups('0555 12 34 56')).toBe('0555 12 34 56');
    expect(joinDigitGroups('Top 5 1000 clients')).toBe('Top 5 1000 clients');
  });
});
