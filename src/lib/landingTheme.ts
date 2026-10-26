/**
 * The looks a landing page can take, and how each one uses the seller's palette. Every template has its own
 * surfaces, type and shapes (landingStyle.ts writes the CSS); the palette gives the brand colour of the buttons and
 * the accent of the saving badge, adjusted so that text on them, and brand-coloured text, always reads.
 */
import { chroma, contrast, inkOn, legibleOn, luminance, mix, normalizeHex, parseHex, toRgbList } from './color';

export type LandingTemplate = 'poster' | 'impact' | 'elegance' | 'nuit';
/** In the publisher's order; the first is the default (the long-image page Algerian shops use most). */
export const LANDING_TEMPLATES: readonly LandingTemplate[] = ['poster', 'impact', 'elegance', 'nuit'];

export interface Theme {
  /** page, alternate sections, cards and form fields */
  bg: string;
  surface: string;
  card: string;
  fieldBg: string;
  /** text, secondary text, rules */
  ink: string;
  muted: string;
  line: string;
  fieldLine: string;
  /** used when the palette gives nothing usable */
  brandFallback: string;
  accentFallback: string;
  /** how much a palette colour must stand out from the page to be the accent (the highlight bands, the saving badge) */
  accentMinContrast: number;
  /** corner radius of cards and of buttons */
  radius: number;
  buttonRadius: number;
  fonts: { display: string; body: string; href: string };
}

const FONTS = 'https://fonts.googleapis.com/css2?';

export const THEMES: Record<LandingTemplate, Theme> = {
  // the long-image page: one phone-width column of posters, heavy Arabic type, highlight bands, big buttons
  poster: {
    bg: '#e9ecf1', surface: '#f3f5f8', card: '#ffffff', fieldBg: '#ffffff',
    ink: '#0b1220', muted: '#4a5568', line: '#e2e6ec', fieldLine: '#cdd4de',
    brandFallback: '#15803d', accentFallback: '#facc15',
    accentMinContrast: 1.25, radius: 20, buttonRadius: 999,
    fonts: {
      display: "'Cairo', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
      body: "'Cairo', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
      href: `${FONTS}family=Cairo:wght@400;600;700;900&display=swap`,
    },
  },
  // bright and direct: a tinted hero, bold type, round buttons
  impact: {
    bg: '#ffffff', surface: '#f4f6f9', card: '#ffffff', fieldBg: '#ffffff',
    ink: '#0b1220', muted: '#4a5568', line: '#e5e8ee', fieldLine: '#d3d9e2',
    brandFallback: '#1d4ed8', accentFallback: '#e11d48',
    accentMinContrast: 2, radius: 20, buttonRadius: 999,
    fonts: {
      display: "'Alexandria', 'Readex Pro', system-ui, sans-serif",
      body: "'Readex Pro', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
      href: `${FONTS}family=Alexandria:wght@600;800&family=Readex+Pro:wght@400;600&display=swap`,
    },
  },
  // quiet and premium: ivory, a serif display, thin rules, square corners
  elegance: {
    bg: '#f8f5ef', surface: '#f0ebe1', card: '#fffdf8', fieldBg: '#fffdf8',
    ink: '#1c1917', muted: '#57534e', line: '#e3dbcd', fieldLine: '#d4cab9',
    brandFallback: '#1c1917', accentFallback: '#a37b3d',
    accentMinContrast: 2, radius: 4, buttonRadius: 2,
    fonts: {
      display: "'El Messiri', Georgia, 'Times New Roman', serif",
      body: "'IBM Plex Sans Arabic', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
      href: `${FONTS}family=El+Messiri:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap`,
    },
  },
  // dark, for gadgets and accessories: deep surfaces, a glow of the brand colour
  nuit: {
    bg: '#0a0c10', surface: '#10141b', card: '#131823', fieldBg: '#0d1016',
    ink: '#eef2f7', muted: '#9aa5b4', line: '#232a36', fieldLine: '#2c3442',
    brandFallback: '#818cf8', accentFallback: '#22d3ee',
    accentMinContrast: 2, radius: 20, buttonRadius: 14,
    fonts: {
      display: "'Changa', 'Readex Pro', system-ui, sans-serif",
      body: "'Readex Pro', system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif",
      href: `${FONTS}family=Changa:wght@600;800&family=Readex+Pro:wght@400;600&display=swap`,
    },
  },
};

export function toTemplate(value: string | undefined): LandingTemplate {
  return LANDING_TEMPLATES.includes(value as LandingTemplate) ? (value as LandingTemplate) : LANDING_TEMPLATES[0];
}

