import { describe, expect, it } from 'vitest';
import { discountPercent, formatMoney, parsePrice } from '../../src/lib/landingMoney';

const NBSP = ' ';

describe('parsePrice', () => {
  it('reads the amount of a price as sellers type it', () => {
    expect(parsePrice('2 900 DA')).toMatchObject({ value: 2900, prefix: '', suffix: ' DA', sep: NBSP });
    expect(parsePrice('2900 دج')).toMatchObject({ value: 2900, suffix: ' دج', sep: '' });
    expect(parsePrice('2.900 DA')).toMatchObject({ value: 2900, sep: '.' });
    expect(parsePrice(`12${NBSP}500 DA`)).toMatchObject({ value: 12500, sep: NBSP });
    expect(parsePrice('DA 4500')).toMatchObject({ value: 4500, prefix: 'DA ', suffix: '' });
  });

  it('returns null when there is no amount', () => {
    expect(parsePrice('')).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
    expect(parsePrice('Prix sur demande')).toBeNull();
    expect(parsePrice('0 DA')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('writes an amount the way the price was written', () => {
    expect(formatMoney(parsePrice('2 900 DA')!, 5800)).toBe(`5${NBSP}800 DA`);
    expect(formatMoney(parsePrice('2900 دج')!, 8700)).toBe('8700 دج');
    expect(formatMoney(parsePrice('2.900 DA')!, 1250000)).toBe('1.250.000 DA');
  });
});

describe('discountPercent', () => {
  it('computes the saving from the two prices the seller typed', () => {
    expect(discountPercent('2 900 DA', '4 500 DA')).toBe(36);
    expect(discountPercent('1000', '2000')).toBe(50);
  });

  it('shows no saving when it cannot be computed or is not one', () => {
    expect(discountPercent('2 900 DA', '')).toBeNull();
    expect(discountPercent('4 500 DA', '2 900 DA')).toBeNull();
    expect(discountPercent('2 900 DA', '2 900 DA')).toBeNull();
    expect(discountPercent('', '4 500 DA')).toBeNull();
  });
});
