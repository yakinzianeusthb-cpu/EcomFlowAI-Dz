import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// assembler: interface text, generated from the components and then maintained by hand.
export const assemblerTranslations: TranslationDictionary = {
  lpbPresetMobile: {
    fr: "Mobile (9:16)",
    ar: "جوال (9:16)",
    en: "Mobile (9:16)",
  },
  lpbPresetDesktop: {
    fr: "Ordinateur (HD)",
    ar: "حاسوب (HD)",
    en: "Desktop (HD)",
  },
  lpbPresetRetina: {
    fr: "Retina (4K)",
    ar: "ريتينا (4K)",
    en: "Retina (4K)",
  },
  lpbPresetSocial: {
    fr: "TikTok / Instagram",
    ar: "تيك توك / إنستغرام",
    en: "TikTok / Instagram",
  },
  lpbPresetWeb: {
    fr: "Web standard",
    ar: "ويب قياسي",
    en: "Standard Web",
  },
  lpbPresetHd: {
    fr: "Haute définition",
    ar: "دقة عالية",
    en: "High Definition",
  },
  lpbAssembling: {
    fr: "Assemblage…",
    ar: "جارٍ التجميع…",
    en: "Assembling…",
  },
  lpbAnalysing: {
    fr: "Analyse en cours…",
    ar: "جارٍ التحليل…",
    en: "Analysing…",
  },
  lpbSectionsFound: {
    fr: "Sections trouvées : {count}",
    ar: "الأقسام المكتشفة: {count}",
    en: "Sections found: {count}",
  },
  lpbFeaturesCount: {
    fr: "{count} caractéristiques",
    ar: "{count} ميزات",
    en: "{count} features",
  },
  lpbDragHandle: {
    fr: "Déplacer la section",
    ar: "تحريك القسم",
    en: "Move section",
  },
  lpbCloseLightbox: {
    fr: "Fermer l'aperçu",
    ar: "إغلاق المعاينة",
    en: "Close preview",
  },
  lpbImportezDAbordImages: {
    fr: "Importez d'abord des images",
    ar: "ارفع الصور أولاً",
    en: "Upload images first",
  },
  lpbAnalyseIaTermineeConsultez: {
    fr: "Analyse IA terminée ! Consultez les résultats ci-dessous.",
    ar: "اكتمل تحليل الذكاء الاصطناعي! اطّلع على النتائج أدناه.",
    en: "AI analysis complete! Check the insights below.",
  },
  lpbLAnalyseIaEchoue: {
    fr: "L'analyse IA a échoué",
    ar: "فشل تحليل الذكاء الاصطناعي",
    en: "AI analysis failed",
  },
  lpbLandingPageAssemblee: {
    fr: "Landing page assemblée !",
    ar: "تم تجميع صفحة الهبوط!",
    en: "Landing page assembled!",
  },
  lpbLAssemblageEchoue: {
    fr: "L'assemblage a échoué",
    ar: "فشل التجميع",
    en: "Assembly failed",
  },
  lpbTelechargementLance: {
    fr: "Téléchargement lancé !",
    ar: "بدأ التنزيل!",
    en: "Download started!",
  },
  lpbImportezSectionsReorganisezAss: {
    fr: "Importez les sections → Réorganisez → Assemblez → Téléchargez",
    ar: "ارفع الأقسام ← أعد ترتيبها ← جمّعها ← نزّل الصفحة",
    en: "Upload sections → Reorder → Assemble → Download",
  },
  lpbNomProjet: {
    fr: "Nom du projet...",
    ar: "اسم المشروع...",
    en: "Project name...",
  },
  lpbParametresDExport: {
    fr: "Paramètres d'export",
    ar: "إعدادات التصدير",
    en: "Export Settings",
  },
  lpbConfiguration: {
    fr: "Configuration",
    ar: "الإعدادات",
    en: "Configuration",
  },
  lpbLargeur: {
    fr: "Largeur",
    ar: "العرض",
    en: "Width",
  },
  lpbQualite: {
    fr: "Qualité",
    ar: "الجودة",
    en: "Quality",
  },
  lpbPngQualiteMax: {
    fr: "PNG qualité max",
    ar: "PNG بأعلى جودة",
    en: "PNG Max",
  },
  lpbJpegRapide: {
    fr: "JPEG rapide",
    ar: "JPEG سريع",
    en: "JPEG Fast",
  },
  lpbAssemblerLandingPage: {
    fr: "Assembler la landing page",
    ar: "تجميع صفحة الهبوط",
    en: "Build Landing Page",
  },
  lpbExtraitTexteStructureImages: {
    fr: "Extrait le texte et la structure des images",
    ar: "استخراج النص والبنية من الصور",
    en: "Extract text & structure from images",
  },
  lpbAnalyserAvecLIa: {
    fr: "Analyser avec l'IA",
    ar: "حلّل بالذكاء الاصطناعي",
    en: "Analyze with AI",
  },
  lpbPage: {
    fr: "Page :",
    ar: "الصفحة:",
    en: "Page:",
  },
  lpbAucuneSectionDetectee: {
    fr: "Aucune section détectée",
    ar: "لم يتم اكتشاف أي أقسام",
    en: "No sections detected",
  },
  lpbAssemblageIntelligent: {
    fr: "Assemblage intelligent",
    ar: "التجميع الذكي",
    en: "Smart Stitching",
  },
  lpbLesImagesSontRedimensionnees: {
    fr: "Les images sont redimensionnées à la largeur choisie, puis assemblées en une seule longue image de landing page à télécharger.",
    ar: "يتم تغيير حجم الصور إلى العرض المطلوب ثم دمجها في صورة واحدة طويلة لصفحة الهبوط جاهزة للتنزيل.",
    en: "Images are scaled to your target width and stitched into a single tall LP image for download.",
  },
  lpbLandingPagePrete: {
    fr: "Landing page prête !",
    ar: "صفحة الهبوط جاهزة!",
    en: "Landing Page Ready!",
  },
  lpbOrdinateur: {
    fr: "Ordinateur",
    ar: "حاسوب",
    en: "Desktop",
  },
  lpbPleinEcran: {
    fr: "Plein écran",
    ar: "ملء الشاشة",
    en: "Fullscreen",
  },
  lpbLandingPageAssemblee2: {
    fr: "Landing page assemblée",
    ar: "صفحة الهبوط المجمّعة",
    en: "Assembled LP",
  },
  lpbApercuComplet: {
    fr: "Aperçu complet",
    ar: "معاينة كاملة",
    en: "Full Preview",
  },
};

registerTranslations('assembler', assemblerTranslations);
