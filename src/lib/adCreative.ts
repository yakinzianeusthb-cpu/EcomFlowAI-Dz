/**
 * Layout of the image ads drawn from a product photo (rendering is in adCreativeRender.ts). Pure, so the
 * placement rules can be tested: everything fits, and story ads keep clear of the zones Meta's UI covers.
 */
import type { AdCta } from './adPack';
import type { ProjectLanguage } from './projectRules';

/** Sizes Meta recommends: square and 4:5 for feeds, 9:16 for Stories and Reels. */
export const AD_FORMATS = {
  square: { width: 1080, height: 1080, ratio: '1:1' },
  portrait: { width: 1080, height: 1350, ratio: '4:5' },
  story: { width: 1080, height: 1920, ratio: '9:16' },
} as const;
export type AdFormat = keyof typeof AD_FORMATS;

export const AD_TEMPLATES = ['spotlight', 'split', 'studio'] as const;
export type AdTemplate = (typeof AD_TEMPLATES)[number];

/** Share of a 9:16 image covered by the profile bar (top) and the reply/CTA bar (bottom) in Stories and Reels. */
export const STORY_SAFE_ZONE = { top: 0.14, bottom: 0.2 } as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CreativeLayout {
  photo: Rect;
  /** cover: fills the area (cropped); contain: the whole product is visible */
  photoFit: 'cover' | 'contain';
  /** a solid brand-colour area behind the text */
  panel: Rect | null;
  /** a dark gradient over the photo so white text stays readable */
  scrim: { from: number; to: number } | null;
  text: Rect;
  cta: Rect;
  badge: Rect | null;
  logo: Rect | null;
}

const r = (x: number, y: number, w: number, h: number): Rect => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });

export function creativeLayout(format: AdFormat, template: AdTemplate): CreativeLayout {
  const { width: W, height: H } = AD_FORMATS[format];
  const story = format === 'story';
  // the area text may use: everything for feeds, the safe zone for stories
  const top = story ? H * STORY_SAFE_ZONE.top : 0;
  const bottom = story ? H * (1 - STORY_SAFE_ZONE.bottom) : H;
  const pad = W * 0.07;
  const ctaH = W * 0.105;
  const badgeW = W * 0.32;
  const badgeH = W * 0.1;
  const logoS = W * 0.11;

  if (template === 'split') {
    const photoH = story ? H * 0.52 : H * 0.6;
    const panelTop = photoH;
    const ctaY = bottom - pad - ctaH;
    return {
      photo: r(0, 0, W, photoH),
      photoFit: 'cover',
      panel: r(0, panelTop, W, H - panelTop),
      scrim: null,
      text: r(pad, panelTop + pad * 0.8, W - pad * 2, ctaY - (panelTop + pad * 0.8) - pad * 0.5),
      cta: r(pad, ctaY, W * 0.5, ctaH),
      badge: r(W - pad - badgeW, Math.max(top + pad * 0.6, photoH - badgeH - pad * 0.6), badgeW, badgeH),
      logo: r(pad, top + pad * 0.6, logoS, logoS),
    };
  }

  if (template === 'studio') {
    const textY = top + pad;
    const textH = (bottom - top) * 0.22;
    const ctaY = bottom - pad - ctaH;
    const photoY = textY + textH + pad * 0.4;
    const photoH = ctaY - photoY - pad * 0.6;
    return {
      photo: r(pad, photoY, W - pad * 2, photoH),
      photoFit: 'contain',
      panel: r(0, 0, W, H),
      scrim: null,
      text: r(pad, textY, W - pad * 2, textH),
      cta: r((W - W * 0.5) / 2, ctaY, W * 0.5, ctaH),
      badge: r(W - pad - badgeW, photoY + pad * 0.3, badgeW, badgeH),
      logo: null,
    };
  }

  // spotlight: the photo fills the image, the copy sits low over a gradient
  const ctaY = bottom - pad - ctaH;
  const textH = (bottom - top) * (story ? 0.24 : 0.28);
  return {
    photo: r(0, 0, W, H),
    photoFit: 'cover',
    panel: null,
    scrim: { from: 0.4, to: 1 },
    text: r(pad, ctaY - pad * 0.6 - textH, W - pad * 2, textH),
    cta: r(pad, ctaY, W * 0.5, ctaH),
    badge: r(W - pad - badgeW, top + pad, badgeW, badgeH),
    logo: r(pad, top + pad, logoS, logoS),
  };
}

/** One layout per concept, in turn, so a pack never looks like copies of one design. */
export const templateFor = (index: number): AdTemplate => AD_TEMPLATES[index % AD_TEMPLATES.length];

const CTA_LABELS: Record<AdCta, Record<ProjectLanguage, string>> = {
  SHOP_NOW: { ar: 'تسوّق الآن', fr: 'Acheter', en: 'Shop now' },
  ORDER_NOW: { ar: 'اطلب الآن', fr: 'Commander', en: 'Order now' },
  BUY_NOW: { ar: 'اشترِ الآن', fr: 'Acheter maintenant', en: 'Buy now' },
  LEARN_MORE: { ar: 'اعرف المزيد', fr: 'En savoir plus', en: 'Learn more' },
  GET_OFFER: { ar: 'احصل على العرض', fr: "Profiter de l'offre", en: 'Get offer' },
  SIGN_UP: { ar: 'سجّل الآن', fr: "S'inscrire", en: 'Sign up' },
  CONTACT_US: { ar: 'تواصل معنا', fr: 'Nous contacter', en: 'Contact us' },
};

/** The button text drawn on the image, in the language of the ad (not of the interface). */
export const ctaLabel = (cta: AdCta, language: ProjectLanguage) => CTA_LABELS[cta]?.[language] ?? CTA_LABELS.SHOP_NOW[language];

/** White or near-black, whichever reads better on `background` (WCAG relative luminance). */
export function readableTextOn(background: string): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(background.trim());
  if (!m) return '#ffffff';
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const [rr, gg, bb] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  // contrast with white vs with #121212
  return (1.05 / (lum + 0.05)) >= ((lum + 0.05) / 0.0566) ? '#ffffff' : '#121212';
}
