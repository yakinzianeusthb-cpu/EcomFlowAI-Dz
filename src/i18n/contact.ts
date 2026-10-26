import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// contact: interface text, generated from the components and then maintained by hand.
export const contactTranslations: TranslationDictionary = {
  ctcWhatsappHello: {
    fr: "Bonjour, j'ai une question concernant EcomFlow AI.",
    ar: "مرحباً، لدي سؤال بخصوص EcomFlow AI.",
    en: "Hello, I have a question about EcomFlow AI.",
  },
  ctcDemandeGenerale: {
    fr: "Demande générale",
    ar: "استفسار عام",
    en: "General enquiry",
  },
  ctcFacturationPaiement: {
    fr: "Facturation / Paiement",
    ar: "الفوترة / الدفع",
    en: "Billing / Payment",
  },
  ctcProblemeTechnique: {
    fr: "Problème technique",
    ar: "مشكلة تقنية",
    en: "Technical issue",
  },
  ctcAutre: {
    fr: "Autre",
    ar: "أخرى",
    en: "Other",
  },
  ctcVeuillezRemplirTousChamps: {
    fr: "Veuillez remplir tous les champs.",
    ar: "يرجى ملء جميع الحقول.",
    en: "Please fill in all fields.",
  },
  ctcLeMessageDoitContenir: {
    fr: "Le message doit contenir au moins 10 caractères.",
    ar: "يجب أن تحتوي الرسالة على 10 أحرف على الأقل.",
    en: "The message must contain at least 10 characters.",
  },
  ctcMessageEnvoyeNousTe: {
    fr: "Message envoyé ! Nous te répondrons rapidement.",
    ar: "تم إرسال الرسالة! سنردّ عليك قريباً.",
    en: "Message sent! We will get back to you shortly.",
  },
  ctcErreurLorsLEnvoi: {
    fr: "Erreur lors de l'envoi.",
    ar: "حدث خطأ أثناء الإرسال.",
    en: "Error while sending.",
  },
  ctcNousSommesTAider: {
    fr: "Nous sommes là pour t'aider. Écris-nous ou contacte-nous directement.",
    ar: "نحن هنا لمساعدتك. راسلنا أو تواصل معنا مباشرة.",
    en: "We are here to help. Write to us or contact us directly.",
  },
  ctcEnvoyerMessage: {
    fr: "Envoyer un message",
    ar: "إرسال رسالة",
    en: "Send a message",
  },
  ctcRemplisFormulaireCiDessous: {
    fr: "Remplis le formulaire ci-dessous et nous te répondrons par email.",
    ar: "املأ النموذج أدناه وسنردّ عليك عبر البريد الإلكتروني.",
    en: "Fill in the form below and we will reply by email.",
  },
  ctcTonNom: {
    fr: "Ton nom",
    ar: "اسمك",
    en: "Your name",
  },
  ctcSujet: {
    fr: "Sujet",
    ar: "الموضوع",
    en: "Subject",
  },
  ctcDecrisProblemeQuestion: {
    fr: "Décris ton problème ou ta question…",
    ar: "اشرح مشكلتك أو سؤالك…",
    en: "Describe your problem or question…",
  },
  ctcEnvoi: {
    fr: "Envoi…",
    ar: "جارٍ الإرسال…",
    en: "Sending…",
  },
  ctcEnvoye: {
    fr: "Envoyé !",
    ar: "تم الإرسال!",
    en: "Sent!",
  },
  ctcEnvoyerMessage2: {
    fr: "Envoyer le message",
    ar: "إرسال الرسالة",
    en: "Send message",
  },
};

registerTranslations('contact', contactTranslations);
