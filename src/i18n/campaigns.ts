import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// campaigns: the asset library and the image service settings (the name stays: other code loads this area by it).
export const campaignsTranslations: TranslationDictionary = {
  cmpUploadFailed: {
    fr: "Une photo n’a pas pu être envoyée.",
    ar: "تعذّر رفع إحدى الصور.",
    en: "A photo could not be uploaded.",
  },
  cmpDeleteFailed: {
    fr: "Suppression impossible. Réessaie.",
    ar: "تعذّر الحذف. أعد المحاولة.",
    en: "Could not delete. Try again.",
  },
  cmpUploadingOne: {
    fr: "Envoi de la photo…",
    ar: "جارٍ رفع الصورة…",
    en: "Uploading the photo…",
  },
  cmpRetry: {
    fr: "Réessayer",
    ar: "إعادة المحاولة",
    en: "Try again",
  },
  cmpPhotoFormats: {
    fr: "JPG, PNG ou WebP · glisse-les ici ou clique",
    ar: "JPG أو PNG أو WebP · اسحبها إلى هنا أو انقر",
    en: "JPG, PNG or WebP · drag them here or click",
  },
  cmpCancel: {
    fr: "Annuler",
    ar: "إلغاء",
    en: "Cancel",
  },
  libKindProduct: {
    fr: "Photo produit",
    ar: "صورة منتج",
    en: "Product photo",
  },
  libKindCreative: {
    fr: "Visuel pub",
    ar: "تصميم إعلاني",
    en: "Ad image",
  },
  libKindLogo: {
    fr: "Logo",
    ar: "الشعار",
    en: "Logo",
  },
  libKindAi: {
    fr: "Image IA",
    ar: "صورة ذكاء اصطناعي",
    en: "AI image",
  },
  libKindOther: {
    fr: "Autre",
    ar: "أخرى",
    en: "Other",
  },
  libSubtitle: {
    fr: "Toutes tes photos produit, tes visuels publicitaires et ton logo, au même endroit.",
    ar: "كل صور منتجاتك وتصاميمك الإعلانية وشعارك في مكان واحد.",
    en: "All your product photos, ad images and your logo in one place.",
  },
  libFilter: {
    fr: "Type de fichier",
    ar: "نوع الملف",
    en: "File type",
  },
  libAll: {
    fr: "Tout",
    ar: "الكل",
    en: "All",
  },
  libProducts: {
    fr: "Photos produit",
    ar: "صور المنتجات",
    en: "Product photos",
  },
  libCreatives: {
    fr: "Visuels pub",
    ar: "التصاميم الإعلانية",
    en: "Ad images",
  },
  libLogos: {
    fr: "Logos",
    ar: "الشعارات",
    en: "Logos",
  },
  libAiImages: {
    fr: "Images IA",
    ar: "صور الذكاء الاصطناعي",
    en: "AI images",
  },
  libSearch: {
    fr: "Rechercher un fichier",
    ar: "البحث عن ملف",
    en: "Search for a file",
  },
  libLoadFailed: {
    fr: "Impossible de charger tes fichiers.",
    ar: "تعذّر تحميل ملفاتك.",
    en: "Could not load your files.",
  },
  libNoMatch: {
    fr: "Aucun fichier ne correspond.",
    ar: "لا يوجد ملف مطابق.",
    en: "No file matches.",
  },
  libEmpty: {
    fr: "Ta bibliothèque est vide.",
    ar: "مكتبتك فارغة.",
    en: "Your library is empty.",
  },
  libEmptyText: {
    fr: "Les photos ajoutées à tes campagnes et les visuels enregistrés depuis l’onglet Publicités apparaissent ici.",
    ar: "تظهر هنا الصور المضافة إلى حملاتك والتصاميم المحفوظة من تبويب الإعلانات.",
    en: "Photos added to your campaigns and images saved from the Ads tab appear here.",
  },
  libDownload: {
    fr: "Télécharger {name}",
    ar: "تنزيل {name}",
    en: "Download {name}",
  },
  libDeleteName: {
    fr: "Supprimer {name}",
    ar: "حذف {name}",
    en: "Delete {name}",
  },
  libDeleteConfirm: {
    fr: "Supprimer",
    ar: "حذف",
    en: "Delete",
  },
  libMore: {
    fr: "Afficher plus",
    ar: "عرض المزيد",
    en: "Show more",
  },
  libUpload: {
    fr: "Ajouter des photos produit",
    ar: "إضافة صور منتجات",
    en: "Add product photos",
  },
  libStorage: {
    fr: "Stockage",
    ar: "التخزين",
    en: "Storage",
  },
  stgSubtitleNew: {
    fr: "Ton espace, ta clé d’IA et tes connexions publicitaires.",
    ar: "مساحتك ومفتاح الذكاء الاصطناعي وروابطك الإعلانية.",
    en: "Your workspace, your AI key and your ad connections.",
  },
  stgKeySaved: {
    fr: "Clé enregistrée",
    ar: "المفتاح محفوظ",
    en: "Key saved",
  },
  stgNoKey: {
    fr: "Aucune clé",
    ar: "لا يوجد مفتاح",
    en: "No key",
  },
  stgBillingNote: {
    fr: "Une clé gratuite suffit pour les textes, les landing pages, les scripts et les publicités. Les images et les clips vidéo IA demandent une clé avec facturation activée.",
    ar: "يكفي مفتاح مجاني للنصوص وصفحات الهبوط والسيناريوهات والإعلانات. أما الصور ومقاطع الفيديو بالذكاء الاصطناعي فتتطلب مفتاحاً مع تفعيل الفوترة.",
    en: "A free key is enough for copy, landing pages, scripts and ads. AI images and AI video clips need a key with billing turned on.",
  },
  stgGetKey: {
    fr: "Créer une clé dans Google AI Studio",
    ar: "إنشاء مفتاح في Google AI Studio",
    en: "Create a key in Google AI Studio",
  },
  // ---- TikTok, Snapchat and Google packs (Publish tab) ----
};

registerTranslations('campaigns', campaignsTranslations);
