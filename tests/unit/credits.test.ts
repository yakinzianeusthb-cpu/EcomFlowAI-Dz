import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CREDIT_PACKS, DEFAULT_CREDIT_SETTINGS, MAX_PACKS, TEXT_BLOCK_TOKENS,
  creditSettingsFrom, isGrant, parseCreditSettings, readPacks, textCharge, videoCharge,
} from '../../src/lib/credits';

describe('creditSettingsFrom', () => {
  it('uses the defaults when nothing is stored', () => {
    expect(creditSettingsFrom(null)).toEqual(DEFAULT_CREDIT_SETTINGS);
    expect(creditSettingsFrom({})).toEqual(DEFAULT_CREDIT_SETTINGS);
  });

  it('keeps stored values and replaces only the broken ones', () => {
    const settings = creditSettingsFrom({ creditTextCost: 2, creditImageCost: -1, creditVideoSecondCost: 1.5, creditPacks: [{ id: 'mini', points: 50, price: 600 }] });
    expect(settings).toEqual({ textCost: 2, imageCost: 5, videoSecondCost: 8, packs: [{ id: 'mini', points: 50, price: 600 }] });
  });
});

describe('readPacks', () => {
  it('drops invalid and repeated packs, and strips unknown fields', () => {
    const packs = readPacks([
      { id: 'a', points: 10, price: 100, extra: 'x' },
      { id: 'a', points: 20, price: 200 },
      { id: 'Bad Id', points: 10, price: 100 },
      { id: 'b', points: 0, price: 100 },
      { id: 'c', points: 10, price: -5 },
      'nonsense',
    ]);
    expect(packs).toEqual([{ id: 'a', points: 10, price: 100 }]);
  });

  it('falls back to the default packs when none is valid, and keeps at most MAX_PACKS', () => {
    expect(readPacks('x')).toEqual(DEFAULT_CREDIT_PACKS);
    const many = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, points: 10, price: 100 }));
    expect(readPacks(many)).toHaveLength(MAX_PACKS);
  });
});

describe('parseCreditSettings', () => {
  const valid = { textCost: 1, imageCost: 5, videoSecondCost: 8, packs: [{ id: 'starter', points: 100, price: 1000 }] };

  it('accepts whole numbers and at least one pack', () => {
    expect(parseCreditSettings(valid)).toEqual({ ok: true, settings: valid });
  });

  it('refuses the whole request when one value is wrong', () => {
    for (const body of [
      { ...valid, textCost: 1.5 },
      { ...valid, imageCost: -1 },
      { ...valid, videoSecondCost: '8' },
      { ...valid, packs: [] },
      { ...valid, packs: [{ id: 'x', points: 10, price: 100 }, { id: 'x', points: 20, price: 200 }] },
      { ...valid, packs: [{ id: 'x', points: 0, price: 100 }] },
      null,
    ]) {
      expect(parseCreditSettings(body).ok, JSON.stringify(body)).toBe(false);
    }
  });
});

describe('textCharge', () => {
  it('charges one block at least, then one per started block of tokens', () => {
    expect(textCharge(0, 1)).toBe(1);
    expect(textCharge(undefined, 1)).toBe(1);
    expect(textCharge(TEXT_BLOCK_TOKENS, 1)).toBe(1);
    expect(textCharge(TEXT_BLOCK_TOKENS + 1, 1)).toBe(2);
    expect(textCharge(15_200, 2)).toBe(8);
  });
});

describe('videoCharge and isGrant', () => {
  it('charges per second of video', () => {
    expect(videoCharge(8, 8)).toBe(64);
    expect(videoCharge(4, 0)).toBe(0);
  });

  it('accepts whole, non-zero grants, negative ones taking points back', () => {
    expect(isGrant(50)).toBe(true);
    expect(isGrant(-20)).toBe(true);
    expect(isGrant(0)).toBe(false);
    expect(isGrant(2.5)).toBe(false);
    expect(isGrant('10')).toBe(false);
  });
});
