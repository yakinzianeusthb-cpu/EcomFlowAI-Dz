import { resetFrenchIndex } from './translate';
import type { TranslationDictionary } from './types';

/**
 * Every dictionary registered so far, merged. The shared texts (menus, dashboard, auth...) are registered when the
 * app starts; each tool's own texts register when the tool's code is loaded, so they are never downloaded for
 * visitors who do not open that tool. A key must live in exactly one module (a test enforces it).
 */
export const translations: TranslationDictionary = {};
export const translationSources: Record<string, TranslationDictionary> = {};

export function registerTranslations(name: string, dictionary: TranslationDictionary): void {
  translationSources[name] = dictionary;
  Object.assign(translations, dictionary);
  resetFrenchIndex(translations);
}
