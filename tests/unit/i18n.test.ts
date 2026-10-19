import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { translations, translationSources } from '../../src/i18n/all';
import { translateFrench, translateKey } from '../../src/i18n/translate';
import { setRuntimeLanguage, translate } from '../../src/i18n/runtime';
import type { TranslationDictionary } from '../../src/i18n/types';

const dict: TranslationDictionary = {
  hello: { fr: 'Bonjour', ar: 'مرحبا', en: 'Hello' },
  greet: { fr: 'Salut {name}, {count} messages', ar: 'أهلا {name}، {count} رسائل', en: 'Hi {name}, {count} messages' },
  twice: { fr: '{x} et {x}', ar: '{x} و {x}', en: '{x} and {x}' },
  blankEn: { fr: 'Texte', ar: 'نص', en: '' },
};

describe('translateKey', () => {
  it('returns the text in the requested language', () => {
    expect(translateKey(dict, 'hello', undefined, 'fr')).toBe('Bonjour');
    expect(translateKey(dict, 'hello', undefined, 'ar')).toBe('مرحبا');
    expect(translateKey(dict, 'hello', undefined, 'en')).toBe('Hello');
  });

  it('uses the fallback when the key is unknown or the language value is empty', () => {
    expect(translateKey(dict, 'missing', 'Repli', 'en')).toBe('Repli');
    expect(translateKey(dict, 'blankEn', 'Texte', 'en')).toBe('Texte');
  });

  it('returns the key itself when there is no fallback either', () => {
    expect(translateKey(dict, 'missing', undefined, 'fr')).toBe('missing');
  });

  it('fills {placeholders}', () => {
    expect(translateKey(dict, 'greet', undefined, 'en', { name: 'Sara', count: 3 })).toBe('Hi Sara, 3 messages');
    expect(translateKey(dict, 'greet', undefined, 'ar', { name: 'سارة', count: 0 })).toBe('أهلا سارة، 0 رسائل');
  });

  it('fills a placeholder every time it appears and leaves unknown ones visible', () => {
    expect(translateKey(dict, 'twice', undefined, 'en', { x: 'A' })).toBe('A and A');
    expect(translateKey(dict, 'greet', undefined, 'fr', { name: 'Sara' })).toBe('Salut Sara, {count} messages');
  });

  it('fills placeholders in the fallback too, and is not fooled by $ in values', () => {
    expect(translateKey(dict, 'missing', 'Total : {n} DA', 'fr', { n: '$& 100' })).toBe('Total : $& 100 DA');
  });
});

describe('translateFrench (display text for values that stay French in the code)', () => {
  const fr: TranslationDictionary = {
    familyKey: { fr: 'Familles et foyers', ar: 'العائلات والمنازل', en: 'Families and homes' },
    withVar: { fr: 'Durée : {n} secondes', ar: 'المدة: {n} ثانية', en: 'Duration: {n} seconds' },
  };

  it('returns the translation for a known French text', () => {
    expect(translateFrench(fr, 'Familles et foyers', 'ar')).toBe('العائلات والمنازل');
    expect(translateFrench(fr, 'Familles et foyers', 'en')).toBe('Families and homes');
    expect(translateFrench(fr, 'Familles et foyers', 'fr')).toBe('Familles et foyers');
  });

  it('ignores surrounding whitespace when matching', () => {
    expect(translateFrench(fr, '  Familles et foyers ', 'en')).toBe('Families and homes');
  });

  it('shows the original text when nothing matches, so data the app does not know still displays', () => {
    expect(translateFrench(fr, 'Texte inconnu', 'ar')).toBe('Texte inconnu');
    expect(translateFrench(fr, '', 'en')).toBe('');
  });

  it('fills placeholders', () => {
    expect(translateFrench(fr, 'Durée : {n} secondes', 'en', { n: 30 })).toBe('Duration: 30 seconds');
  });
});

describe('runtime translate (for code outside React)', () => {
  it('follows the language that was set', () => {
    setRuntimeLanguage('ar');
    expect(translate('planBannerExpired')).toBe(translations.planBannerExpired.ar);
    setRuntimeLanguage('en');
    expect(translate('planBannerExpired')).toBe(translations.planBannerExpired.en);
    setRuntimeLanguage('fr');
    expect(translate('planBannerExpired')).toBe(translations.planBannerExpired.fr);
  });

  it('falls back like t() does', () => {
    setRuntimeLanguage('en');
    expect(translate('no_such_key', 'Fallback {a}', { a: 1 })).toBe('Fallback 1');
  });
});

