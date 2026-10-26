import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// shell: interface text, generated from the components and then maintained by hand.
export const shellTranslations: TranslationDictionary = {
  shlAdmin: {
    fr: "Admin",
    ar: "الإدارة",
    en: "Admin",
  },
  shlTrialWhatsapp: {
    fr: "Bonjour, je souhaite réclamer mon offre de 7 jours d'essai gratuit.",
    ar: "مرحباً، أودّ الاستفادة من عرض التجربة المجانية لمدة 7 أيام.",
    en: "Hello, I would like to claim my 7-day free trial offer.",
  },
};

registerTranslations('shell', shellTranslations);
