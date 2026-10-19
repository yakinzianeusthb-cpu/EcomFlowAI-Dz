/**
 * Draws an image ad on a canvas from a product photo, the concept's words and the brand colour
 * (layout rules in adCreative.ts). Runs in the browser; the result is a real JPEG the seller can upload anywhere.
 */
import { AD_FORMATS, creativeLayout, ctaLabel, readableTextOn, type AdFormat, type AdTemplate, type Rect } from './adCreative';
import type { AdConcept } from './adPack';
import type { ProjectLanguage } from './projectRules';
import { keepNumbersTogether } from './numberSpacing';
import { isRtlText, wrapText } from './videoTimeline';

const FONT = '"Noto Sans Arabic Variable", "Geist Variable", system-ui, sans-serif';
const DEFAULT_BRAND = '#6d4aff';
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export interface CreativeInput {
  format: AdFormat;
  template: AdTemplate;
  concept: Pick<AdConcept, 'overlay' | 'headline' | 'callToAction'>;
  /** language of the ad copy (for the button text) */
  language: ProjectLanguage;
  price?: string;
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  brandColor?: string;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

export async function loadCreativeFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(
    ['800 60px "Geist Variable"', '600 40px "Geist Variable"', '800 60px "Noto Sans Arabic Variable"', '600 40px "Noto Sans Arabic Variable"']
      .map((f) => document.fonts.load(f).catch(() => [])),
  );
}

function roundRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
}

