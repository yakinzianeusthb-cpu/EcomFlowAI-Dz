import { describe, expect, it } from 'vitest';
import { LEGAL, LEGAL_VERSION_DATE, type LegalDocId } from '../../src/legal/content';
import type { Language } from '../../src/i18n/types';

const LANGS: Language[] = ['fr', 'ar', 'en'];
const DOCS: LegalDocId[] = ['terms', 'privacy'];

describe.each(DOCS)('legal document: %s', (id) => {
  it('exists in every language with an introduction and sections', () => {
    for (const lang of LANGS) {
      const doc = LEGAL[id][lang];
      expect(doc.intro.trim().length).toBeGreaterThan(20);
      expect(doc.sections.length).toBeGreaterThan(5);
    }
  });

  it('has the same structure in every language, so no section is missing from a translation', () => {
    const shape = (lang: Language) =>
      LEGAL[id][lang].sections.map((s) => `${s.paragraphs?.length ?? 0}p/${s.bullets?.length ?? 0}b`);
    expect(shape('ar')).toEqual(shape('fr'));
    expect(shape('en')).toEqual(shape('fr'));
  });

  it('gives every section a heading and some content', () => {
    for (const lang of LANGS) {
      for (const section of LEGAL[id][lang].sections) {
        expect(section.heading.trim()).not.toBe('');
        expect((section.paragraphs?.length ?? 0) + (section.bullets?.length ?? 0)).toBeGreaterThan(0);
      }
    }
  });

  it('is written in the right script', () => {
    const arabic = /[؀-ۿ]/;
    for (const section of LEGAL[id].ar.sections) expect(arabic.test(section.heading)).toBe(true);
    for (const section of LEGAL[id].fr.sections) expect(arabic.test(section.heading)).toBe(false);
    for (const section of LEGAL[id].en.sections) expect(arabic.test(section.heading)).toBe(false);
  });
});

describe('LEGAL_VERSION_DATE', () => {
  it('is a valid ISO date', () => {
    expect(LEGAL_VERSION_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(LEGAL_VERSION_DATE))).toBe(false);
  });
});