describe('the dictionary', () => {
  const entries = Object.entries(translations);
  const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

  // French texts that really do read the same in English: names, URLs and loanwords such as "Landing pages" or "Script".
  // Listed by text rather than by key so the same word in two tools needs one entry. Anything else that is identical
  // is almost certainly a translation that was forgotten, so it fails the test.
  const SAME_IN_ENGLISH_TEXT = new Set([
    'Version v2.4.0', 'Contact & support', 'Ahmed Benali', 'Email', 'Code', 'Landing pages', 'Landing Pages', 'Landing', '{count} sections', 'Studios', 'Versions', 'Impressions', 'Audience', 'Accent', 'Format', 'Vertical 9:16', 'Concept {n}', 'Tech', 'Logo', 'Logos', 'Landing page', 'Questions',
    'stock OK', 'Scripts & storyboards', 'Profit & ROAS', 'Image', 'Script', 'sections', 'Sections', 'Section', 'Palette',
    'Mobile', 'app.ecomflow.ai/dashboard', '{count}/5 images', 'Lifestyle', 'Studio', 'Portrait', 'Story', 'Vintage',
    'Advertorial', 'Attention', 'Configuration', 'Message', 'Admin',
    'Mobile (9:16)', 'Retina (4K)', 'TikTok / Instagram',
    'APIs', 'Contacts', 'Plan', 'Plan:', 'Actions', 'Note:', 'Workspace:', 'Email:', 'Telegram (username)', 'Code (unique, slug)',
    'Emoji', 'Type', 'Description', 'Badge', 'Active', 'API — {name}',
    'PROMPT', 'DARIJA', 'BRIEFING', 'Performance', 'Benchmarks', 'Menu',
  ]);
  const SAME_IN_ARABIC = new Set(['lpMockUrl']);

  it('has all three languages filled for every entry', () => {
    const empty = entries.filter(([, v]) => !v.fr?.trim() || !v.ar?.trim() || !v.en?.trim()).map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it('never leaves Arabic as a copy of the French text', () => {
    const copies = entries.filter(([k, v]) => v.ar.trim() === v.fr.trim() && !SAME_IN_ARABIC.has(k)).map(([k]) => k);
    expect(copies).toEqual([]);
  });

  it('never leaves the English as a copy of the French text, apart from the known same-word entries', () => {
    const copies = entries.filter(([, v]) => v.en.trim() === v.fr.trim() && !SAME_IN_ENGLISH_TEXT.has(v.fr.trim())).map(([k]) => k);
    expect(copies).toEqual([]);
  });

  // The same French sentence translated two different ways by older entries. translateFrench uses the first one,
  // so these still work; new entries must reuse the existing translation instead of adding a variant.
  const KNOWN_WORDING_VARIANTS = new Set([
    'Studio Photos Produit', 'Produits Gagnants', 'Créer un compte', 'Envoi du code…', 'Réinitialiser le mot de passe',
    'Constructeur de LP', 'Scout Telegram', 'Aucune génération récente', 'Supprimer', 'Se connecter',
    'campagne marketing complète.', 'Code invalide ou expiré.',
  ]);

  it('gives the same French text the same translation everywhere, so translateFrench is unambiguous', () => {
    const seen = new Map<string, { key: string; ar: string; en: string }>();
    const conflicts: string[] = [];
    for (const [key, v] of entries) {
      const fr = v.fr.trim();
      const prior = seen.get(fr);
      if (!prior) seen.set(fr, { key, ar: v.ar, en: v.en });
      else if ((prior.ar !== v.ar || prior.en !== v.en) && !KNOWN_WORDING_VARIANTS.has(fr)) conflicts.push(`"${fr}" (${prior.key} / ${key})`);
    }
    expect(conflicts).toEqual([]);
  });

  it('keeps every key in one module only', () => {
    const owner = new Map<string, string>();
    const duplicates: string[] = [];
    for (const [moduleName, dictionary] of Object.entries(translationSources)) {
      for (const key of Object.keys(dictionary)) {
        if (owner.has(key)) duplicates.push(`${key} (${owner.get(key)} and ${moduleName})`);
        else owner.set(key, moduleName);
      }
    }
    expect(duplicates).toEqual([]);
  });

  it('keeps the same {placeholders} in every language', () => {
    const mismatched = entries.filter(([, v]) => placeholders(v.fr) !== placeholders(v.ar) || placeholders(v.fr) !== placeholders(v.en)).map(([k]) => k);
    expect(mismatched).toEqual([]);
  });
});

describe('translation keys used in the code', () => {
  const root = path.resolve(__dirname, '../../src');
  const files: string[] = [];
  (function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !p.includes(`${path.sep}i18n${path.sep}`)) files.push(p);
    }
  })(root);

  it('all exist in the dictionary', () => {
    const CALL = /(?<![\w.])(?:t|translate)\(\s*(['"`])([A-Za-z][A-Za-z0-9_]*)\1/g;
    const missing: string[] = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(CALL)) {
        if (!translations[m[2]]) missing.push(`${m[2]}  (${path.relative(root, file).split(path.sep).join('/')})`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });
});
