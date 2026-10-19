import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// campaigns: projects, ads studio, brand kit, asset library and Meta publishing.
export const campaignsTranslations: TranslationDictionary = {
  cmpGenerating: {
    fr: "En cours…",
    ar: "جارٍ الإنشاء…",
    en: "Generating…",
  },
  cmpFailed: {
    fr: "Échec",
    ar: "فشل",
    en: "Failed",
  },
  cmpNotYet: {
    fr: "Pas encore",
    ar: "ليس بعد",
    en: "Not yet",
  },
  cmpGenerateTitle: {
    fr: "Générer la campagne",
    ar: "إنشاء الحملة",
    en: "Generate the campaign",
  },
  cmpGenerateIntro: {
    fr: "Les trois contenus partent du même brief et de la même identité de marque. Chacun peut être relancé seul.",
    ar: "المحتويات الثلاثة تنطلق من نفس الملخص ونفس هوية العلامة. ويمكن إعادة إنشاء كل واحد منها على حدة.",
    en: "All three start from the same brief and the same brand identity. Each one can be generated again on its own.",
  },
  cmpOpen: {
    fr: "Ouvrir",
    ar: "فتح",
    en: "Open",
  },
  cmpGenerate: {
    fr: "Générer",
    ar: "إنشاء",
    en: "Generate",
  },
  cmpNeedsPlan: {
    fr: "La génération IA demande un abonnement actif.",
    ar: "يتطلب الإنشاء بالذكاء الاصطناعي اشتراكاً نشطاً.",
    en: "AI generation needs an active plan.",
  },
  cmpGenerateCost: {
    fr: "Utilise environ une requête de ta clé Gemini par contenu.",
    ar: "يستهلك تقريباً طلباً واحداً من مفتاح Gemini لكل محتوى.",
    en: "Uses about one request of your Gemini key per item.",
  },
  cmpGenerateMissing: {
    fr: "Générer ce qui manque",
    ar: "إنشاء ما ينقص",
    en: "Generate what is missing",
  },
  cmpGenerateAll: {
    fr: "Tout générer",
    ar: "إنشاء الكل",
    en: "Generate everything",
  },
  cmpRegenerateAll: {
    fr: "Tout régénérer",
    ar: "إعادة إنشاء الكل",
    en: "Regenerate everything",
  },
  cmpUploadFailed: {
    fr: "Une photo n’a pas pu être envoyée.",
    ar: "تعذّر رفع إحدى الصور.",
    en: "A photo could not be uploaded.",
  },
  cmpFromLibrary: {
    fr: "Réutiliser une photo de mes fichiers",
    ar: "استخدام صورة من ملفاتي",
    en: "Reuse a photo from my files",
  },
  cmpLibraryEmpty: {
    fr: "Aucune autre photo produit dans tes fichiers.",
    ar: "لا توجد صور منتجات أخرى في ملفاتك.",
    en: "No other product photos in your files.",
  },
  cmpUsePhoto: {
    fr: "Utiliser {name}",
    ar: "استخدام {name}",
    en: "Use {name}",
  },
  cmpSaveFailed: {
    fr: "Modification non enregistrée. Réessaie.",
    ar: "لم يُحفظ التعديل. أعد المحاولة.",
    en: "Change not saved. Try again.",
  },
  cmpPhotosTitle: {
    fr: "Photos du produit",
    ar: "صور المنتج",
    en: "Product photos",
  },
  cmpCover: {
    fr: "Couverture",
    ar: "الغلاف",
    en: "Cover",
  },
  cmpDeleteFailed: {
    fr: "Suppression impossible. Réessaie.",
    ar: "تعذّر الحذف. أعد المحاولة.",
    en: "Could not delete. Try again.",
  },
  cmpRemovePhoto: {
    fr: "Retirer la photo {n}",
    ar: "إزالة الصورة {n}",
    en: "Remove photo {n}",
  },
  cmpUploadingOne: {
    fr: "Envoi de la photo…",
    ar: "جارٍ رفع الصورة…",
    en: "Uploading the photo…",
  },
  cmpAdd: {
    fr: "Ajouter",
    ar: "إضافة",
    en: "Add",
  },
  cmpBriefTitle: {
    fr: "Le brief",
    ar: "الملخص",
    en: "The brief",
  },
  cmpSaving: {
    fr: "Enregistrement…",
    ar: "جارٍ الحفظ…",
    en: "Saving…",
  },
  cmpSaved: {
    fr: "Enregistré",
    ar: "تم الحفظ",
    en: "Saved",
  },
  cmpAutosave: {
    fr: "Enregistré automatiquement",
    ar: "يُحفظ تلقائياً",
    en: "Saved automatically",
  },
  cmpProductName: {
    fr: "Nom du produit",
    ar: "اسم المنتج",
    en: "Product name",
  },
  cmpPrice: {
    fr: "Prix de vente",
    ar: "سعر البيع",
    en: "Selling price",
  },
  cmpDescription: {
    fr: "Ce qui le rend unique",
    ar: "ما الذي يميّزه",
    en: "What makes it unique",
  },
  cmpDescriptionHint: {
    fr: "Avantages, matière, taille, garantie… une idée par ligne.",
    ar: "المزايا، المادة، الحجم، الضمان… فكرة في كل سطر.",
    en: "Benefits, material, size, warranty… one idea per line.",
  },
  cmpAudience: {
    fr: "Public cible",
    ar: "الجمهور المستهدف",
    en: "Target audience",
  },
  cmpTone: {
    fr: "Ton",
    ar: "النبرة",
    en: "Tone",
  },
  cmpObjective: {
    fr: "Objectif",
    ar: "الهدف",
    en: "Objective",
  },
  cmpPlatforms: {
    fr: "Plateformes",
    ar: "المنصات",
    en: "Platforms",
  },
  cmpCopyLanguage: {
    fr: "Langue des textes générés",
    ar: "لغة النصوص المُنشأة",
    en: "Language of the generated copy",
  },
  cmpVersions: {
    fr: "Versions",
    ar: "النسخ",
    en: "Versions",
  },
  cmpVersionFailed: {
    fr: "Cette version n’a pas pu être ouverte.",
    ar: "تعذّر فتح هذه النسخة.",
    en: "This version could not be opened.",
  },
  cmpGenFailed: {
    fr: "La génération a échoué. Réessaie dans un instant.",
    ar: "فشل الإنشاء. أعد المحاولة بعد قليل.",
    en: "Generation failed. Try again in a moment.",
  },
  cmpRetry: {
    fr: "Réessayer",
    ar: "إعادة المحاولة",
    en: "Try again",
  },
  cmpLandingTitle: {
    fr: "Ta landing page",
    ar: "صفحة الهبوط الخاصة بك",
    en: "Your landing page",
  },
  cmpLandingIntro: {
    fr: "L’IA écrit une page de vente complète à partir du brief et des photos : sections, arguments et bouton de commande. Tu pourras modifier les textes avant de la télécharger.",
    ar: "يكتب الذكاء الاصطناعي صفحة بيع كاملة انطلاقاً من الملخص والصور: أقسام وحجج وزر طلب. ويمكنك تعديل النصوص قبل تنزيلها.",
    en: "The AI writes a complete sales page from the brief and the photos: sections, selling points and an order button. You can edit the text before downloading it.",
  },
  cmpLandingRunning: {
    fr: "L’IA écrit ta page… cela prend environ une minute.",
    ar: "يكتب الذكاء الاصطناعي صفحتك… يستغرق ذلك نحو دقيقة.",
    en: "The AI is writing your page… it takes about a minute.",
  },
  cmpGenerateLanding: {
    fr: "Générer la landing page",
    ar: "إنشاء صفحة الهبوط",
    en: "Generate the landing page",
  },
  cmpVersionSaved: {
    fr: "Nouvelle version enregistrée.",
    ar: "تم حفظ نسخة جديدة.",
    en: "New version saved.",
  },
  cmpCloseEditor: {
    fr: "Fermer l’éditeur",
    ar: "إغلاق المحرّر",
    en: "Close the editor",
  },
  cmpEditTexts: {
    fr: "Modifier les textes",
    ar: "تعديل النصوص",
    en: "Edit the text",
  },
  cmpRegenerate: {
    fr: "Régénérer",
    ar: "إعادة الإنشاء",
    en: "Regenerate",
  },
  cmpAiFailed: {
    fr: "L’IA n’a pas pu analyser la photo. Remplis les champs à la main.",
    ar: "تعذّر على الذكاء الاصطناعي تحليل الصورة. املأ الحقول يدوياً.",
    en: "The AI could not read the photo. Fill in the fields by hand.",
  },
  cmpNeedProduct: {
    fr: "Indique au moins le nom du produit.",
    ar: "أدخل اسم المنتج على الأقل.",
    en: "Enter at least the product name.",
  },
  cmpCreateFailed: {
    fr: "La campagne n’a pas pu être créée. Réessaie.",
    ar: "تعذّر إنشاء الحملة. أعد المحاولة.",
    en: "The campaign could not be created. Try again.",
  },
  cmpNewSubtitle: {
    fr: "Commence par les photos du produit : l’IA peut remplir le reste à ta place.",
    ar: "ابدأ بصور المنتج: يمكن للذكاء الاصطناعي أن يملأ الباقي نيابة عنك.",
    en: "Start with the product photos: the AI can fill in the rest for you.",
  },
  cmpPhotosHint: {
    fr: "Jusqu’à 8 photos nettes, sur fond simple de préférence. La première sert de couverture.",
    ar: "حتى 8 صور واضحة، ويُفضّل أن تكون على خلفية بسيطة. الصورة الأولى تُستخدم غلافاً.",
    en: "Up to 8 sharp photos, ideally on a plain background. The first one is the cover.",
  },
  cmpAddPhotos: {
    fr: "Ajouter des photos",
    ar: "إضافة صور",
    en: "Add photos",
  },
  cmpPhotoFormats: {
    fr: "JPG, PNG ou WebP · glisse-les ici ou clique",
    ar: "JPG أو PNG أو WebP · اسحبها إلى هنا أو انقر",
    en: "JPG, PNG or WebP · drag them here or click",
  },
  cmpAnalysing: {
    fr: "Analyse de la photo…",
    ar: "جارٍ تحليل الصورة…",
    en: "Reading the photo…",
  },
  cmpFillWithAi: {
    fr: "Remplir le brief avec l’IA",
    ar: "ملء الملخص بالذكاء الاصطناعي",
    en: "Fill in the brief with AI",
  },
  cmpFillWithAiCost: {
    fr: "Utilise 1 requête de ta clé Gemini.",
    ar: "يستهلك طلباً واحداً من مفتاح Gemini.",
    en: "Uses 1 request of your Gemini key.",
  },
  cmpProductNamePh: {
    fr: "Ex. Lampe LED rechargeable",
    ar: "مثال: مصباح LED قابل للشحن",
    en: "E.g. rechargeable LED lamp",
  },
  cmpCampaignName: {
    fr: "Nom de la campagne",
    ar: "اسم الحملة",
    en: "Campaign name",
  },
  cmpCampaignNameHint: {
    fr: "Facultatif : le nom du produit par défaut.",
    ar: "اختياري: اسم المنتج افتراضياً.",
    en: "Optional: the product name by default.",
  },
  cmpMoreOptions: {
    fr: "Public, ton, plateformes et langue",
    ar: "الجمهور والنبرة والمنصات واللغة",
    en: "Audience, tone, platforms and language",
  },
  cmpAudiencePh: {
    fr: "Ex. mamans actives, 25-45 ans, grandes villes",
    ar: "مثال: أمهات عاملات، 25-45 سنة، المدن الكبرى",
    en: "E.g. working mothers, 25-45, big cities",
  },
  cmpTonePh: {
    fr: "Ex. chaleureux, premium, énergique",
    ar: "مثال: دافئ، فاخر، حيوي",
    en: "E.g. warm, premium, energetic",
  },
  cmpUploading: {
    fr: "Envoi des photos {done}/{total}…",
    ar: "رفع الصور {done}/{total}…",
    en: "Uploading photos {done}/{total}…",
  },
  cmpCreate: {
    fr: "Créer la campagne",
    ar: "إنشاء الحملة",
    en: "Create the campaign",
  },
  cmpArchived: {
    fr: "Archivée",
    ar: "مؤرشفة",
    en: "Archived",
  },
  cmpUpdated: {
    fr: "Modifiée {when}",
    ar: "عُدّلت {when}",
    en: "Updated {when}",
  },
  cmpListSubtitle: {
    fr: "Une campagne réunit un produit, ses photos et tout ce que l’IA crée pour le vendre : landing page, vidéo et publicités.",
    ar: "تجمع الحملة منتجاً وصوره وكل ما ينشئه الذكاء الاصطناعي لبيعه: صفحة الهبوط والفيديو والإعلانات.",
    en: "A campaign brings together a product, its photos and everything the AI creates to sell it: landing page, video and ads.",
  },
  cmpFilterLabel: {
    fr: "Afficher",
    ar: "إظهار",
    en: "Show",
  },
  cmpFilterActive: {
    fr: "En cours",
    ar: "الجارية",
    en: "Current",
  },
  cmpFilterArchived: {
    fr: "Archivées ({count})",
    ar: "المؤرشفة ({count})",
    en: "Archived ({count})",
  },
  cmpLoadFailed: {
    fr: "Impossible de charger tes campagnes.",
    ar: "تعذّر تحميل حملاتك.",
    en: "Could not load your campaigns.",
  },
  cmpCheckConnection: {
    fr: "Vérifie ta connexion puis réessaie.",
    ar: "تحقق من اتصالك ثم أعد المحاولة.",
    en: "Check your connection and try again.",
  },
  cmpNoArchived: {
    fr: "Aucune campagne archivée.",
    ar: "لا توجد حملات مؤرشفة.",
    en: "No archived campaigns.",
  },
  cmpEmptyTitle: {
    fr: "Lance ta première campagne",
    ar: "أطلق حملتك الأولى",
    en: "Start your first campaign",
  },
  cmpEmptyStep1: {
    fr: "Ajoute les photos de ton produit et quelques infos.",
    ar: "أضف صور منتجك وبعض المعلومات.",
    en: "Add your product photos and a few details.",
  },
  cmpEmptyStep2: {
    fr: "L’IA écrit la landing page, le script vidéo et les publicités.",
    ar: "يكتب الذكاء الاصطناعي صفحة الهبوط وسيناريو الفيديو والإعلانات.",
    en: "The AI writes the landing page, the video script and the ads.",
  },
  cmpEmptyStep3: {
    fr: "Tu relis, tu ajustes, tu télécharges ou tu publies.",
    ar: "تراجع وتعدّل ثم تنزّل أو تنشر.",
    en: "You review, adjust, then download or publish.",
  },
  cmpNotFound: {
    fr: "Cette campagne n’existe pas ou plus.",
    ar: "هذه الحملة غير موجودة أو لم تعد موجودة.",
    en: "This campaign does not exist, or no longer does.",
  },
  cmpBackToList: {
    fr: "Voir mes campagnes",
    ar: "عرض حملاتي",
    en: "See my campaigns",
  },
  cmpLoadOneFailed: {
    fr: "Impossible de charger cette campagne.",
    ar: "تعذّر تحميل هذه الحملة.",
    en: "Could not load this campaign.",
  },
  cmpTabBrief: {
    fr: "Brief et photos",
    ar: "الملخص والصور",
    en: "Brief and photos",
  },
  cmpTabPublish: {
    fr: "Publier",
    ar: "النشر",
    en: "Publish",
  },
  cmpSave: {
    fr: "Enregistrer",
    ar: "حفظ",
    en: "Save",
  },
  cmpRename: {
    fr: "Renommer la campagne",
    ar: "إعادة تسمية الحملة",
    en: "Rename the campaign",
  },
  cmpRestore: {
    fr: "Restaurer",
    ar: "استرجاع",
    en: "Restore",
  },
  cmpArchive: {
    fr: "Archiver",
    ar: "أرشفة",
    en: "Archive",
  },
  cmpDelete: {
    fr: "Supprimer",
    ar: "حذف",
    en: "Delete",
  },
  cmpConfirmDelete: {
    fr: "Supprimer la campagne et ses fichiers",
    ar: "حذف الحملة وملفاتها",
    en: "Delete the campaign and its files",
  },
  cmpCancel: {
    fr: "Annuler",
    ar: "إلغاء",
    en: "Cancel",
  },
  cmpSections: {
    fr: "Parties de la campagne",
    ar: "أجزاء الحملة",
    en: "Parts of the campaign",
  },
  metaStActive: {
    fr: "Active chez Meta",
    ar: "نشطة لدى Meta",
    en: "Active on Meta",
  },
  metaStReview: {
    fr: "En cours d’examen par Meta",
    ar: "قيد المراجعة لدى Meta",
    en: "Being reviewed by Meta",
  },
  metaStRejected: {
    fr: "Refusée ou bloquée par Meta",
    ar: "مرفوضة أو موقوفة من Meta",
    en: "Rejected or blocked by Meta",
  },
  metaStPaused: {
    fr: "En pause : rien n’est dépensé",
    ar: "متوقفة مؤقتاً: لا يُنفق شيء",
    en: "Paused: nothing is being spent",
  },
  metaStUnknown: {
    fr: "Statut inconnu",
    ar: "حالة غير معروفة",
    en: "Unknown status",
  },
  metaLiveFailed: {
    fr: "Impossible de lire le statut chez Meta.",
    ar: "تعذّرت قراءة الحالة لدى Meta.",
    en: "Could not read the status from Meta.",
  },
  metaActivated: {
    fr: "Campagne envoyée à Meta pour diffusion.",
    ar: "أُرسلت الحملة إلى Meta للبث.",
    en: "Campaign sent to Meta for delivery.",
  },
  metaPausedToast: {
    fr: "Campagne mise en pause.",
    ar: "تم إيقاف الحملة مؤقتاً.",
    en: "Campaign paused.",
  },
  metaImpressions: {
    fr: "Impressions",
    ar: "مرات الظهور",
    en: "Impressions",
  },
  metaReach: {
    fr: "Personnes touchées",
    ar: "الأشخاص الذين تم الوصول إليهم",
    en: "People reached",
  },
  metaClicks: {
    fr: "Clics",
    ar: "النقرات",
    en: "Clicks",
  },
  metaSpend: {
    fr: "Dépensé",
    ar: "المبلغ المُنفق",
    en: "Spent",
  },
  metaCtr: {
    fr: "Taux de clic",
    ar: "نسبة النقر",
    en: "Click-through rate",
  },
  metaCpc: {
    fr: "Coût par clic",
    ar: "التكلفة لكل نقرة",
    en: "Cost per click",
  },
  metaRefresh: {
    fr: "Actualiser le statut",
    ar: "تحديث الحالة",
    en: "Refresh the status",
  },
  metaDailyBudget: {
    fr: "Budget quotidien",
    ar: "الميزانية اليومية",
    en: "Daily budget",
  },
  metaStart: {
    fr: "Début",
    ar: "البداية",
    en: "Start",
  },
  metaEnd: {
    fr: "Fin",
    ar: "النهاية",
    en: "End",
  },
  metaNoEnd: {
    fr: "Pas de date de fin",
    ar: "بدون تاريخ نهاية",
    en: "No end date",
  },
  metaAudience: {
    fr: "Audience",
    ar: "الجمهور",
    en: "Audience",
  },
  metaLink: {
    fr: "Lien de destination",
    ar: "رابط الوجهة",
    en: "Destination link",
  },
  metaReviewFeedback: {
    fr: "Retour de Meta :",
    ar: "ملاحظات Meta:",
    en: "Feedback from Meta:",
  },
  metaRealResults: {
    fr: "Résultats réels, lus chez Meta",
    ar: "نتائج حقيقية مقروءة من Meta",
    en: "Real results, read from Meta",
  },
  metaOpenAdsManager: {
    fr: "Ouvrir dans le Gestionnaire de publicités",
    ar: "فتح في مدير الإعلانات",
    en: "Open in Ads Manager",
  },
  metaPause: {
    fr: "Mettre en pause",
    ar: "إيقاف مؤقت",
    en: "Pause",
  },
  metaActivate: {
    fr: "Activer la campagne",
    ar: "تفعيل الحملة",
    en: "Activate the campaign",
  },
  metaConfirmTitle: {
    fr: "Vérifie avant de lancer",
    ar: "تحقق قبل الإطلاق",
    en: "Check before going live",
  },
  metaConfirmText: {
    fr: "Meta va diffuser cette publicité et dépenser jusqu’à {budget} par jour à partir du {start}, après validation de la publicité par Meta.",
    ar: "ستبث Meta هذا الإعلان وتنفق حتى {budget} يومياً ابتداءً من {start}، بعد موافقة Meta على الإعلان.",
    en: "Meta will run this ad and spend up to {budget} per day from {start}, once Meta has approved the ad.",
  },
  metaConfirmCheck: {
    fr: "Je confirme les réglages et j’accepte que Meta facture ce budget sur mon compte publicitaire.",
    ar: "أؤكد الإعدادات وأوافق على أن تحتسب Meta هذه الميزانية على حسابي الإعلاني.",
    en: "I confirm these settings and accept that Meta bills this budget to my ad account.",
  },
  metaActivateNow: {
    fr: "Lancer la diffusion",
    ar: "بدء البث",
    en: "Start delivery",
  },
  metaCreateFailed: {
    fr: "La campagne n’a pas pu être créée chez Meta.",
    ar: "تعذّر إنشاء الحملة لدى Meta.",
    en: "The campaign could not be created on Meta.",
  },
  metaNoAccounts: {
    fr: "Aucun compte publicitaire accessible avec cette connexion.",
    ar: "لا يوجد حساب إعلاني متاح بهذا الربط.",
    en: "No ad account is available with this connection.",
  },
  metaNoPages: {
    fr: "Aucune Page Facebook accessible avec cette connexion.",
    ar: "لا توجد صفحة فيسبوك متاحة بهذا الربط.",
    en: "No Facebook Page is available with this connection.",
  },
  metaAccessHint: {
    fr: "Vérifie dans Meta Business que ton profil a accès au compte publicitaire et à la Page, puis reconnecte Meta en acceptant toutes les autorisations.",
    ar: "تحقق في Meta Business من أن ملفك الشخصي يملك صلاحية الوصول إلى الحساب الإعلاني والصفحة، ثم أعد ربط Meta مع قبول كل الأذونات.",
    en: "Check in Meta Business that your profile can access the ad account and the Page, then reconnect Meta and accept every permission.",
  },
  metaNewTitle: {
    fr: "Préparer la campagne Meta",
    ar: "تحضير حملة Meta",
    en: "Prepare the Meta campaign",
  },
  metaNewIntro: {
    fr: "La campagne est créée en pause : rien n’est diffusé ni dépensé avant que tu l’actives.",
    ar: "تُنشأ الحملة متوقفة مؤقتاً: لا يُبث شيء ولا يُنفق شيء قبل أن تفعّلها.",
    en: "The campaign is created paused: nothing runs and nothing is spent until you activate it.",
  },
  metaAdAccount: {
    fr: "Compte publicitaire",
    ar: "الحساب الإعلاني",
    en: "Ad account",
  },
  metaInactive: {
    fr: "inactif",
    ar: "غير نشط",
    en: "inactive",
  },
  metaPage: {
    fr: "Page Facebook",
    ar: "صفحة فيسبوك",
    en: "Facebook Page",
  },
  metaObjective: {
    fr: "Objectif chez Meta",
    ar: "الهدف على Meta",
    en: "Objective on Meta",
  },
  metaObjTraffic: {
    fr: "Visites de ta page",
    ar: "زيارات صفحتك",
    en: "Visits to your page",
  },
  metaObjSales: {
    fr: "Ventes (pixel)",
    ar: "المبيعات (بكسل)",
    en: "Sales (pixel)",
  },
  metaObjAwareness: {
    fr: "Notoriété",
    ar: "الوعي بالعلامة",
    en: "Awareness",
  },
  metaPixel: {
    fr: "Identifiant du pixel Meta",
    ar: "معرّف بكسل Meta",
    en: "Meta pixel ID",
  },
  metaPixelHint: {
    fr: "Ton pixel doit être installé sur ta page de vente et suivre l’événement Purchase.",
    ar: "يجب أن يكون البكسل مثبتاً على صفحة البيع ويتتبع حدث Purchase.",
    en: "Your pixel must be installed on your sales page and track the Purchase event.",
  },
  metaLinkHint: {
    fr: "L’adresse https publique de ta landing page (le fichier HTML téléchargé, mis en ligne chez ton hébergeur).",
    ar: "عنوان https العام لصفحة الهبوط (ملف HTML الذي نزّلته ورفعته على الاستضافة).",
    en: "The public https address of your landing page (the downloaded HTML file, put online with your host).",
  },
  metaDailyBudgetIn: {
    fr: "Budget par jour ({currency})",
    ar: "الميزانية اليومية ({currency})",
    en: "Budget per day ({currency})",
  },
  metaEndOptional: {
    fr: "Fin (facultatif)",
    ar: "النهاية (اختياري)",
    en: "End (optional)",
  },
  metaCountries: {
    fr: "Pays",
    ar: "الدول",
    en: "Countries",
  },
  metaCountriesHint: {
    fr: "Codes à 2 lettres séparés par des virgules.",
    ar: "رموز من حرفين مفصولة بفواصل.",
    en: "2-letter codes separated by commas.",
  },
  metaAgeMin: {
    fr: "Âge minimum",
    ar: "الحد الأدنى للعمر",
    en: "Minimum age",
  },
  metaAgeMax: {
    fr: "Âge maximum",
    ar: "الحد الأقصى للعمر",
    en: "Maximum age",
  },
  metaConcept: {
    fr: "Publicité à utiliser",
    ar: "الإعلان المراد استخدامه",
    en: "Ad to use",
  },
  cmpAdFormat: {
    fr: "Format des visuels",
    ar: "مقاس التصاميم",
    en: "Image size",
  },
  cmpCreativeAlt: {
    fr: "Visuel publicitaire : {headline}",
    ar: "تصميم إعلاني: {headline}",
    en: "Ad image: {headline}",
  },
  metaPausedNote: {
    fr: "Créée en pause. Tu pourras vérifier puis activer.",
    ar: "تُنشأ متوقفة مؤقتاً. يمكنك المراجعة ثم التفعيل.",
    en: "Created paused. You can review it, then activate it.",
  },
  metaCreatePaused: {
    fr: "Créer la campagne en pause",
    ar: "إنشاء الحملة متوقفة مؤقتاً",
    en: "Create the campaign paused",
  },
  metaStatusFailed: {
    fr: "Impossible de vérifier la connexion Meta.",
    ar: "تعذّر التحقق من ربط Meta.",
    en: "Could not check the Meta connection.",
  },
  metaNeedAds: {
    fr: "Génère d’abord tes publicités",
    ar: "أنشئ إعلاناتك أولاً",
    en: "Generate your ads first",
  },
  metaNeedAdsText: {
    fr: "La campagne Meta utilise un des concepts et un des visuels de l’onglet Publicités.",
    ar: "تستخدم حملة Meta أحد المفاهيم وأحد التصاميم من تبويب الإعلانات.",
    en: "The Meta campaign uses one of the concepts and images from the Ads tab.",
  },
  metaManualTitle: {
    fr: "Publier à la main en attendant",
    ar: "النشر يدوياً في الوقت الحالي",
    en: "Publish by hand in the meantime",
  },
  metaManual1: {
    fr: "Dans l’onglet Publicités, choisis tes concepts, télécharge les visuels et exporte les textes.",
    ar: "في تبويب الإعلانات، اختر مفاهيمك ونزّل التصاميم وصدّر النصوص.",
    en: "In the Ads tab, pick your concepts, download the images and export the copy.",
  },
  metaManual2: {
    fr: "Mets ta landing page en ligne (fichier HTML de l’onglet Landing page) et copie son adresse.",
    ar: "انشر صفحة الهبوط على الإنترنت (ملف HTML من تبويب صفحة الهبوط) وانسخ عنوانها.",
    en: "Put your landing page online (the HTML file from the Landing page tab) and copy its address.",
  },
  metaManual3: {
    fr: "Dans le Gestionnaire de publicités Meta, crée une campagne Trafic ou Ventes avec ces visuels, ces textes et ce lien.",
    ar: "في مدير إعلانات Meta، أنشئ حملة زيارات أو مبيعات بهذه التصاميم والنصوص وهذا الرابط.",
    en: "In Meta Ads Manager, create a Traffic or Sales campaign with these images, this copy and this link.",
  },
  cmpPageColors: {
    fr: "Couleurs de la page",
    ar: "ألوان الصفحة",
    en: "Page colours",
  },
  cmpColorMain: {
    fr: "Principale",
    ar: "الرئيسية",
    en: "Main",
  },
  cmpColorAccent: {
    fr: "Accent",
    ar: "التمييز",
    en: "Accent",
  },
  cmpColorBackground: {
    fr: "Fond",
    ar: "الخلفية",
    en: "Background",
  },
  cmpHeadline: {
    fr: "Grand titre",
    ar: "العنوان الرئيسي",
    en: "Main headline",
  },
  cmpSubheadline: {
    fr: "Sous-titre",
    ar: "العنوان الفرعي",
    en: "Subheadline",
  },
  cmpSectionTitle: {
    fr: "Titre de la section",
    ar: "عنوان القسم",
    en: "Section title",
  },
  cmpButtonText: {
    fr: "Texte du bouton",
    ar: "نص الزر",
    en: "Button text",
  },
  cmpSectionText: {
    fr: "Texte",
    ar: "النص",
    en: "Text",
  },
  cmpBenefits: {
    fr: "Avantages (un par ligne)",
    ar: "المزايا (واحدة في كل سطر)",
    en: "Benefits (one per line)",
  },
  cmpSaveVersion: {
    fr: "Enregistrer une nouvelle version",
    ar: "حفظ نسخة جديدة",
    en: "Save a new version",
  },
  cmpVideoStyle: {
    fr: "Style de vidéo",
    ar: "نمط الفيديو",
    en: "Video style",
  },
  cmpVideoFormat: {
    fr: "Format",
    ar: "المقاس",
    en: "Format",
  },
  cmpFormatVertical: {
    fr: "Vertical 9:16",
    ar: "عمودي 9:16",
    en: "Vertical 9:16",
  },
  cmpFormatSquare: {
    fr: "Carré 1:1",
    ar: "مربع 1:1",
    en: "Square 1:1",
  },
  cmpFormatWide: {
    fr: "Large 16:9",
    ar: "عريض 16:9",
    en: "Wide 16:9",
  },
  cmpVideoDuration: {
    fr: "Durée visée",
    ar: "المدة المستهدفة",
    en: "Target length",
  },
  cmpVideoTitle: {
    fr: "Ta vidéo publicitaire",
    ar: "فيديو إعلانك",
    en: "Your video ad",
  },
  cmpVideoIntro: {
    fr: "L’IA écrit le script scène par scène (accroche, démonstration, appel à l’action). Ensuite, l’app monte une vraie vidéo à partir de tes photos, sans quota IA.",
    ar: "يكتب الذكاء الاصطناعي السيناريو مشهداً بمشهد (جذب الانتباه، العرض، الدعوة إلى الإجراء). ثم يركّب التطبيق فيديو حقيقياً من صورك دون استهلاك حصة الذكاء الاصطناعي.",
    en: "The AI writes the script scene by scene (hook, demonstration, call to action). Then the app builds a real video from your photos, using no AI quota.",
  },
  cmpVideoRunning: {
    fr: "L’IA écrit le script… environ 30 secondes.",
    ar: "يكتب الذكاء الاصطناعي السيناريو… نحو 30 ثانية.",
    en: "The AI is writing the script… about 30 seconds.",
  },
  cmpGenerateVideo: {
    fr: "Écrire le script vidéo",
    ar: "كتابة سيناريو الفيديو",
    en: "Write the video script",
  },
  cmpRewriteScript: {
    fr: "Réécrire le script",
    ar: "إعادة كتابة السيناريو",
    en: "Rewrite the script",
  },
  cmpScript: {
    fr: "Le script",
    ar: "السيناريو",
    en: "The script",
  },
  cmpHook: {
    fr: "Accroche",
    ar: "عنصر الجذب",
    en: "Hook",
  },
  cmpScene: {
    fr: "Scène {n}",
    ar: "المشهد {n}",
    en: "Scene {n}",
  },
  cmpObjSales: {
    fr: "Ventes",
    ar: "المبيعات",
    en: "Sales",
  },
  cmpObjLeads: {
    fr: "Prospects",
    ar: "جمع العملاء المحتملين",
    en: "Leads",
  },
  cmpObjTraffic: {
    fr: "Visites",
    ar: "الزيارات",
    en: "Traffic",
  },
  cmpObjAwareness: {
    fr: "Notoriété",
    ar: "الوعي بالعلامة",
    en: "Awareness",
  },
  cmpPlatformWeb: {
    fr: "Site web",
    ar: "موقع إلكتروني",
    en: "Website",
  },
  cmpLangAr: {
    fr: "Arabe / darija",
    ar: "العربية / الدارجة",
    en: "Arabic / Darija",
  },
  cmpLangFr: {
    fr: "Français",
    ar: "الفرنسية",
    en: "French",
  },
  cmpLangEn: {
    fr: "Anglais",
    ar: "الإنجليزية",
    en: "English",
  },
  cmpOutVideo: {
    fr: "Vidéo",
    ar: "الفيديو",
    en: "Video",
  },
  cmpAdsTitle: {
    fr: "Tes publicités",
    ar: "إعلاناتك",
    en: "Your ads",
  },
  cmpAdsIntro: {
    fr: "L’IA propose 4 concepts publicitaires différents, avec textes prêts pour Facebook et Instagram. L’app les met en image avec tes photos et ta marque, aux formats carré, 4:5 et story.",
    ar: "يقترح الذكاء الاصطناعي 4 مفاهيم إعلانية مختلفة بنصوص جاهزة لفيسبوك وإنستغرام. ويحوّلها التطبيق إلى تصاميم بصورك وعلامتك، بمقاسات مربع و4:5 وستوري.",
    en: "The AI suggests 4 different ad concepts, with copy ready for Facebook and Instagram. The app turns them into images with your photos and brand, in square, 4:5 and story sizes.",
  },
  cmpAdsRunning: {
    fr: "L’IA écrit les concepts… environ 30 secondes.",
    ar: "يكتب الذكاء الاصطناعي المفاهيم… نحو 30 ثانية.",
    en: "The AI is writing the concepts… about 30 seconds.",
  },
  cmpGenerateAds: {
    fr: "Générer les publicités",
    ar: "إنشاء الإعلانات",
    en: "Generate the ads",
  },
  cmpSavedToLibrary: {
    fr: "{count} visuels enregistrés dans tes fichiers.",
    ar: "تم حفظ {count} تصاميم في ملفاتك.",
    en: "{count} images saved to your files.",
  },
  cmpLibraryFailed: {
    fr: "Les visuels n’ont pas pu être enregistrés.",
    ar: "تعذّر حفظ التصاميم.",
    en: "The images could not be saved.",
  },
  cmpAdSquare: {
    fr: "Carré 1:1",
    ar: "مربع 1:1",
    en: "Square 1:1",
  },
  cmpAdPortrait: {
    fr: "Feed 4:5",
    ar: "المنشورات 4:5",
    en: "4:5 feed",
  },
  cmpAdStory: {
    fr: "Story 9:16",
    ar: "ستوري 9:16",
    en: "9:16 story",
  },
  cmpNewConcepts: {
    fr: "Nouveaux concepts",
    ar: "مفاهيم جديدة",
    en: "New concepts",
  },
  cmpSelectedCount: {
    fr: "{count} sur {total} choisis",
    ar: "تم اختيار {count} من {total}",
    en: "{count} of {total} selected",
  },
  cmpExportCopy: {
    fr: "Exporter les textes (CSV)",
    ar: "تصدير النصوص (CSV)",
    en: "Export the copy (CSV)",
  },
  cmpSaveToLibrary: {
    fr: "Enregistrer dans mes fichiers",
    ar: "الحفظ في ملفاتي",
    en: "Save to my files",
  },
  cmpDownloadChosen: {
    fr: "Télécharger les visuels",
    ar: "تنزيل التصاميم",
    en: "Download the images",
  },
  cmpAiSuggestions: {
    fr: "Suggestions de l’IA",
    ar: "اقتراحات الذكاء الاصطناعي",
    en: "AI suggestions",
  },
  cmpSuggestionsNote: {
    fr: "Des pistes à tester, pas des résultats mesurés.",
    ar: "أفكار للتجربة، وليست نتائج مقاسة.",
    en: "Ideas to test, not measured results.",
  },
  cmpAudiencesToTest: {
    fr: "Audiences à tester",
    ar: "جماهير للتجربة",
    en: "Audiences to test",
  },
  cmpTestPlan: {
    fr: "Plan de test",
    ar: "خطة الاختبار",
    en: "Test plan",
  },
  adsStudioSubtitle: {
    fr: "Concepts, textes et visuels prêts pour Facebook et Instagram, à partir d’une de tes campagnes.",
    ar: "مفاهيم ونصوص وتصاميم جاهزة لفيسبوك وإنستغرام انطلاقاً من إحدى حملاتك.",
    en: "Concepts, copy and images ready for Facebook and Instagram, from one of your campaigns.",
  },
  adsPickCampaign: {
    fr: "Campagne",
    ar: "الحملة",
    en: "Campaign",
  },
  adsNoCampaign: {
    fr: "Les publicités partent d’une campagne",
    ar: "تنطلق الإعلانات من حملة",
    en: "Ads start from a campaign",
  },
  adsNoCampaignText: {
    fr: "Crée une campagne avec les photos et les infos de ton produit : l’IA pourra ensuite écrire et mettre en image tes publicités.",
    ar: "أنشئ حملة بصور منتجك ومعلوماته: سيتمكن الذكاء الاصطناعي بعدها من كتابة إعلاناتك وتصميمها.",
    en: "Create a campaign with your product photos and details: the AI can then write your ads and turn them into images.",
  },
  cmpRendering: {
    fr: "Création du visuel…",
    ar: "جارٍ إنشاء التصميم…",
    en: "Drawing the image…",
  },
  cmpSelect: {
    fr: "Choisir",
    ar: "اختيار",
    en: "Select",
  },
  cmpConcept: {
    fr: "Concept {n}",
    ar: "المفهوم {n}",
    en: "Concept {n}",
  },
  cmpOverlay: {
    fr: "Texte sur l’image",
    ar: "النص على الصورة",
    en: "Text on the image",
  },
  cmpAdHeadline: {
    fr: "Titre de la pub",
    ar: "عنوان الإعلان",
    en: "Ad headline",
  },
  cmpAdDescription: {
    fr: "Description",
    ar: "الوصف",
    en: "Description",
  },
  cmpPrimaryText: {
    fr: "Texte principal",
    ar: "النص الرئيسي",
    en: "Primary text",
  },
  cmpCtaButton: {
    fr: "Bouton",
    ar: "الزر",
    en: "Button",
  },
  cmpForAudience: {
    fr: "Pour : {audience}",
    ar: "موجّه إلى: {audience}",
    en: "For: {audience}",
  },
  cmpEditConcept: {
    fr: "Modifier le concept {n}",
    ar: "تعديل المفهوم {n}",
    en: "Edit concept {n}",
  },
  cmpDownloadCreative: {
    fr: "Télécharger le visuel {n}",
    ar: "تنزيل التصميم {n}",
    en: "Download image {n}",
  },
  brkStyleMinimal: {
    fr: "Minimaliste",
    ar: "بسيط",
    en: "Minimalist",
  },
  brkStyleLuxury: {
    fr: "Luxe",
    ar: "الفخامة",
    en: "Luxury",
  },
  brkStyleBold: {
    fr: "Audacieux",
    ar: "جريء",
    en: "Bold",
  },
  brkStylePlayful: {
    fr: "Ludique",
    ar: "مرح",
    en: "Playful",
  },
  brkStyleNatural: {
    fr: "Naturel",
    ar: "طبيعي",
    en: "Natural",
  },
  brkStyleTech: {
    fr: "Tech",
    ar: "تقني",
    en: "Tech",
  },
  brkStyleClassic: {
    fr: "Classique",
    ar: "كلاسيكي",
    en: "Classic",
  },
  brkSubtitle: {
    fr: "Ton logo, tes couleurs et ta façon de parler. Chaque landing page, script et publicité les reprend.",
    ar: "شعارك وألوانك وطريقتك في الكلام. تعتمدها كل صفحة هبوط وكل سيناريو وكل إعلان.",
    en: "Your logo, your colours and the way you speak. Every landing page, script and ad uses them.",
  },
  brkIdentity: {
    fr: "Identité",
    ar: "الهوية",
    en: "Identity",
  },
  brkName: {
    fr: "Nom de la marque",
    ar: "اسم العلامة",
    en: "Brand name",
  },
  brkLogo: {
    fr: "Logo",
    ar: "الشعار",
    en: "Logo",
  },
  brkReplaceLogo: {
    fr: "Remplacer le logo",
    ar: "استبدال الشعار",
    en: "Replace the logo",
  },
  brkAddLogo: {
    fr: "Ajouter un logo",
    ar: "إضافة شعار",
    en: "Add a logo",
  },
  brkLogoHint: {
    fr: "PNG transparent de préférence",
    ar: "يُفضّل ملف PNG بخلفية شفافة",
    en: "Transparent PNG preferred",
  },
  brkRemoveLogo: {
    fr: "Ne plus utiliser ce logo",
    ar: "التوقف عن استخدام هذا الشعار",
    en: "Stop using this logo",
  },
  brkColors: {
    fr: "Couleurs",
    ar: "الألوان",
    en: "Colours",
  },
  brkColorN: {
    fr: "Couleur {n}",
    ar: "اللون {n}",
    en: "Colour {n}",
  },
  brkRemoveColor: {
    fr: "Retirer la couleur {n}",
    ar: "إزالة اللون {n}",
    en: "Remove colour {n}",
  },
  brkAddColor: {
    fr: "Ajouter",
    ar: "إضافة",
    en: "Add",
  },
  brkColorsHint: {
    fr: "La première couleur sert de couleur principale sur les publicités.",
    ar: "اللون الأول هو اللون الرئيسي في الإعلانات.",
    en: "The first colour is the main colour on the ads.",
  },
  brkHeadingFont: {
    fr: "Police des titres",
    ar: "خط العناوين",
    en: "Heading font",
  },
  brkFontHint: {
    fr: "Le nom d’une police Google Fonts, pour tes futures pages.",
    ar: "اسم خط من Google Fonts لصفحاتك القادمة.",
    en: "The name of a Google Fonts font, for your future pages.",
  },
  brkBodyFont: {
    fr: "Police du texte",
    ar: "خط النص",
    en: "Body font",
  },
  brkVoice: {
    fr: "Ton et public",
    ar: "النبرة والجمهور",
    en: "Tone and audience",
  },
  brkTone: {
    fr: "Ton de la marque",
    ar: "نبرة العلامة",
    en: "Brand tone",
  },
  brkAudience: {
    fr: "Public habituel",
    ar: "الجمهور المعتاد",
    en: "Usual audience",
  },
  brkStyles: {
    fr: "Style visuel",
    ar: "النمط البصري",
    en: "Visual style",
  },
  brkInstructions: {
    fr: "Règles pour l’IA",
    ar: "قواعد للذكاء الاصطناعي",
    en: "Rules for the AI",
  },
  brkInstructionsHint: {
    fr: "Ce que l’IA doit toujours faire ou éviter : mots interdits, promesses à ne pas faire, détails à montrer.",
    ar: "ما يجب على الذكاء الاصطناعي فعله أو تجنّبه دائماً: كلمات ممنوعة، وعود لا تُقدَّم، تفاصيل يجب إظهارها.",
    en: "What the AI must always do or avoid: banned words, promises not to make, details to show.",
  },
  brkPreview: {
    fr: "Aperçu",
    ar: "معاينة",
    en: "Preview",
  },
  brkYourBrand: {
    fr: "Ta marque",
    ar: "علامتك",
    en: "Your brand",
  },
  brkSampleHeadline: {
    fr: "Ce que tes clients verront en premier.",
    ar: "ما سيراه عملاؤك أولاً.",
    en: "What your customers will see first.",
  },
  brkSampleCta: {
    fr: "Commander",
    ar: "اطلب الآن",
    en: "Order now",
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
  metaConnectedToast: {
    fr: "Compte Meta connecté.",
    ar: "تم ربط حساب Meta.",
    en: "Meta account connected.",
  },
  metaDeniedToast: {
    fr: "Connexion Meta annulée.",
    ar: "تم إلغاء ربط Meta.",
    en: "Meta connection cancelled.",
  },
  metaUnavailableToast: {
    fr: "La connexion Meta n’est pas encore configurée sur ce site.",
    ar: "ربط Meta غير مُعدّ على هذا الموقع بعد.",
    en: "Meta login is not set up on this site yet.",
  },
  metaFailedToast: {
    fr: "La connexion Meta a échoué. Réessaie.",
    ar: "فشل الربط مع Meta. أعد المحاولة.",
    en: "Connecting to Meta failed. Try again.",
  },
  metaChecking: {
    fr: "Vérification de la connexion Meta…",
    ar: "جارٍ التحقق من ربط Meta…",
    en: "Checking the Meta connection…",
  },
  metaConnected: {
    fr: "Connecté",
    ar: "متصل",
    en: "Connected",
  },
  metaExpired: {
    fr: "Expiré",
    ar: "منتهي الصلاحية",
    en: "Expired",
  },
  metaNotConnected: {
    fr: "Non connecté",
    ar: "غير مربوط",
    en: "Not connected",
  },
  metaNotConfiguredText: {
    fr: "La publication directe sur Meta n’est pas encore activée sur ce site. En attendant, télécharge tes visuels et tes textes depuis l’onglet Publicités et importe-les dans le Gestionnaire de publicités Meta.",
    ar: "النشر المباشر على Meta غير مفعّل على هذا الموقع بعد. في الأثناء، نزّل تصاميمك ونصوصك من تبويب الإعلانات واستوردها في مدير إعلانات Meta.",
    en: "Publishing straight to Meta is not enabled on this site yet. Meanwhile, download your images and copy from the Ads tab and import them into Meta Ads Manager.",
  },
  metaAdminMissing: {
    fr: "Réglages serveur manquants (visible par les admins) :",
    ar: "إعدادات الخادم الناقصة (تظهر للمسؤولين فقط):",
    en: "Missing server settings (shown to admins only):",
  },
  metaConnectedAs: {
    fr: "Connecté en tant que {name}.",
    ar: "مربوط باسم {name}.",
    en: "Connected as {name}.",
  },
  metaExpiresOn: {
    fr: "Accès valable jusqu’au {date}.",
    ar: "الوصول صالح حتى {date}.",
    en: "Access valid until {date}.",
  },
  metaExpiredText: {
    fr: "L’accès donné par Meta a expiré. Reconnecte ton compte pour continuer à publier.",
    ar: "انتهت صلاحية الوصول الممنوح من Meta. أعد ربط حسابك لمواصلة النشر.",
    en: "The access granted by Meta has expired. Reconnect your account to keep publishing.",
  },
  metaConnectText: {
    fr: "Connecte ton compte Meta pour créer tes campagnes directement depuis l’app. Tu choisiras le compte publicitaire et la Page à utiliser ; rien n’est publié sans ta confirmation.",
    ar: "اربط حسابك على Meta لإنشاء حملاتك مباشرة من التطبيق. ستختار الحساب الإعلاني والصفحة؛ ولا يُنشر شيء دون تأكيدك.",
    en: "Connect your Meta account to create your campaigns straight from the app. You choose the ad account and the Page; nothing is published without your confirmation.",
  },
  metaTokenSafe: {
    fr: "Ton accès Meta est chiffré sur le serveur et n’est jamais envoyé au navigateur.",
    ar: "وصولك إلى Meta مشفّر على الخادم ولا يُرسل أبداً إلى المتصفح.",
    en: "Your Meta access is encrypted on the server and never sent to the browser.",
  },
  metaDisconnect: {
    fr: "Déconnecter",
    ar: "إلغاء الربط",
    en: "Disconnect",
  },
  metaReconnect: {
    fr: "Reconnecter Meta",
    ar: "إعادة ربط Meta",
    en: "Reconnect Meta",
  },
  metaConnect: {
    fr: "Connecter Meta",
    ar: "ربط Meta",
    en: "Connect Meta",
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
  stgIntegrations: {
    fr: "Intégrations",
    ar: "التكاملات",
    en: "Integrations",
  },
  cmpStyleUgc: {
    fr: "User-Generated Content (UGC)",
    ar: "محتوى المستخدمين (UGC)",
    en: "User-generated content (UGC)",
  },
  cmpStyleStudio: {
    fr: "Studio Premium & Cinematic",
    ar: "استوديو مميّز وسينمائي",
    en: "Premium studio & cinematic",
  },
  cmpStyleDemo: {
    fr: "Démonstration & Test (Crash test)",
    ar: "عرض واختبار (اختبار التحمّل)",
    en: "Demonstration & test (crash test)",
  },
  cmpStyleUnboxing: {
    fr: "Unboxing ASMR & Mystère",
    ar: "فتح العلبة ASMR وغموض",
    en: "ASMR unboxing & mystery",
  },
  cmpStyleTestimonial: {
    fr: "Témoignage Client Réaliste",
    ar: "شهادة عميل واقعية",
    en: "Realistic customer testimonial",
  },
  cmpDur15: {
    fr: "15 secondes",
    ar: "15 ثانية",
    en: "15 seconds",
  },
  cmpDur30: {
    fr: "30 secondes",
    ar: "30 ثانية",
    en: "30 seconds",
  },
  cmpDur45: {
    fr: "45 secondes",
    ar: "45 ثانية",
    en: "45 seconds",
  },
  brkPreviewEmpty: {
    fr: "Ajoute des couleurs, un ton et un style : ils apparaîtront ici.",
    ar: "أضف ألواناً ونبرة وأسلوباً: ستظهر هنا.",
    en: "Add colors, a tone and a style: they will show here.",
  },
  cmpDownloadFailed: {
    fr: "Les visuels n’ont pas pu être créés. Réessaie.",
    ar: "تعذّر إنشاء التصاميم. أعد المحاولة.",
    en: "The visuals couldn’t be created. Try again.",
  },
  cmpRenderFailed: {
    fr: "Ce visuel n’a pas pu être dessiné.",
    ar: "تعذّر رسم هذا التصميم.",
    en: "This visual couldn’t be drawn.",
  },
  brkLoadFailed: {
    fr: "Impossible de charger ton identité de marque.",
    ar: "تعذّر تحميل هوية علامتك.",
    en: "Couldn’t load your brand kit.",
  },
  cmpSomePhotosFailed: {
    fr: "Certaines photos n’ont pas pu être envoyées. Ajoute-les depuis l’onglet Brief et photos.",
    ar: "تعذّر رفع بعض الصور. أضفها من تبويب الملخص والصور.",
    en: "Some photos couldn’t be uploaded. Add them from the Brief and photos tab.",
  },
  cmpDeleteAnyway: {
    fr: "Supprimer quand même",
    ar: "الحذف على أي حال",
    en: "Delete anyway",
  },
  cmpBrandLoadFailed: {
    fr: "Ton identité de marque n’a pas pu être chargée : les contenus générés maintenant ne la suivront pas.",
    ar: "تعذّر تحميل هوية علامتك: المحتوى الذي يُنشأ الآن لن يتبعها.",
    en: "Your brand kit couldn’t be loaded: content generated now won’t follow it.",
  },
  metaStartRequired: {
    fr: "Indique la date et l’heure de début.",
    ar: "حدّد تاريخ ووقت البدء.",
    en: "Enter the start date and time.",
  },
  metaCreatedReloadFailed: {
    fr: "La campagne a été créée chez Meta, en pause. Recharge la page pour la voir ici.",
    ar: "أُنشئت الحملة لدى Meta وهي متوقفة. أعد تحميل الصفحة لتراها هنا.",
    en: "The campaign was created at Meta, paused. Reload the page to see it here.",
  },
  cmpVideoOptions: {
    fr: "Style et format",
    ar: "الأسلوب والصيغة",
    en: "Style and format",
  },
};

registerTranslations('campaigns', campaignsTranslations);
