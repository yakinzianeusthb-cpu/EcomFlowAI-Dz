import { describe, expect, it } from 'vitest';
import { contrast } from '../../src/lib/color';
import { LANDING_TEMPLATES, POSTER_PALETTE, THEMES, landingColors, toTemplate } from '../../src/lib/landingTheme';

describe('landingColors', () => {
  it('uses the first palette colour that stands out on the page as the brand colour', () => {
    expect(landingColors(['#0F766E', '#F59E0B'], 'impact').brand).toBe('#0f766e');
    expect(landingColors(['#1A1A1A', '#0A2463', '#D4AF37'], 'impact').brand).toBe('#1a1a1a');
  });

  it('skips a palette colour that would vanish on the page', () => {
    expect(landingColors(['#FFFFFF', '#0F766E'], 'impact').brand).toBe('#0f766e');
    // black buttons on the dark template would disappear: the light grey of the palette is used
    expect(landingColors(['#000000', '#E5E5E5', '#1A1A1A'], 'nuit').brand).toBe('#e5e5e5');
    expect(landingColors(['#1A1A1A', '#0A2463', '#D4AF37'], 'nuit').brand).toBe('#d4af37');
  });

  it('shades the brand colour when no palette colour stands out', () => {
    const { brand } = landingColors(['#FFFFFF', '#FAFAFA'], 'impact');
    expect(contrast(brand, THEMES.impact.bg)).toBeGreaterThanOrEqual(3);
  });

  it('falls back to the template colours without a usable palette', () => {
    expect(landingColors(undefined, 'elegance').brand).toBe(THEMES.elegance.brandFallback);
    expect(landingColors(['red; x', ''], 'impact').brand).toBe(THEMES.impact.brandFallback);
  });

  it('picks the most colourful other palette colour for the saving badge, or the template one', () => {
    expect(landingColors(['#1A1A1A', '#0A2463', '#D4AF37'], 'impact').accent).toBe('#d4af37');
    expect(landingColors(['#000000', '#E5E5E5', '#1A1A1A'], 'impact').accent).toBe(THEMES.impact.accentFallback);
  });

  it('lets the long-image page highlight in a light palette colour, the yellow bands of these posters', () => {
    expect(landingColors(['#0B132B', '#F59E0B', '#FFFFFF'], 'poster').accent).toBe('#f59e0b');
  });

  it('keeps the badge in the palette\'s family when its colours would vanish on the page', () => {
    // navy on the dark template would disappear: the badge takes the brand gold rather than a foreign colour
    expect(landingColors(['#1A1A1A', '#0A2463', '#D4AF37'], 'nuit').accent).toBe('#d4af37');
  });

  const POSTER_PALETTES = [['#0F766E', '#F59E0B'], ['#000000', '#E5E5E5'], ['#0B132B', '#F59E0B', '#FFFFFF'], ['#15803d'], ['#FFD23F', '#D21034'], ['#FDE68A'], [...POSTER_PALETTE], []];

  it('picks a highlight that reads on the long-image canvas, for its highlighted words and buttons', () => {
    // gold on black, the palette's own accent
    expect(landingColors(['#1A1A1A', '#0A2463', '#D4AF37'], 'poster').highlight).toBe('#d4af37');
    // amber on teal is too close: the classic yellow takes over
    expect(landingColors(['#0F766E', '#F59E0B'], 'poster').highlight).toBe('#facc15');
    for (const palette of POSTER_PALETTES) {
      const c = landingColors(palette, 'poster');
      expect(contrast(c.highlight, c.canvas), palette.join(',')).toBeGreaterThanOrEqual(3);
      expect(contrast(c.onHighlight, c.highlight), palette.join(',')).toBeGreaterThanOrEqual(4.5);
      // buttons run from the light shade to the deep one: their text reads on both ends
      expect(contrast(c.onHighlight, c.highlightDeep), palette.join(',')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.onHighlight, c.highlightLight), palette.join(',')).toBeGreaterThanOrEqual(4.5);
      expect(contrast(c.onPill, c.pill), palette.join(',')).toBeGreaterThanOrEqual(4.5);
      // the feature titles are highlight-coloured text on the feature boxes
      expect(contrast(c.highlight, c.pill), palette.join(',')).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps white text readable on the whole canvas, from its light top to its deep bottom', () => {
    for (const palette of POSTER_PALETTES) {
      const c = landingColors(palette, 'poster');
      for (const shade of [c.canvas, c.brandLight, c.brandDeep]) expect(contrast('#ffffff', shade), `${palette.join(',')} ${shade}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('paints the canvas in the brand colour, a very dark one brought up to a vivid shade of the same hue', () => {
    expect(landingColors([...POSTER_PALETTE], 'poster')).toMatchObject({ canvas: '#1554c0', highlight: '#facc15' });
    const navy = landingColors(['#0F2A5C', '#F5B700'], 'poster').canvas;
    expect(contrast(navy, '#0f2a5c')).toBeGreaterThan(1.5);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(navy.slice(i, i + 2), 16));
    expect(b).toBeGreaterThan(g);
    expect(g).toBeGreaterThan(r);
    // a black palette stays black: a dark luxury canvas
    expect(landingColors(['#1A1A1A', '#C0C0C0', '#D4AF37'], 'poster').canvas).toBe('#1a1a1a');
  });

  it('makes the pills and feature rows stand out even on a black canvas', () => {
    for (const palette of [['#1A1A1A', '#C0C0C0', '#D4AF37'], ['#000000', '#E5E5E5'], ['#0F766E', '#F59E0B']]) {
      const c = landingColors(palette, 'poster');
      expect(contrast(c.pill, c.canvas), palette.join(',')).toBeGreaterThanOrEqual(1.3);
    }
  });

  it('always gives readable text on the brand and accent colours, and brand-coloured text that reads', () => {
    const palettes = [['#0F766E', '#F59E0B'], ['#000000', '#E5E5E5'], ['#FFD23F', '#D21034'], ['#1A1A1A', '#0A2463', '#D4AF37'], []];
    for (const template of LANDING_TEMPLATES) {
      for (const palette of palettes) {
        const c = landingColors(palette, template);
        const label = `${template} ${palette.join(',')}`;
        expect(contrast(c.onBrand, c.brand), label).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c.onAccent, c.accent), label).toBeGreaterThanOrEqual(4.5);
        expect(contrast(c.brandText, THEMES[template].bg), label).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe('toTemplate', () => {
  it('accepts the known templates and falls back to the first one, the long-image page', () => {
    expect(toTemplate('nuit')).toBe('nuit');
    expect(toTemplate('elegance')).toBe('elegance');
    expect(toTemplate('impact')).toBe('impact');
    expect(toTemplate('other')).toBe('poster');
    expect(toTemplate(undefined)).toBe('poster');
  });
});

describe('THEMES', () => {
  it('keeps body and secondary text readable on every template', () => {
    for (const template of LANDING_TEMPLATES) {
      const theme = THEMES[template];
      expect(contrast(theme.ink, theme.bg), template).toBeGreaterThanOrEqual(7);
      expect(contrast(theme.muted, theme.bg), template).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.muted, theme.surface), template).toBeGreaterThanOrEqual(4.5);
      expect(theme.fonts.href).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?/);
    }
  });
});
