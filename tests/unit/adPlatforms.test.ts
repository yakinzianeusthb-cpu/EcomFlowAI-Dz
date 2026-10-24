import { describe, expect, it } from 'vitest';
import type { AdConcept } from '../../src/lib/adPack';
import {
  GOOGLE_COUNTS, PACK_LIMITS, buildPlatformCopyPrompt, charCount, currentCopy, fitToLimit, googleDescription, googleHeadline,
  googlePath, isHttpsUrl, normalizePlatformCopy, packIssue, platformCta, snapHeadline, tiktokText, youtubeCta, type PlatformCopy,
} from '../../src/lib/adPlatforms';
import type { BriefFields } from '../../src/lib/campaignContext';

const concept = (n: number, extra: Partial<AdConcept> = {}): AdConcept => ({
  id: `c${n}`,
  angle: `Angle ${n}`,
  hook: `Accroche ${n}`,
  primaryText: `Accroche ${n}. Le hachoir qui coupe tout en 10 secondes, paiement à la livraison partout en Algérie.`,
  headline: `Hachoir Pro ${n}`,
  description: 'Livraison 58 wilayas',
  callToAction: 'ORDER_NOW',
  overlay: `Coupe en 10 s ${n}`,
  audience: 'Cuisine',
  ...extra,
});
const CONCEPTS = [concept(1), concept(2), concept(3)];
const NAMES = { brandName: 'Cuisine DZ', productName: 'Hachoir Pro 3000' };
const BRIEF: BriefFields = {
  name: 'Campagne hachoir', productName: 'Hachoir Pro 3000', description: 'Hachoir électrique 3 lames', audience: 'Mères de famille',
  objective: 'sales', tone: 'Chaleureux', platforms: ['tiktok'], language: 'ar', price: '3900 DA',
};

const readyCopy = (patch: Partial<PlatformCopy> = {}): PlatformCopy => ({
  ...normalizePlatformCopy({}, CONCEPTS, NAMES, new Date('2026-10-24T10:00:00Z')),
  finalUrl: 'https://boutique.example.dz/hachoir',
  ...patch,
});

describe('limits', () => {
  it('match what the platforms publish', () => {
    expect(PACK_LIMITS).toMatchObject({ tiktokText: 100, snapHeadline: 34, googleHeadline: 30, googleDescription: 90, googleLongHeadline: 90, googlePath: 15, youtubeHeadline: 40, youtubeCta: 10 });
    // one name for the three platforms: TikTok's display name (20) is the smallest of the three
    expect(PACK_LIMITS.brandName).toBe(20);
    expect(GOOGLE_COUNTS).toEqual({ headlines: { min: 3, max: 15 }, descriptions: { min: 2, max: 4 } });
  });
});

describe('charCount', () => {
  it('counts characters, not UTF-16 units: an emoji is one', () => {
    expect(charCount('abc')).toBe(3);
    expect(charCount('🔥')).toBe(1);
    expect(charCount('اطلب الآن')).toBe(9);
  });
});

describe('fitToLimit', () => {
  it('leaves a text that fits alone', () => {
    expect(fitToLimit('Court', 10)).toBe('Court');
  });

  it('cuts at a word boundary, without a dangling comma or full stop', () => {
    expect(fitToLimit('Le hachoir qui coupe, vite et bien', 22)).toBe('Le hachoir qui coupe');
    expect(fitToLimit('Une phrase. Une autre phrase ici', 13)).toBe('Une phrase');
  });

  it('cuts mid-word only when there is no space in the second half', () => {
    expect(fitToLimit('Supercalifragilistique', 10)).toBe('Supercalif');
  });

  it('cuts Arabic at a word boundary too', () => {
    const out = fitToLimit('اطلب الآن والدفع عند الاستلام في كل الولايات', 20);
    expect(charCount(out)).toBeLessThanOrEqual(20);
    expect(out.endsWith(' ')).toBe(false);
    expect('اطلب الآن والدفع عند الاستلام في كل الولايات'.startsWith(out)).toBe(true);
  });
});

