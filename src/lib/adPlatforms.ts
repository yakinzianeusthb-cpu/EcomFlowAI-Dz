/**
 * Ready-to-upload ad packs for TikTok, Snapchat and Google (Search, Display, YouTube), made from a campaign's ad
 * concepts: each platform's text limits, the prompt that adapts the copy, and the clean-up of the AI's answer, so
 * every text fits before anyone sees it. Pure. The limits come from each platform's own documentation (October
 * 2026); README "Ad platform packs" lists the sources.
 */
import { COPY_LANGUAGE, OBJECTIVE, line, type AdConcept, type AdCta } from './adPack';
import type { BrandFields, BriefFields } from './campaignContext';
import type { ProjectLanguage } from './projectRules';

export const PACK_PLATFORMS = ['tiktok', 'snapchat', 'google'] as const;
export type PackPlatform = (typeof PACK_PLATFORMS)[number];

/** Character limits, counted as the platforms count them (see charCount). */
export const PACK_LIMITS = {
  /** TikTok shows 100 characters of a caption (outside Chinese, Japanese and Korean) before "See more" */
  tiktokText: 100,
  /** the name on the ad: TikTok's display name allows 20; Snapchat's brand name and Google's business name 25 */
  brandName: 20,
  snapHeadline: 34,
  googleHeadline: 30,
  googleDescription: 90,
  googleLongHeadline: 90,
  googlePath: 15,
  /** Demand Gen video ads on YouTube */
  youtubeHeadline: 40,
  youtubeCta: 10,
} as const;

/** A responsive search ad takes 3 to 15 headlines and 2 to 4 descriptions. */
export const GOOGLE_COUNTS = { headlines: { min: 3, max: 15 }, descriptions: { min: 2, max: 4 } } as const;

export interface TikTokAd {
  conceptId: string;
  adText: string;
}

export interface SnapAd {
  conceptId: string;
  headline: string;
}

export interface GoogleAssets {
  /** search headlines; the first five are also the display ad's headlines */
  headlines: string[];
  descriptions: string[];
  longHeadline: string;
  path1: string;
  path2: string;
  youtubeHeadline: string;
}

/** The copy of the three packs, saved with the ad pack it was written from. */
export interface PlatformCopy {
  /** the concepts it was written from (ids in the ad pack) */
  conceptIds: string[];
  /** TikTok's display name, Snapchat's brand name and Google's business name */
  brandName: string;
  tiktok: TikTokAd[];
  snapchat: SnapAd[];
  google: GoogleAssets;
  /** the https address of the sales page, Google's final URL (filled in by the seller) */
  finalUrl: string;
  createdAt: string;
}

/** The button to pick in each ads manager for the concept's call to action, under the platform's own (English) name. */
const PLATFORM_CTA: Record<'tiktok' | 'snapchat', Record<AdCta, string>> = {
  tiktok: { SHOP_NOW: 'Shop now', ORDER_NOW: 'Order now', BUY_NOW: 'Shop now', LEARN_MORE: 'Learn more', GET_OFFER: 'Shop now', SIGN_UP: 'Sign up', CONTACT_US: 'Contact us' },
  snapchat: { SHOP_NOW: 'Shop Now', ORDER_NOW: 'Order Now', BUY_NOW: 'Shop Now', LEARN_MORE: 'More', GET_OFFER: 'Shop Now', SIGN_UP: 'Sign Up', CONTACT_US: 'More' },
};

export const platformCta = (platform: 'tiktok' | 'snapchat', cta: AdCta): string => PLATFORM_CTA[platform][cta] ?? PLATFORM_CTA[platform].SHOP_NOW;

/** YouTube's call to action: 10 characters at most, in the language of the ad. */
const YOUTUBE_CTA: Record<AdCta, Record<ProjectLanguage, string>> = {
  SHOP_NOW: { ar: 'تسوّق الآن', fr: 'Acheter', en: 'Shop now' },
  ORDER_NOW: { ar: 'اطلب الآن', fr: 'Commander', en: 'Order now' },
  BUY_NOW: { ar: 'اشترِ الآن', fr: 'Acheter', en: 'Buy now' },
  LEARN_MORE: { ar: 'اكتشف', fr: 'Découvrir', en: 'Learn more' },
  GET_OFFER: { ar: 'اطلب العرض', fr: 'Profiter', en: 'Get offer' },
  SIGN_UP: { ar: 'سجّل الآن', fr: "S'inscrire", en: 'Sign up' },
  CONTACT_US: { ar: 'تواصل معنا', fr: 'Contacter', en: 'Contact us' },
};

