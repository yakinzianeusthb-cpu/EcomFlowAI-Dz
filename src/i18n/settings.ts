import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// settings: interface text, generated from the components and then maintained by hand.
export const settingsTranslations: TranslationDictionary = {
  stgParametresEnregistresAvecSucce: {
    fr: "Paramètres enregistrés avec succès !",
    ar: "تم حفظ الإعدادات بنجاح!",
    en: "Settings saved successfully!",
  },
  stgErreurLorsSauvegarde: {
    fr: "Erreur lors de la sauvegarde",
    ar: "حدث خطأ أثناء الحفظ",
    en: "Error while saving",
  },
  stgConnecte: {
    fr: "Connecté",
    ar: "متصل",
    en: "Connected",
  },
  stgInformationsGenerales: {
    fr: "Informations Générales",
    ar: "معلومات عامة",
    en: "General information",
  },
  stgPersonnalisezEspaceTravail: {
    fr: "Personnalisez votre espace de travail",
    ar: "خصّص مساحة عملك",
    en: "Customise your workspace",
  },
  stgNomWorkspace: {
    fr: "Nom du Workspace",
    ar: "اسم مساحة العمل",
    en: "Workspace name",
  },
  stgExMonAgenceE: {
    fr: "Ex : Mon agence e-commerce...",
    ar: "مثال: وكالتي للتجارة الإلكترونية...",
    en: "Ex: My E-com Agency...",
  },
  stgCleApiGenerationContenu: {
    fr: "Clé API pour la génération de contenu et analyses stratégiques",
    ar: "مفتاح API لإنشاء المحتوى والتحليلات الاستراتيجية",
    en: "API key for content generation and strategic analysis",
  },
  stgCleApiGeminiV1: {
    fr: "Clé API Gemini",
    ar: "مفتاح Gemini API",
    en: "Gemini API key",
  },
  stgConfigureLaisserVideConserver: {
    fr: "•••••••• (configuré — laisser vide pour conserver)",
    ar: "•••••••• (تم الإعداد — اتركه فارغاً للإبقاء عليه)",
    en: "•••••••• (configured — leave empty to keep it)",
  },
  stgIntroduisezCleApiAi: {
    fr: "Introduisez votre clé API AI Studio...",
    ar: "أدخل مفتاح API الخاص بك من AI Studio...",
    en: "Enter your AI Studio API key...",
  },
  stgCetteCleAlimenteToute: {
    fr: "Cette clé alimente toute la génération IA (images, vidéos, copy, analyses…). Elle est chiffrée et ne quitte jamais le serveur.",
    ar: "هذا المفتاح يشغّل كل ميزات الذكاء الاصطناعي (الصور والفيديوهات والنصوص والتحليلات…). وهو مشفّر ولا يغادر الخادم أبداً.",
    en: "This key powers all AI generation (images, videos, copy, analysis…). It is encrypted and never leaves the server.",
  },
  stgSauvegarderParametres: {
    fr: "Sauvegarder les Paramètres",
    ar: "حفظ الإعدادات",
    en: "Save settings",
  },
};

registerTranslations('settings', settingsTranslations);
