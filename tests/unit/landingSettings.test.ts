import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, readSettings } from '../../src/lib/landingSettings';

describe('readSettings', () => {
  it('gives the defaults when nothing is saved or the saved text is broken', () => {
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(readSettings('{not json')).toEqual(DEFAULT_SETTINGS);
    expect(readSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('starts with delivery to the 58 wilayas ticked, and no guarantee promised', () => {
    expect(DEFAULT_SETTINGS.promises).toEqual({ nationwide: true, inspection: false, guarantee: false });
    expect(DEFAULT_SETTINGS.deliveryMode).toBe('by-wilaya');
    // the long-image page, the format Algerian shops use most, in the deep blue and yellow of their posters
    expect(DEFAULT_SETTINGS.template).toBe('poster');
    expect(DEFAULT_SETTINGS.posterColors).toBe('blue');
  });

  it('reads back what the seller chose', () => {
    const saved = JSON.stringify({ template: 'nuit', posterColors: 'product', storeName: 'Dz Shop', deliveryMode: 'fixed', deliveryFee: '400 DA', promises: { nationwide: false, inspection: true, guarantee: true } });
    expect(readSettings(saved)).toEqual({ template: 'nuit', posterColors: 'product', storeName: 'Dz Shop', deliveryMode: 'fixed', deliveryFee: '400 DA', promises: { nationwide: false, inspection: true, guarantee: true } });
  });

  it('replaces each unexpected value by its default, keeping the rest', () => {
    const saved = JSON.stringify({ template: 'neon', posterColors: 'pink', storeName: 12, deliveryMode: 'drone', deliveryFee: null, promises: { nationwide: 'yes', guarantee: true } });
    expect(readSettings(saved)).toEqual({ ...DEFAULT_SETTINGS, promises: { ...DEFAULT_SETTINGS.promises, guarantee: true } });
  });

  it('keeps names and amounts short', () => {
    const saved = JSON.stringify({ storeName: 'x'.repeat(500), deliveryFee: '9'.repeat(100) });
    const settings = readSettings(saved);
    expect(settings.storeName.length).toBeLessThanOrEqual(80);
    expect(settings.deliveryFee.length).toBeLessThanOrEqual(20);
  });
});
