export type Language = 'fr' | 'ar' | 'en';

export interface TranslationEntry {
  fr: string;
  ar: string;
  en: string;
}

export interface TranslationDictionary {
  [key: string]: TranslationEntry;
}

/** Values for {placeholders} in a translation. */
export type TranslationVars = Record<string, string | number>;
