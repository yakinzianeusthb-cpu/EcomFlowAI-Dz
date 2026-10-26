/**
 * Colour helpers for what is made from the seller's palette (landing pages, videos). Only #rgb and #rrggbb colours
 * are read: anything else is treated as unknown, never passed on.
 */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const BLACK_INK = '#111111';
const WHITE_INK = '#ffffff';

export type Rgb = [number, number, number];

export function parseHex(color: string): Rgb | null {
  const hex = HEX.exec(color.trim())?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('')}`;

/** The colour as lowercase #rrggbb, or null when it is not a hex colour. */
export function normalizeHex(color: string): string | null {
  const rgb = parseHex(color);
  return rgb ? toHex(rgb) : null;
}

/** Relative luminance (WCAG): 0 for black, 1 for white; null for anything that is not a hex colour. */
export function luminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two colours, from 1 to 21 (1 when either cannot be read). */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return 1;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Black or white text, whichever reads better on a background colour (black for anything that is not a hex colour). */
export function inkOn(background: string): string {
  if (!parseHex(background)) return BLACK_INK;
  return contrast(WHITE_INK, background) > contrast(BLACK_INK, background) ? WHITE_INK : BLACK_INK;
}

/** `a` blended with `b`, `amount` being the share of `b` (0 to 1). A colour that cannot be read comes back as `a`. */
export function mix(a: string, b: string, amount: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  if (!x || !y) return a;
  const t = Math.max(0, Math.min(1, amount));
  return toHex(x.map((c, i) => c + (y[i] - c) * t));
}

/**
 * The colour itself when it reads on the background with at least `min` contrast; otherwise the closest shade that
 * does, darker on a light background and lighter on a dark one.
 */
export function legibleOn(color: string, background: string, min = 4.5): string {
  if (!parseHex(color) || !parseHex(background)) return color;
  if (contrast(color, background) >= min) return color;
  const target = inkOn(background) === WHITE_INK ? '#ffffff' : '#000000';
  for (let step = 1; step <= 20; step++) {
    const shade = mix(color, target, step / 20);
    if (contrast(shade, background) >= min) return shade;
  }
  return target;
}

/** How colourful a colour is, from 0 (a grey) to 1 (a pure hue). */
export function chroma(color: string): number {
  const rgb = parseHex(color);
  if (!rgb) return 0;
  return (Math.max(...rgb) - Math.min(...rgb)) / 255;
}

/** "r, g, b", for rgba() in CSS. */
export function toRgbList(color: string): string {
  return (parseHex(color) ?? [0, 0, 0]).join(', ');
}