export const youtubeCta = (cta: AdCta, language: ProjectLanguage): string => YOUTUBE_CTA[cta]?.[language] ?? YOUTUBE_CTA.SHOP_NOW[language];

// ---- Text -------------------------------------------------------------------------------------------------

/** Length as the platforms count it: one per character, an emoji included (JavaScript's length counts it twice). */
export const charCount = (text: string): number => [...text].length;

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu;
const squash = (value: unknown): string => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '');
/** One line of text without emoji. */
const plain = (value: unknown): string => squash(squash(value).replace(EMOJI, ''));

/** Cuts `text` to `max` characters at a word boundary, without a trailing comma, dash or full stop. */
export function fitToLimit(text: string, max: number): string {
  const chars = [...text];
  if (chars.length <= max) return text;
  const cut = chars.slice(0, max).join('');
  const space = cut.lastIndexOf(' ');
  const kept = space >= cut.length * 0.5 ? cut.slice(0, space) : cut;
  return kept.replace(/[\s,;:.\-–—،؛]+$/u, '').trim();
}

/** A TikTok caption: non-Spark ads show no hashtags, @ or links; no emoji either. */
export function tiktokText(value: unknown): string {
  const text = squash(value).replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/[#@]/g, '');
  return fitToLimit(plain(text), PACK_LIMITS.tiktokText);
}

export const snapHeadline = (value: unknown): string => fitToLimit(plain(value), PACK_LIMITS.snapHeadline);

/** Google refuses emoji, and "!" in a headline. Not cut: a headline that is too long is dropped instead. */
export const googleHeadline = (value: unknown): string => plain(squash(value).replace(/!+/g, ''));

/** A Google description: no emoji, one "!" at most. */
export function googleDescription(value: unknown): string {
  let seen = false;
  const text = plain(value).replace(/!+/g, () => (seen ? '' : ((seen = true), '!')));
  return fitToLimit(squash(text), PACK_LIMITS.googleDescription);
}

/** A display path ("example.com/path1/path2"): words joined by dashes, letters and digits only, 15 characters. */
export function googlePath(value: unknown): string {
  const text = plain(value).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
  return [...text].slice(0, PACK_LIMITS.googlePath).join('').replace(/-+$/, '');
}

// ---- Prompt -----------------------------------------------------------------------------------------------

export function buildPlatformCopyPrompt(brief: BriefFields, brand: BrandFields | null, concepts: AdConcept[]): string {
  const list = concepts.map((c, i) => `${i + 1}. Angle : ${c.angle || '-'} | Accroche : ${c.hook || '-'} | Titre : ${c.headline} | Texte : ${c.primaryText}`).join('\n');
  return `
# RÔLE
Tu es media buyer senior TikTok, Snapchat et Google Ads, spécialiste de l'e-commerce en paiement à la livraison en Algérie.

# PRODUIT ET CAMPAGNE
${line('Produit', brief.productName || brief.name)}${line('Description', brief.description)}${line('Prix', brief.price)}${line('Public cible', brief.audience || brand?.audience)}${line('Objectif', OBJECTIVE[brief.objective])}${line('Ton', brief.tone || brand?.tone)}${line('Marque', brand?.brandName)}${line('Consignes de la marque', brand?.instructions)}
# CONCEPTS DÉJÀ ÉCRITS POUR META
${list}

# MISSION
Adapte ces concepts aux règles de chaque plateforme. Rédige tous les textes en ${COPY_LANGUAGE[brief.language]}.

# RÈGLES
- tiktok : un texte par concept, ${PACK_LIMITS.tiktokText} caractères maximum espaces compris ; il commence par l'accroche ; sans hashtag, sans @, sans lien, sans emoji.
- snapchat : un titre par concept, ${PACK_LIMITS.snapHeadline} caractères maximum espaces compris.
- google.headlines : 12 à 15 titres de ${PACK_LIMITS.googleHeadline} caractères maximum chacun, tous différents (nom du produit, bénéfices, offre, paiement à la livraison, appel à l'action) ; jamais de point d'exclamation ; pas de mots entiers en majuscules.
- google.descriptions : 4 descriptions de ${PACK_LIMITS.googleDescription} caractères maximum.
- google.longHeadline : un titre long de ${PACK_LIMITS.googleLongHeadline} caractères maximum.
- google.path1 et google.path2 : un ou deux mots de ${PACK_LIMITS.googlePath} caractères maximum, sans espace (mots reliés par un tiret).
- google.youtubeHeadline : ${PACK_LIMITS.youtubeHeadline} caractères maximum.
- Aucun emoji dans les textes TikTok et Google.
- Copie honnête : pas de faux avis, pas de chiffres, de délais, de stock ni de résultats inventés, pas de promesse de santé ; seulement les faits du produit et des concepts.
- Mentionne le paiement à la livraison quand l'objectif est la vente.

# FORMAT : JSON UNIQUEMENT
{
  "tiktok": [{ "concept": 1, "adText": "..." }],
  "snapchat": [{ "concept": 1, "headline": "..." }],
  "google": { "headlines": ["..."], "descriptions": ["..."], "longHeadline": "...", "path1": "...", "path2": "...", "youtubeHeadline": "..." }
}
`.trim();
}

// ---- Answer -----------------------------------------------------------------------------------------------

/** What the model wrote for concept `index`: the item carrying its number, else the item at its position. */
function forConcept(items: unknown, index: number, field: string): unknown {
  const list = Array.isArray(items) ? items : [];
  const numbered = list.find((item) => item && typeof item === 'object' && Number((item as Record<string, unknown>).concept) === index + 1);
  const item = numbered ?? list[index];
  if (typeof item === 'string') return item;
  return item && typeof item === 'object' ? (item as Record<string, unknown>)[field] : undefined;
}

/** The first sentence of a text (its hook). */
const firstSentence = (text: string) => text.split(/(?<=[.!?؟])\s/u)[0] ?? text;

/** Without blanks and repeats (compared without case). */
function distinct(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLocaleLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const fits = (max: number) => (text: string) => charCount(text) <= max;
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * Cleans the model's answer into the three packs. Whatever the model left out or got wrong is rebuilt from the
 * concepts themselves, so a usable pack always comes out; every text is within its platform's limit.
 */
export function normalizePlatformCopy(
  raw: unknown,
  concepts: AdConcept[],
  names: { brandName: string; productName: string },
  now: Date = new Date(),
): PlatformCopy {
  if (!concepts.length) throw new Error(''); // the interface shows its own translated message
  const root = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const g = root.google && typeof root.google === 'object' ? (root.google as Record<string, unknown>) : {};

  const tiktok = concepts.map((c, i) => ({
    conceptId: c.id,
    adText: tiktokText(forConcept(root.tiktok, i, 'adText')) || tiktokText(firstSentence(c.primaryText)) || tiktokText(c.hook),
  }));
  const snapchat = concepts.map((c, i) => ({
    conceptId: c.id,
    headline: snapHeadline(forConcept(root.snapchat, i, 'headline')) || snapHeadline(c.headline),
  }));

  let headlines = distinct(asList(g.headlines).map(googleHeadline)).filter(fits(PACK_LIMITS.googleHeadline));
  if (headlines.length < GOOGLE_COUNTS.headlines.min) {
    const fromConcepts = [names.productName, ...concepts.map((c) => c.headline), ...concepts.map((c) => c.overlay)]
      .map((text) => fitToLimit(googleHeadline(text), PACK_LIMITS.googleHeadline));
    headlines = distinct([...headlines, ...fromConcepts]);
  }
  let descriptions = distinct(asList(g.descriptions).map(googleDescription));
  if (descriptions.length < GOOGLE_COUNTS.descriptions.min) {
    descriptions = distinct([...descriptions, ...concepts.map((c) => googleDescription(c.primaryText))]);
  }
  headlines = headlines.slice(0, GOOGLE_COUNTS.headlines.max);
  descriptions = descriptions.slice(0, GOOGLE_COUNTS.descriptions.max);

  return {
    conceptIds: concepts.map((c) => c.id),
    brandName: fitToLimit(plain(names.brandName) || plain(names.productName), PACK_LIMITS.brandName),
    tiktok,
    snapchat,
    google: {
      headlines,
      descriptions,
      longHeadline: fitToLimit(googleHeadline(g.longHeadline) || googleHeadline(concepts[0].headline), PACK_LIMITS.googleLongHeadline),
      path1: googlePath(g.path1) || googlePath(names.productName),
      path2: googlePath(g.path2),
      youtubeHeadline: fitToLimit(googleHeadline(g.youtubeHeadline) || headlines[0] || '', PACK_LIMITS.youtubeHeadline),
    },
    finalUrl: '',
    createdAt: now.toISOString(),
  };
}

// ---- Ready to export? -------------------------------------------------------------------------------------

/**
 * Why a pack cannot be exported yet: a text too long or empty, too few Google texts, "!" in a Google headline, a
 * character the platform refuses, two identical Google texts, a malformed display path, or no sales page.
 */
export type PackIssue = 'tooLong' | 'empty' | 'tooFew' | 'exclaim' | 'symbols' | 'duplicate' | 'path' | 'url';

const HAS_EMOJI = /[\p{Extended_Pictographic}]/u;
/** what a non-Spark TikTok caption cannot show */
const TIKTOK_REFUSED = /[#@]|https?:\/\/|www\./i;
const PATH_TEXT = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

const repeats = (texts: string[]) => new Set(texts.map((t) => t.trim().toLocaleLowerCase())).size < texts.length;

/** True for an absolute https address with a real host (Google's final URL). */
export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function textIssue(texts: string[], max: number): PackIssue | null {
  if (texts.some((t) => !t.trim())) return 'empty';
  if (texts.some((t) => charCount(t) > max)) return 'tooLong';
  return null;
}

/** The first reason the platform's pack cannot be exported, or null when it is ready. */
export function packIssue(copy: PlatformCopy, platform: PackPlatform): PackIssue | null {
  const brand = textIssue([copy.brandName], PACK_LIMITS.brandName);
  if (brand) return brand;
  if (platform === 'tiktok') {
    const texts = copy.tiktok.map((a) => a.adText);
    return textIssue(texts, PACK_LIMITS.tiktokText) ?? (texts.some((t) => TIKTOK_REFUSED.test(t) || HAS_EMOJI.test(t)) ? 'symbols' : null);
  }
  if (platform === 'snapchat') return textIssue(copy.snapchat.map((a) => a.headline), PACK_LIMITS.snapHeadline);
  const g = copy.google;
  if (g.headlines.length < GOOGLE_COUNTS.headlines.min || g.descriptions.length < GOOGLE_COUNTS.descriptions.min) return 'tooFew';
  return (
    textIssue(g.headlines, PACK_LIMITS.googleHeadline)
    ?? textIssue(g.descriptions, PACK_LIMITS.googleDescription)
    ?? textIssue([g.longHeadline], PACK_LIMITS.googleLongHeadline)
    ?? textIssue([g.youtubeHeadline], PACK_LIMITS.youtubeHeadline)
    ?? ([g.path1, g.path2].some((p) => charCount(p) > PACK_LIMITS.googlePath) ? 'tooLong' : null)
    ?? ([...g.headlines, g.longHeadline, g.youtubeHeadline].some((h) => h.includes('!')) ? 'exclaim' : null)
    ?? ([...g.headlines, ...g.descriptions, g.longHeadline, g.youtubeHeadline, copy.brandName].some((t) => HAS_EMOJI.test(t) || /[\r\n]/.test(t)) ? 'symbols' : null)
    ?? (repeats(g.headlines) || repeats(g.descriptions) ? 'duplicate' : null)
    // paths are optional, but the second needs the first, and each is words joined by dashes
    ?? ((g.path2 && !g.path1) || [g.path1, g.path2].some((p) => p && !PATH_TEXT.test(p)) ? 'path' : null)
    ?? (isHttpsUrl(copy.finalUrl) ? null : 'url')
  );
}

/**
 * The saved copy when it still matches the ad pack (every concept it was written from is still there), else null:
 * a new set of concepts makes the old packs stale.
 */
export function currentCopy(copy: PlatformCopy | undefined | null, concepts: AdConcept[]): PlatformCopy | null {
  if (!copy || !Array.isArray(copy.conceptIds) || !copy.conceptIds.length) return null;
  const ids = new Set(concepts.map((c) => c.id));
  return copy.conceptIds.every((id) => ids.has(id)) ? copy : null;
}
