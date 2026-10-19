import { describe, expect, it } from 'vitest';
import { BRAND_ERRORS, BRAND_STYLES, parseBrandKitInput } from '../../src/lib/brandRules';

describe('parseBrandKitInput', () => {
  it('accepts a full brand profile and tidies it', () => {
    expect(parseBrandKitInput({
      brandName: '  Lumina ', colors: ['#5B3DF5', '#fff', '#5b3df5'], headingFont: 'Playfair Display', bodyFont: 'Inter',
      tone: 'Chaleureux', audience: 'Femmes 25-40', instructions: 'Toujours montrer le flacon', styles: ['luxury', 'natural'],
      logoAssetId: '0b6f3c1e-8d2a-4f6b-9c3d-2e1f0a9b8c7d',
    })).toEqual({
      data: {
        brandName: 'Lumina', colors: ['#5b3df5', '#fff'], headingFont: 'Playfair Display', bodyFont: 'Inter',
        tone: 'Chaleureux', audience: 'Femmes 25-40', instructions: 'Toujours montrer le flacon', styles: ['luxury', 'natural'],
        logoAssetId: '0b6f3c1e-8d2a-4f6b-9c3d-2e1f0a9b8c7d',
      },
    });
  });

  it('only keeps real colours, at most six', () => {
    expect(parseBrandKitInput({ colors: ['red; background:url(x)'] })).toEqual({ error: BRAND_ERRORS.colors });
    expect(parseBrandKitInput({ colors: Array.from({ length: 7 }, (_, i) => `#00000${i}`) })).toEqual({ error: BRAND_ERRORS.colors });
  });

  it('refuses font names that could break out of CSS', () => {
    expect(parseBrandKitInput({ headingFont: 'Inter"; } body { display:none' })).toEqual({ error: BRAND_ERRORS.font });
  });

  it('refuses unknown styles and a logo id that is not an id', () => {
    expect(parseBrandKitInput({ styles: ['vaporwave'] })).toEqual({ error: BRAND_ERRORS.styles });
    expect(parseBrandKitInput({ logoAssetId: 'drop table' })).toEqual({ error: BRAND_ERRORS.logo });
    expect(parseBrandKitInput({ logoAssetId: null })).toEqual({ data: { logoAssetId: null } });
  });

  it('refuses text that is too long', () => {
    expect(parseBrandKitInput({ instructions: 'x'.repeat(2001) })).toEqual({ error: BRAND_ERRORS.tooLong });
  });

  it('offers a fixed set of styles', () => {
    expect(BRAND_STYLES.length).toBeGreaterThanOrEqual(5);
  });
});
