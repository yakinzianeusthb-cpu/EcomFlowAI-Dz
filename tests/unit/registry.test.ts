import { describe, expect, it } from 'vitest';
import { registerTranslations, translationSources, translations } from '../../src/i18n/registry';
import { translateFrench, translateKey } from '../../src/i18n/translate';

describe('registerTranslations', () => {
  it('makes the keys of a dictionary available as soon as it is registered', () => {
    expect(translateKey(translations, 'registryDemoHello', 'repli', 'en')).toBe('repli');

    registerTranslations('registry-demo-a', { registryDemoHello: { fr: 'Bonjour registre', ar: 'مرحبا السجل', en: 'Hello registry' } });

    expect(translateKey(translations, 'registryDemoHello', 'repli', 'en')).toBe('Hello registry');
    expect(translateKey(translations, 'registryDemoHello', 'repli', 'ar')).toBe('مرحبا السجل');
  });

  it('lets translateFrench see texts registered after an earlier lookup', () => {
    // the lookup index is built on first use: a later registration must not be hidden by a stale index
    expect(translateFrench(translations, 'Texte tardif du registre', 'en')).toBe('Texte tardif du registre');

    registerTranslations('registry-demo-b', { registryDemoLate: { fr: 'Texte tardif du registre', ar: 'نص متأخر', en: 'Late registry text' } });

    expect(translateFrench(translations, 'Texte tardif du registre', 'en')).toBe('Late registry text');
    expect(translateFrench(translations, 'Texte tardif du registre', 'ar')).toBe('نص متأخر');
  });

  it('keeps the first translation when two dictionaries share a French text', () => {
    registerTranslations('registry-demo-c', { registryDemoFirst: { fr: 'Mot partagé du registre', ar: 'الأول', en: 'First' } });
    registerTranslations('registry-demo-d', { registryDemoSecond: { fr: 'Mot partagé du registre', ar: 'الثاني', en: 'Second' } });

    expect(translateFrench(translations, 'Mot partagé du registre', 'en')).toBe('First');
  });

  it('records each dictionary under its name, and registering the same name again replaces it', () => {
    registerTranslations('registry-demo-e', { registryDemoE1: { fr: 'E1', ar: 'ه1', en: 'E1' } });
    expect(Object.keys(translationSources['registry-demo-e'])).toEqual(['registryDemoE1']);

    registerTranslations('registry-demo-e', { registryDemoE2: { fr: 'E2', ar: 'ه2', en: 'E2' } });
    expect(Object.keys(translationSources['registry-demo-e'])).toEqual(['registryDemoE2']);
  });
});
