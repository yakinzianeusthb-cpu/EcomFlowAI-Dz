import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { preferencesApi } from '../services/api';
import { translations, type Language, type TranslationDictionary, type TranslationVars } from '../i18n';
import { translateFrench, translateKey } from '../i18n/translate';
import { setRuntimeLanguage } from '../i18n/runtime';
import { LANGUAGE_COOKIE } from '../i18n/languageCookie';

// The dictionary lives in src/i18n; these re-exports keep the existing imports working.
export type { Language, TranslationDictionary };
export { translations };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  cycleLanguage: () => void;
  /** Looks a key up. `vars` fills {placeholders}; `fallback` (French) is used if the key is missing. */
  t: (key: string, fallback?: string, vars?: TranslationVars) => string;
  /**
   * Display text for a value that stays French in the code, such as the label of an option whose value is also
   * stored and sent to the AI. Only the display is translated; unknown text is shown as it is.
   */
  tf: (text: string, vars?: TranslationVars) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dzads_language';
const LANG_ORDER: Language[] = ['fr', 'ar', 'en'];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as Language;
      if (saved && (saved === 'fr' || saved === 'ar' || saved === 'en')) {
        return saved;
      }
    }
    return 'ar';
  });

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';
  const isRTL = dir === 'rtl';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, language);
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
      // Lets the server answer in this language (login errors, validation messages...): see lib/localizeResponses.ts.
      document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [language, dir]);

  // Dual-write: persist the language to the server API (fire-and-forget).
  // Skipped on first render: writing on every page load costs a request (a 401 for guests)
  // and would overwrite the saved preference with this device's default.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    preferencesApi.update({ language }).catch(() => {});
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const cycleLanguage = useCallback(() => {
    setLanguageState(prev => {
      const currentIndex = LANG_ORDER.indexOf(prev);
      const nextIndex = (currentIndex + 1) % LANG_ORDER.length;
      return LANG_ORDER[nextIndex];
    });
  }, []);

  // Code outside React (services, helpers) reads the language from here. Setting the same value twice is harmless,
  // and doing it during render guarantees children never render with a stale language.
  setRuntimeLanguage(language);

  const t = (key: string, fallback?: string, vars?: TranslationVars): string =>
    translateKey(translations, key, fallback, language, vars);

  const tf = (text: string, vars?: TranslationVars): string => translateFrench(translations, text, language, vars);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, cycleLanguage, t, tf, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