describe('platform text cleaners', () => {
  it('TikTok: no hashtags, @, links or emoji, 100 characters at most', () => {
    expect(tiktokText('🔥 Promo #hachoir chez @boutique https://x.dz/p www.x.dz top')).toBe('Promo hachoir chez boutique top');
    expect(charCount(tiktokText('mot '.repeat(60)))).toBeLessThanOrEqual(100);
  });

  it('Snapchat: 34 characters at most', () => {
    expect(charCount(snapHeadline('Un titre bien trop long pour tenir sur Snapchat sans couper'))).toBeLessThanOrEqual(34);
  });

  it('Google headline: drops "!" and emoji, but never cuts (a long one is dropped later)', () => {
    expect(googleHeadline('Promo du jour !!! 🔥')).toBe('Promo du jour');
    expect(googleHeadline('x'.repeat(40))).toHaveLength(40);
  });

  it('Google description: one "!" at most, 90 characters at most', () => {
    expect(googleDescription('Génial ! Livraison ! Vite !')).toBe('Génial ! Livraison Vite');
    expect(charCount(googleDescription('mot '.repeat(40)))).toBeLessThanOrEqual(90);
  });

  it('Google display path: dashes for spaces, letters and digits only, 15 characters', () => {
    expect(googlePath('Hachoir électrique / promo!')).toBe('Hachoir-électri');
    expect(googlePath('  livraison gratuite ')).toBe('livraison-gratu');
    expect(googlePath('مطبخ عصري')).toBe('مطبخ-عصري');
    expect(googlePath('')).toBe('');
  });
});

describe('buttons', () => {
  it('names the button each ads manager offers for the concept’s call to action', () => {
    expect(platformCta('tiktok', 'ORDER_NOW')).toBe('Order now');
    expect(platformCta('tiktok', 'BUY_NOW')).toBe('Shop now');
    expect(platformCta('snapchat', 'SHOP_NOW')).toBe('Shop Now');
  });

  it('keeps every YouTube call to action within 10 characters, in every language', () => {
    for (const cta of ['SHOP_NOW', 'ORDER_NOW', 'BUY_NOW', 'LEARN_MORE', 'GET_OFFER', 'SIGN_UP', 'CONTACT_US'] as const) {
      for (const language of ['ar', 'fr', 'en'] as const) {
        expect(charCount(youtubeCta(cta, language)), `${cta} ${language}`).toBeLessThanOrEqual(PACK_LIMITS.youtubeCta);
      }
    }
  });
});

describe('buildPlatformCopyPrompt', () => {
  const prompt = buildPlatformCopyPrompt(BRIEF, null, CONCEPTS);

  it('lists the concepts and the product', () => {
    expect(prompt).toContain('1. Angle : Angle 1');
    expect(prompt).toContain('3. Angle : Angle 3');
    expect(prompt).toContain('Hachoir Pro 3000');
  });

  it('states every platform limit, the language of the copy and the honesty rules', () => {
    for (const n of [100, 34, 30, 90, 15, 40]) expect(prompt).toContain(`${n} caractères`);
    expect(prompt).toContain('Darija');
    expect(prompt).toContain('paiement à la livraison');
    expect(prompt).toMatch(/pas de faux avis/);
    expect(prompt).toContain('"youtubeHeadline"');
  });
});