export interface LandingColors {
  /** buttons and filled marks, with the text that goes on them */
  brand: string;
  onBrand: string;
  /** the brand colour as text or icon on the page */
  brandText: string;
  /** "r, g, b" of the brand colour, for glows and shadows */
  brandRgb: string;
  /** the saving badge */
  accent: string;
  onAccent: string;
  /** a soft wash of the brand colour, and a rule on it */
  tint: string;
  tintLine: string;
  /** the long-image canvas (white text reads on all three): its colour, its lighter top and its deeper shade (frame, bands) */
  canvas: string;
  brandLight: string;
  brandDeep: string;
  /** pills and feature boxes on the canvas */
  pill: string;
  onPill: string;
  /** highlighted words and buttons on the canvas */
  highlight: string;
  onHighlight: string;
  /** the highlight's lighter and deeper shades, for the gradient of highlighted words and buttons */
  highlightLight: string;
  highlightDeep: string;
}

const HIGHLIGHT_YELLOW = '#facc15';
/** The deep blue and yellow of the long images Algerian shops publish: the long-image page's colours unless the seller picks the product's. */
export const POSTER_PALETTE: readonly string[] = ['#1554c0', '#facc15', '#ffffff'];
/** a canvas this dark looks dull: a colourful one is brought up to this luminance (white text still reads) */
const VIVID_LUMINANCE = 0.085;

/** The brand colour as a canvas for white text: darkened until white reads on it, a very dark colour made vivid again. */
function canvasOf(brand: string): string {
  const base = legibleOn(brand, '#ffffff', 4.5);
  const rgb = parseHex(base);
  if (!rgb || chroma(base) < 0.15 || (luminance(base) ?? 0) >= VIVID_LUMINANCE) return base;
  // the same hue, lighter: every channel scaled up until the canvas is vivid, white text still reading
  for (let k = 1.05; k <= 4; k += 0.05) {
    const shade = normalizeHex(`#${rgb.map((c) => Math.round(Math.min(255, c * k)).toString(16).padStart(2, '0')).join('')}`) ?? base;
    if ((luminance(shade) ?? 0) >= VIVID_LUMINANCE) return contrast(shade, '#ffffff') >= 4.5 ? shade : base;
  }
  return base;
}

export function landingColors(palette: readonly (string | undefined)[] | undefined, template: LandingTemplate): LandingColors {
  const theme = THEMES[template];
  const colors = (palette ?? []).map((c) => normalizeHex(c ?? '')).filter((c): c is string => c !== null);
  // the first palette colour that stands out on this page; else the first one, shaded until it does
  const brand = colors.find((c) => contrast(c, theme.bg) >= 3) ?? (colors[0] ? legibleOn(colors[0], theme.bg, 3) : theme.brandFallback);
  // the saving badge: the most colourful other palette colour that shows on this page; when the palette's colours
  // would vanish here, the brand colour (same family); a palette of greys gets the template's accent
  const vivid = colors.filter((c) => c !== brand && chroma(c) >= 0.2).sort((a, b) => chroma(b) - chroma(a));
  const accent = vivid.find((c) => contrast(c, theme.bg) >= theme.accentMinContrast) ?? (vivid.length ? brand : theme.accentFallback);
  // the long-image canvas, always dark enough for white text; on it, the accent when it stands out, else the classic
  // yellow, else white
  const canvas = canvasOf(brand);
  const highlight = [accent, HIGHLIGHT_YELLOW].find((c) => contrast(c, canvas) >= 3) ?? '#ffffff';
  // a deeper shade of the canvas; on a near-black canvas, a lighter one, or it would vanish
  const pill = (luminance(canvas) ?? 0) < 0.03 ? mix(canvas, '#ffffff', 0.16) : mix(canvas, '#000000', 0.42);
  return {
    brand,
    onBrand: inkOn(brand),
    brandText: legibleOn(brand, theme.bg, 4.5),
    brandRgb: toRgbList(brand),
    accent,
    onAccent: inkOn(accent),
    tint: mix(brand, theme.bg, 0.9),
    tintLine: mix(brand, theme.bg, 0.72),
    canvas,
    brandLight: legibleOn(mix(canvas, '#ffffff', 0.16), '#ffffff', 4.5),
    brandDeep: mix(canvas, '#000000', 0.38),
    pill,
    onPill: inkOn(pill),
    highlight,
    onHighlight: inkOn(highlight),
    highlightLight: mix(highlight, '#ffffff', 0.4),
    highlightDeep: mix(highlight, '#000000', 0.14),
  };
}
