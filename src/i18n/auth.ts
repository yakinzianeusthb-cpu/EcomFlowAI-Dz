import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// Sign-in, sign-up and password-reset text that was missing from the shared dictionary.
export const authTranslations: TranslationDictionary = {
  fpVerifyBtn: {
    fr: 'Vérifier le code',
    ar: 'تحقق من الرمز',
    en: 'Verify code',
  },
};

registerTranslations('auth', authTranslations);