describe('normalizePlatformCopy', () => {
  it('matches each text to its concept by number, even out of order', () => {
    const copy = normalizePlatformCopy({ tiktok: [{ concept: 2, adText: 'Deux' }, { concept: 1, adText: 'Un' }] }, CONCEPTS, NAMES);
    expect(copy.tiktok.map((a) => a.adText).slice(0, 2)).toEqual(['Un', 'Deux']);
    expect(copy.conceptIds).toEqual(['c1', 'c2', 'c3']);
  });

  it('falls back to the position, then to the concept itself, when the model gives no number or no text', () => {
    const copy = normalizePlatformCopy({ snapchat: ['Premier titre'] }, CONCEPTS, NAMES);
    expect(copy.snapchat[0].headline).toBe('Premier titre');
    expect(copy.snapchat[1].headline).toBe('Hachoir Pro 2');
    expect(copy.tiktok[2].adText).toBe('Accroche 3.');
  });

  it('keeps every text within its limit, whatever the model wrote', () => {
    const long = 'mot '.repeat(80);
    const copy = normalizePlatformCopy({
      tiktok: CONCEPTS.map((_, i) => ({ concept: i + 1, adText: long })),
      snapchat: CONCEPTS.map((_, i) => ({ concept: i + 1, headline: long })),
      google: { headlines: [long, 'Hachoir Pro', 'Livraison 58 wilayas', 'Paiement à la livraison'], descriptions: [long, long], longHeadline: long, path1: long, path2: long, youtubeHeadline: long },
    }, CONCEPTS, NAMES);
    expect(copy.tiktok.every((a) => charCount(a.adText) <= 100)).toBe(true);
    expect(copy.snapchat.every((a) => charCount(a.headline) <= 34)).toBe(true);
    expect(copy.google.headlines.every((h) => charCount(h) <= 30)).toBe(true);
    expect(copy.google.headlines).not.toContain(long.trim()); // too long: dropped, not cut
    expect(copy.google.descriptions.every((d) => charCount(d) <= 90)).toBe(true);
    expect(charCount(copy.google.longHeadline)).toBeLessThanOrEqual(90);
    expect(charCount(copy.google.path1)).toBeLessThanOrEqual(15);
    expect(charCount(copy.google.youtubeHeadline)).toBeLessThanOrEqual(40);
  });

  it('removes repeated Google headlines and keeps 15 at most', () => {
    const headlines = ['Hachoir Pro', 'hachoir pro', ...Array.from({ length: 20 }, (_, i) => `Titre ${i}`)];
    const copy = normalizePlatformCopy({ google: { headlines } }, CONCEPTS, NAMES);
    expect(copy.google.headlines).toHaveLength(15);
    expect(copy.google.headlines.filter((h) => h.toLowerCase() === 'hachoir pro')).toHaveLength(1);
  });

  it('always gives Google its minimum: 3 headlines and 2 descriptions, built from the concepts if needed', () => {
    const copy = normalizePlatformCopy({ google: { headlines: ['Seul titre'], descriptions: [] } }, CONCEPTS, NAMES);
    expect(copy.google.headlines.length).toBeGreaterThanOrEqual(3);
    expect(copy.google.descriptions.length).toBeGreaterThanOrEqual(2);
  });

  it('survives an answer that is not an object at all', () => {
    for (const raw of [null, 'texte', 42, [1, 2]]) {
      const copy = normalizePlatformCopy(raw, CONCEPTS, NAMES);
      expect(copy.tiktok).toHaveLength(3);
      expect(packIssue({ ...copy, finalUrl: 'https://x.dz' }, 'google')).toBeNull();
    }
  });

  it('uses the brand name, or the product name, within 20 characters', () => {
    expect(normalizePlatformCopy({}, CONCEPTS, NAMES).brandName).toBe('Cuisine DZ');
    expect(normalizePlatformCopy({}, CONCEPTS, { brandName: '', productName: 'Hachoir Pro 3000 édition spéciale' }).brandName).toBe('Hachoir Pro 3000');
  });

  it('starts with no sales page address: the seller types it', () => {
    expect(normalizePlatformCopy({}, CONCEPTS, NAMES).finalUrl).toBe('');
  });

  it('refuses to work without concepts', () => {
    expect(() => normalizePlatformCopy({}, [], NAMES)).toThrow();
  });
});

