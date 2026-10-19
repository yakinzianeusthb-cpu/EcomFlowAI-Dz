import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// Text for the public pages around the product: the 404 page, the legal pages and the browser tab titles.
// (The legal documents themselves are long-form text and live in src/legal/content.ts.)
export const pageTranslations: TranslationDictionary = {
  // ── 404 ──
  notFoundTitle: {
    fr: 'Page introuvable',
    ar: 'الصفحة غير موجودة',
    en: 'Page not found',
  },
  notFoundBody: {
    fr: "La page que tu cherches n'existe pas ou a été déplacée.",
    ar: 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.',
    en: 'The page you are looking for does not exist or has been moved.',
  },

  // ── Legal pages ──
  legalTermsTitle: {
    fr: "Conditions d'utilisation",
    ar: 'شروط الاستخدام',
    en: 'Terms of Service',
  },
  legalPrivacyTitle: {
    fr: 'Politique de confidentialité',
    ar: 'سياسة الخصوصية',
    en: 'Privacy Policy',
  },
  legalTermsLink: {
    fr: "conditions d'utilisation",
    ar: 'شروط الاستخدام',
    en: 'Terms of Service',
  },
  legalPrivacyLink: {
    fr: 'politique de confidentialité',
    ar: 'سياسة الخصوصية',
    en: 'Privacy Policy',
  },
  legalUpdated: {
    fr: 'Dernière mise à jour : {date}',
    ar: 'آخر تحديث: {date}',
    en: 'Last updated: {date}',
  },
  legalContactTitle: {
    fr: 'Nous contacter',
    ar: 'اتصل بنا',
    en: 'Contact us',
  },
  legalContactBody: {
    fr: 'Pour toute question sur ce document, ou pour exercer tes droits sur tes données, écris-nous à {email}.',
    ar: 'لأي سؤال حول هذه الوثيقة، أو لممارسة حقوقك المتعلقة ببياناتك، راسلنا على {email}.',
    en: 'For any question about this document, or to exercise your rights over your data, write to us at {email}.',
  },
  legalContactFallback: {
    fr: 'Pour toute question sur ce document, utilise la page Contact de ton espace.',
    ar: 'لأي سؤال حول هذه الوثيقة، استخدم صفحة «اتصل بنا» في حسابك.',
    en: 'For any question about this document, use the Contact page in your account.',
  },
  legalFooterNav: {
    fr: 'Informations légales',
    ar: 'معلومات قانونية',
    en: 'Legal information',
  },

  // ── Browser tab titles and the search-engine description ──
  metaTitleHome: {
    fr: "EcomFlow AI — Marketing e-commerce propulsé par l'IA",
    ar: 'EcomFlow AI — التسويق الإلكتروني بالذكاء الاصطناعي',
    en: 'EcomFlow AI — AI-powered e-commerce marketing',
  },
  metaDescHome: {
    fr: 'Transforme une photo produit en landing pages, publicités et vidéos marketing en quelques minutes. Conçu pour les vendeurs COD en Algérie.',
    ar: 'حوّل صورة منتجك إلى صفحات هبوط وإعلانات وفيديوهات تسويقية في دقائق. مصمَّم لتجّار الدفع عند الاستلام في الجزائر.',
    en: 'Turn a product photo into landing pages, ad creatives and marketing videos in minutes. Built for cash-on-delivery sellers in Algeria.',
  },
  metaTitleLogin: {
    fr: 'Connexion — EcomFlow AI',
    ar: 'تسجيل الدخول — EcomFlow AI',
    en: 'Sign in — EcomFlow AI',
  },
  metaTitleRegister: {
    fr: 'Créer un compte — EcomFlow AI',
    ar: 'إنشاء حساب — EcomFlow AI',
    en: 'Create an account — EcomFlow AI',
  },
  metaTitleVerify: {
    fr: 'Vérifier ton email — EcomFlow AI',
    ar: 'تأكيد بريدك الإلكتروني — EcomFlow AI',
    en: 'Verify your email — EcomFlow AI',
  },
  metaTitleForgot: {
    fr: 'Mot de passe oublié — EcomFlow AI',
    ar: 'نسيت كلمة المرور — EcomFlow AI',
    en: 'Forgot password — EcomFlow AI',
  },
  metaTitleNotFound: {
    fr: 'Page introuvable — EcomFlow AI',
    ar: 'الصفحة غير موجودة — EcomFlow AI',
    en: 'Page not found — EcomFlow AI',
  },
};

registerTranslations('pages', pageTranslations);
