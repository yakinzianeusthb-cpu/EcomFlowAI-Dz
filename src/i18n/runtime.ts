/**
 * Translation for code that runs outside a React component (services, helpers, error messages).
 * Inside components, use `t` from useLanguage() instead. The language provider keeps this in sync.
 */
import { translations } from './index';
import { translateFrench, translateKey } from './translate';
import type { Language, TranslationVars } from './types';

let current: Language = 'ar';

export function setRuntimeLanguage(language: Language): void {
  current = language;
}

export function getRuntimeLanguage(): Language {
  return current;
}

export function translate(key: string, fallback?: string, vars?: TranslationVars): string {
  return translateKey(translations, key, fallback, current, vars);
}

/** Display text for a value that stays French in the code (see translateFrench). */
export function translateFr(text: string, vars?: TranslationVars): string {
  return translateFrench(translations, text, current, vars);
}