describe('packIssue', () => {
  it('finds nothing to fix in a fresh pack once the sales page is set', () => {
    for (const platform of ['tiktok', 'snapchat', 'google'] as const) expect(packIssue(readyCopy(), platform), platform).toBeNull();
  });

  it('asks for the sales page before the Google pack, but not before TikTok or Snapchat', () => {
    const copy = readyCopy({ finalUrl: '' });
    expect(packIssue(copy, 'google')).toBe('url');
    expect(packIssue(copy, 'tiktok')).toBeNull();
    expect(packIssue(readyCopy({ finalUrl: 'http://boutique.dz' }), 'google')).toBe('url');
  });

  it('flags a text past its limit and an empty one', () => {
    const copy = readyCopy();
    expect(packIssue({ ...copy, tiktok: [{ ...copy.tiktok[0], adText: 'x'.repeat(101) }] }, 'tiktok')).toBe('tooLong');
    expect(packIssue({ ...copy, snapchat: [{ ...copy.snapchat[0], headline: ' ' }] }, 'snapchat')).toBe('empty');
    expect(packIssue({ ...copy, brandName: 'x'.repeat(21) }, 'snapchat')).toBe('tooLong');
    expect(packIssue({ ...copy, google: { ...copy.google, path2: 'x'.repeat(16) } }, 'google')).toBe('tooLong');
  });

  it('refuses what a hand edit can bring back: TikTok hashtags, @, links and emoji', () => {
    const copy = readyCopy();
    for (const adText of ['Promo #hachoir', 'Chez @boutique', 'Voir https://x.dz', 'Voir www.x.dz', 'Top 🔥']) {
      expect(packIssue({ ...copy, tiktok: [{ ...copy.tiktok[0], adText }] }, 'tiktok'), adText).toBe('symbols');
    }
  });

  it('refuses emoji and line breaks in Google texts, and repeated headlines or descriptions', () => {
    const copy = readyCopy();
    const g = copy.google;
    expect(packIssue({ ...copy, google: { ...g, headlines: ['Top 🔥', ...g.headlines.slice(1)] } }, 'google')).toBe('symbols');
    expect(packIssue({ ...copy, google: { ...g, descriptions: ['Ligne une\nligne deux', ...g.descriptions.slice(1)] } }, 'google')).toBe('symbols');
    expect(packIssue({ ...copy, google: { ...g, headlines: [g.headlines[0], g.headlines[0].toUpperCase(), ...g.headlines.slice(1)] } }, 'google')).toBe('duplicate');
    expect(packIssue({ ...copy, google: { ...g, descriptions: ['Pareil.', 'pareil.'] } }, 'google')).toBe('duplicate');
  });

  it('checks the display paths: words joined by dashes, and the first one before the second', () => {
    const copy = readyCopy();
    const g = copy.google;
    expect(packIssue({ ...copy, google: { ...g, path1: 'a/b' } }, 'google')).toBe('path');
    expect(packIssue({ ...copy, google: { ...g, path1: 'mot--mot' } }, 'google')).toBe('path');
    expect(packIssue({ ...copy, google: { ...g, path1: '', path2: 'promo' } }, 'google')).toBe('path');
    expect(packIssue({ ...copy, google: { ...g, path1: '', path2: '' } }, 'google')).toBeNull();
    expect(packIssue({ ...copy, google: { ...g, path1: 'مطبخ-عصري', path2: 'promo-2' } }, 'google')).toBeNull();
  });

  it('asks for Google’s minimum count, and refuses "!" in a Google headline', () => {
    const copy = readyCopy();
    expect(packIssue({ ...copy, google: { ...copy.google, headlines: copy.google.headlines.slice(0, 2) } }, 'google')).toBe('tooFew');
    expect(packIssue({ ...copy, google: { ...copy.google, headlines: ['Promo !', ...copy.google.headlines.slice(1)] } }, 'google')).toBe('exclaim');
  });
});

describe('isHttpsUrl', () => {
  it('accepts a full https address only', () => {
    expect(isHttpsUrl('https://boutique.example.dz/p')).toBe(true);
    expect(isHttpsUrl(' https://x.dz ')).toBe(true);
    expect(isHttpsUrl('http://x.dz')).toBe(false);
    expect(isHttpsUrl('https://localhost')).toBe(false);
    expect(isHttpsUrl('boutique.dz')).toBe(false);
    expect(isHttpsUrl('')).toBe(false);
  });
});

describe('currentCopy', () => {
  it('keeps the packs while their concepts are still in the ad pack, and drops them once they are not', () => {
    const copy = readyCopy();
    expect(currentCopy(copy, CONCEPTS)).toBe(copy);
    expect(currentCopy(copy, [concept(1), concept(2), concept(3), concept(4)])).toBe(copy);
    expect(currentCopy(copy, [concept(1), concept(2)])).toBeNull();
    expect(currentCopy(undefined, CONCEPTS)).toBeNull();
  });
});