function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement, area: Rect, fit: 'cover' | 'contain') {
  const scale = fit === 'cover' ? Math.max(area.w / img.naturalWidth, area.h / img.naturalHeight) : Math.min(area.w / img.naturalWidth, area.h / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = area.x + (area.w - w) / 2;
  const y = area.y + (area.h - h) / 2;
  ctx.save();
  if (fit === 'cover') {
    ctx.beginPath();
    ctx.rect(area.x, area.y, area.w, area.h);
    ctx.clip();
  } else {
    // a soft shadow under a product shown whole
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = area.w * 0.05;
    ctx.shadowOffsetY = area.w * 0.02;
  }
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

/** Largest font size (down to `min`) at which `text` fits in `rect` within `maxLines`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, rect: Rect, opts: { max: number; min: number; maxLines: number; weight: number }) {
  for (let size = opts.max; size >= opts.min; size -= 2) {
    ctx.font = `${opts.weight} ${size}px ${FONT}`;
    const lines = wrapText(text, rect.w, (s) => ctx.measureText(s).width, Infinity);
    if (lines.length <= opts.maxLines && lines.length * size * 1.22 <= rect.h) return { size, lines };
  }
  ctx.font = `${opts.weight} ${opts.min}px ${FONT}`;
  return { size: opts.min, lines: wrapText(text, rect.w, (s) => ctx.measureText(s).width, opts.maxLines) };
}

function drawTextBlock(ctx: CanvasRenderingContext2D, rect: Rect, overlay: string, headline: string, color: string, align: 'start' | 'center') {
  const W = AD_FORMATS.square.width;
  const rtl = isRtlText(overlay + headline);
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  const x = align === 'center' ? rect.x + rect.w / 2 : rtl ? rect.x + rect.w : rect.x;
  ctx.textAlign = align === 'center' ? 'center' : rtl ? 'right' : 'left';

  const headlineH = headline ? rect.h * 0.3 : 0;
  const big = fitText(ctx, keepNumbersTogether(overlay), { ...rect, h: rect.h - headlineH }, { max: Math.round(W * 0.095), min: Math.round(W * 0.05), maxLines: 3, weight: 800 });
  const small = headline
    ? fitText(ctx, keepNumbersTogether(headline), { ...rect, h: headlineH }, { max: Math.round(W * 0.042), min: Math.round(W * 0.03), maxLines: 2, weight: 600 })
    : null;

  // bottom-align the block in its area, so it sits right above the button
  const bigLine = big.size * 1.12;
  const smallLine = small ? small.size * 1.3 : 0;
  const gap = small ? big.size * 0.35 : 0;
  const blockH = big.lines.length * bigLine + (small ? gap + small.lines.length * smallLine : 0);
  const top = rect.y + Math.max(0, rect.h - blockH);
  ctx.font = `800 ${big.size}px ${FONT}`;
  big.lines.forEach((line, i) => ctx.fillText(line, x, top + i * bigLine + big.size * 0.88));
  if (small) {
    const smallTop = top + big.lines.length * bigLine + gap;
    ctx.font = `600 ${small.size}px ${FONT}`;
    ctx.globalAlpha = 0.9;
    small.lines.forEach((line, i) => ctx.fillText(line, x, smallTop + i * smallLine + small.size * 0.95));
    ctx.globalAlpha = 1;
  }
}

function drawPill(ctx: CanvasRenderingContext2D, rect: Rect, label: string, background: string, color: string) {
  roundRect(ctx, rect, rect.h / 2);
  ctx.fillStyle = background;
  ctx.fill();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = isRtlText(label) ? 'rtl' : 'ltr';
  let size = Math.round(rect.h * 0.4);
  ctx.font = `700 ${size}px ${FONT}`;
  while (ctx.measureText(label).width > rect.w * 0.86 && size > 12) {
    size -= 2;
    ctx.font = `700 ${size}px ${FONT}`;
  }
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + size * 0.04);
}

function shade(hex: string, amount: number): string {
  const h = hex.length === 4 ? hex.replace(/^#(.)(.)(.)$/, '#$1$1$2$2$3$3') : hex;
  const n = parseInt(h.slice(1), 16);
  const channel = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * (1 + amount))));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/** Paints the whole ad on `ctx` (whose canvas must be the size of the format). */
export function drawCreative(ctx: CanvasRenderingContext2D, input: CreativeInput): void {
  const { width: W, height: H } = AD_FORMATS[input.format];
  const L = creativeLayout(input.format, input.template);
  const brand = input.brandColor && HEX.test(input.brandColor) ? input.brandColor : DEFAULT_BRAND;
  const onBrand = readableTextOn(brand);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0c0c0f';
  ctx.fillRect(0, 0, W, H);

  if (L.panel) {
    if (input.template === 'studio') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, shade(brand, 0.08));
      g.addColorStop(1, shade(brand, -0.45));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = brand;
    }
    ctx.fillRect(L.panel.x, L.panel.y, L.panel.w, L.panel.h);
  }

  if (input.photo) drawPhoto(ctx, input.photo, L.photo, L.photoFit);

  if (L.scrim) {
    const g = ctx.createLinearGradient(0, H * L.scrim.from, 0, H * L.scrim.to);
    g.addColorStop(0, 'rgba(8, 8, 10, 0)');
    g.addColorStop(1, 'rgba(8, 8, 10, 0.82)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * L.scrim.from, W, H * (L.scrim.to - L.scrim.from));
  }

  if (input.logo && L.logo) {
    roundRect(ctx, L.logo, L.logo.w * 0.22);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fill();
    const inset = { x: L.logo.x + L.logo.w * 0.12, y: L.logo.y + L.logo.h * 0.12, w: L.logo.w * 0.76, h: L.logo.h * 0.76 };
    drawPhoto(ctx, input.logo, inset, 'contain');
  }

  if (input.price && L.badge) drawPill(ctx, L.badge, keepNumbersTogether(input.price), '#ffffff', '#121212');

  const textColor = input.template === 'spotlight' ? '#ffffff' : onBrand;
  drawTextBlock(ctx, L.text, input.concept.overlay, input.concept.headline, textColor, input.template === 'studio' ? 'center' : 'start');

  const label = ctaLabel(input.concept.callToAction, input.language);
  if (input.template === 'spotlight') drawPill(ctx, L.cta, label, brand, onBrand);
  else drawPill(ctx, L.cta, label, onBrand, onBrand === '#ffffff' ? brand : '#ffffff');
}

/** The ad as a JPEG file. */
export async function renderCreativeBlob(input: CreativeInput, quality = 0.9): Promise<Blob> {
  await loadCreativeFonts();
  const { width, height } = AD_FORMATS[input.format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  drawCreative(ctx, input);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encoding failed'))), 'image/jpeg', quality));
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(blob);
  });
