import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// admin: interface text, generated from the components and then maintained by hand.
export const adminTranslations: TranslationDictionary = {
  admTabOverview: {
    fr: "Vue d'ensemble",
    ar: "نظرة عامة",
    en: "Overview",
  },
  admTabUsers: {
    fr: "Utilisateurs",
    ar: "المستخدمون",
    en: "Users",
  },
  admTabApis: {
    fr: "APIs",
    ar: "واجهات API",
    en: "APIs",
  },
  admTabPayments: {
    fr: "Paiements",
    ar: "المدفوعات",
    en: "Payments",
  },
  admTabDeals: {
    fr: "Offres Hot",
    ar: "العروض الساخنة",
    en: "Hot deals",
  },
  admTabGuides: {
    fr: "Guides Vidéo",
    ar: "أدلة الفيديو",
    en: "Video guides",
  },
  admTabContacts: {
    fr: "Contacts",
    ar: "جهات الاتصال",
    en: "Contacts",
  },
  admLoading: {
    fr: "Chargement…",
    ar: "جارٍ التحميل…",
    en: "Loading…",
  },
  admStatusActive: {
    fr: "Actif",
    ar: "نشط",
    en: "Active",
  },
  admStatusPending: {
    fr: "En attente",
    ar: "قيد الانتظار",
    en: "Pending",
  },
  admStatusNone: {
    fr: "Aucun",
    ar: "لا شيء",
    en: "None",
  },
  admModalClose: {
    fr: "Fermer la fenêtre",
    ar: "إغلاق النافذة",
    en: "Close window",
  },
  admToggleVisibility: {
    fr: "Afficher ou masquer",
    ar: "إظهار أو إخفاء",
    en: "Show or hide",
  },
  admMoveUp: {
    fr: "Monter",
    ar: "تحريك للأعلى",
    en: "Move up",
  },
  admMoveDown: {
    fr: "Descendre",
    ar: "تحريك للأسفل",
    en: "Move down",
  },
  admEdit: {
    fr: "Modifier",
    ar: "تعديل",
    en: "Edit",
  },
  admCancelForm: {
    fr: "Fermer le formulaire",
    ar: "إغلاق النموذج",
    en: "Close form",
  },
  admProofOf: {
    fr: "Preuve — {name}",
    ar: "الإثبات — {name}",
    en: "Proof — {name}",
  },
  admAccesRefuse: {
    fr: "Accès refusé",
    ar: "الوصول مرفوض",
    en: "Access denied",
  },
  admCettePageEstReservee: {
    fr: "Cette page est réservée aux administrateurs.",
    ar: "هذه الصفحة مخصصة للمشرفين فقط.",
    en: "This page is reserved for administrators.",
  },
  admRetourSite: {
    fr: "Retour au site",
    ar: "العودة إلى الموقع",
    en: "Back to site",
  },
  admTableauBordAdmin: {
    fr: "Tableau de bord admin",
    ar: "لوحة تحكم الإدارة",
    en: "Admin dashboard",
  },
  admGestionCompletePlateforme: {
    fr: "Gestion complète de la plateforme",
    ar: "إدارة كاملة للمنصة",
    en: "Full platform management",
  },
  admGenerations: {
    fr: "Générations",
    ar: "عمليات التوليد",
    en: "Generations",
  },
  admProducts: {
    fr: "Produits",
    ar: "المنتجات",
    en: "Products",
  },
  admResetPlanConfirm: {
    fr: "Réinitialiser le plan de {name} ?",
    ar: "إعادة تعيين باقة {name}؟",
    en: "Reset {name}'s plan?",
  },
  admDeleteUserConfirm: {
    fr: "Supprimer définitivement {name} ({email}) ? Toutes ses données seront effacées.",
    ar: "حذف {name} ({email}) نهائياً؟ ستُمسح جميع بياناته.",
    en: "Permanently delete {name} ({email})? All their data will be erased.",
  },
  admDeleteUserShortConfirm: {
    fr: "Supprimer définitivement {name} ?",
    ar: "حذف {name} نهائياً؟",
    en: "Permanently delete {name}?",
  },
  admActivatePlanFor: {
    fr: "Activer un plan — {name}",
    ar: "تفعيل باقة — {name}",
    en: "Activate a plan — {name}",
  },
  admActivateLabel: {
    fr: "Activer {label}",
    ar: "تفعيل {label}",
    en: "Activate {label}",
  },
  admOneDay: {
    fr: "1 jour",
    ar: "يوم واحد",
    en: "1 day",
  },
  admDaysShort: {
    fr: "{days}j",
    ar: "{days} ي",
    en: "{days}d",
  },
  admRoleUser: {
    fr: "Utilisateur",
    ar: "مستخدم",
    en: "User",
  },
  admPreuve: {
    fr: "Preuve",
    ar: "الإثبات",
    en: "Proof",
  },
  admPreuvePdf: {
    fr: "Preuve (PDF)",
    ar: "الإثبات (PDF)",
    en: "Proof (PDF)",
  },
  admCliqueOuvrirTelechargerPdf: {
    fr: "Clique pour ouvrir/télécharger le PDF",
    ar: "انقر لفتح ملف PDF أو تنزيله",
    en: "Click to open or download the PDF",
  },
  admGestionUtilisateurs: {
    fr: "Gestion des utilisateurs",
    ar: "إدارة المستخدمين",
    en: "User management",
  },
  admRechercher: {
    fr: "Rechercher…",
    ar: "بحث…",
    en: "Search…",
  },
  admAucunUtilisateurTrouve: {
    fr: "Aucun utilisateur trouvé",
    ar: "لم يتم العثور على أي مستخدم",
    en: "No user found",
  },
  admAjusteRecherche: {
    fr: "Ajuste ta recherche.",
    ar: "عدّل بحثك.",
    en: "Adjust your search.",
  },
  admPlan: {
    fr: "Plan",
    ar: "الباقة",
    en: "Plan",
  },
  admRole: {
    fr: "Rôle",
    ar: "الدور",
    en: "Role",
  },
  admInscrit: {
    fr: "Inscrit le",
    ar: "تاريخ التسجيل",
    en: "Signed up on",
  },
  admActions: {
    fr: "Actions",
    ar: "إجراءات",
    en: "Actions",
  },
  admVoirDetails: {
    fr: "Voir détails",
    ar: "عرض التفاصيل",
    en: "View details",
  },
  admActiverPlan: {
    fr: "Activer un plan",
    ar: "تفعيل باقة",
    en: "Activate a plan",
  },
  admRetirerAdmin: {
    fr: "Retirer admin",
    ar: "إزالة صلاحية المشرف",
    en: "Remove admin",
  },
  admRendreAdmin: {
    fr: "Rendre admin",
    ar: "منح صلاحية المشرف",
    en: "Make admin",
  },
  admReinitialiserPlan: {
    fr: "Réinitialiser le plan",
    ar: "إعادة تعيين الباقة",
    en: "Reset plan",
  },
  admDetailsLUtilisateur: {
    fr: "Détails de l'utilisateur",
    ar: "تفاصيل المستخدم",
    en: "User details",
  },
  admChargementProfil: {
    fr: "Chargement du profil…",
    ar: "جارٍ تحميل الملف الشخصي…",
    en: "Loading profile…",
  },
  admAbonnement: {
    fr: "Abonnement",
    ar: "الاشتراك",
    en: "Subscription",
  },
  admDebut: {
    fr: "Début:",
    ar: "البداية:",
    en: "Start:",
  },
  admExpire: {
    fr: "Expire:",
    ar: "تنتهي:",
    en: "Expires:",
  },
  admAVie: {
    fr: "∞ (à vie)",
    ar: "∞ (مدى الحياة)",
    en: "∞ (lifetime)",
  },
  admMethode: {
    fr: "Méthode:",
    ar: "الطريقة:",
    en: "Method:",
  },
  admSoumis: {
    fr: "Soumis:",
    ar: "تاريخ الإرسال:",
    en: "Submitted:",
  },
  admNote: {
    fr: "Note:",
    ar: "ملاحظة:",
    en: "Note:",
  },
  admPreferences: {
    fr: "Préférences",
    ar: "التفضيلات",
    en: "Preferences",
  },
  admLangue: {
    fr: "Langue:",
    ar: "اللغة:",
    en: "Language:",
  },
  admTheme: {
    fr: "Thème:",
    ar: "المظهر:",
    en: "Theme:",
  },
  admWorkspace: {
    fr: "Workspace:",
    ar: "مساحة العمل:",
    en: "Workspace:",
  },
  admInscrit2: {
    fr: "Inscrit le :",
    ar: "تاريخ التسجيل:",
    en: "Signed up on:",
  },
  admErreur: {
    fr: "Erreur.",
    ar: "خطأ.",
    en: "Error.",
  },
  admPerso: {
    fr: "Perso",
    ar: "مخصص",
    en: "Custom",
  },
  admAVie2: {
    fr: "À vie",
    ar: "مدى الحياة",
    en: "Lifetime",
  },
  admDureeJoursEx1: {
    fr: "Durée en jours (ex: 1, 7, 45)",
    ar: "المدة بالأيام (مثال: 1، 7، 45)",
    en: "Duration in days (e.g. 1, 7, 45)",
  },
  admAccesActifImmediatement: {
    fr: "Accès actif immédiatement —",
    ar: "يُفعَّل الوصول فوراً —",
    en: "Access active immediately —",
  },
  admAnnuler: {
    fr: "Annuler",
    ar: "إلغاء",
    en: "Cancel",
  },
  admRejectConfirm: {
    fr: "Rejeter ce paiement ?",
    ar: "رفض هذا الدفع؟",
    en: "Reject this payment?",
  },
  admAbonnesActifs: {
    fr: "Abonnés actifs",
    ar: "المشتركون النشطون",
    en: "Active subscribers",
  },
  admMethodesPaiement: {
    fr: "Méthodes de paiement",
    ar: "طرق الدفع",
    en: "Payment methods",
  },
  admOffresVedette: {
    fr: "Offres en vedette",
    ar: "العروض المميّزة",
    en: "Featured offers",
  },
  admPaiementsAttente: {
    fr: "Paiements en attente",
    ar: "المدفوعات قيد الانتظار",
    en: "Pending payments",
  },
  admAucunPaiementAttente: {
    fr: "Aucun paiement en attente",
    ar: "لا توجد مدفوعات قيد الانتظار",
    en: "No pending payments",
  },
  admToutEstJour: {
    fr: "Tout est à jour.",
    ar: "كل شيء محدَّث.",
    en: "Everything is up to date.",
  },
  admNonSpecifie: {
    fr: "Non spécifié",
    ar: "غير محدد",
    en: "Not specified",
  },
  admVoirPreuvePdf: {
    fr: "Voir la preuve (PDF)",
    ar: "عرض الإثبات (PDF)",
    en: "View proof (PDF)",
  },
  admPreuveNonLisible: {
    fr: "Preuve non lisible",
    ar: "الإثبات غير قابل للقراءة",
    en: "Proof cannot be read",
  },
  admRejeter: {
    fr: "Rejeter",
    ar: "رفض",
    en: "Reject",
  },
  admEmail: {
    fr: "Email:",
    ar: "البريد:",
    en: "Email:",
  },
  admPlan2: {
    fr: "Plan:",
    ar: "الباقة:",
    en: "Plan:",
  },
  admStatut: {
    fr: "Statut:",
    ar: "الحالة:",
    en: "Status:",
  },
  admPreuveNonDisponible: {
    fr: "Preuve non disponible",
    ar: "الإثبات غير متوفر",
    en: "Proof not available",
  },
  admApprouver: {
    fr: "Approuver",
    ar: "قبول",
    en: "Approve",
  },
  admContactsWhatsapp: {
    fr: "**WhatsApp** — bouton de contact (wa.me) du checkout.",
    ar: "**واتساب** — زر التواصل (wa.me) في صفحة الدفع.",
    en: "**WhatsApp** — contact button (wa.me) in checkout.",
  },
  admContactsTelegram: {
    fr: "**Telegram** — lien t.me/… du checkout.",
    ar: "**تيليغرام** — رابط t.me/… في صفحة الدفع.",
    en: "**Telegram** — t.me/… link in checkout.",
  },
  admContactsEmail: {
    fr: "**Email** — cible de paiement par défaut et email de support.",
    ar: "**البريد الإلكتروني** — وجهة الدفع الافتراضية وبريد الدعم.",
    en: "**Email** — default payment target and support email.",
  },
  admErreurLorsSauvegarde: {
    fr: "Erreur lors de la sauvegarde.",
    ar: "حدث خطأ أثناء الحفظ.",
    en: "Error while saving.",
  },
  admCoordonneesContact: {
    fr: "Coordonnées de contact",
    ar: "بيانات الاتصال",
    en: "Contact details",
  },
  admEnregistrer: {
    fr: "Enregistrer",
    ar: "حفظ",
    en: "Save",
  },
  admNumeroWhatsapp: {
    fr: "Numéro WhatsApp",
    ar: "رقم واتساب",
    en: "WhatsApp number",
  },
  admFormatInternationalSansEx: {
    fr: "Format international, sans « + » (ex : 213555000000). Laisse vide pour masquer le bouton WhatsApp.",
    ar: "الصيغة الدولية بدون «+» (مثال: 213555000000). اتركه فارغاً لإخفاء زر واتساب.",
    en: "International format, without “+” (e.g. 213555000000). Leave empty to hide the WhatsApp button.",
  },
  admTelegramUsername: {
    fr: "Telegram (username)",
    ar: "تيليغرام (اسم المستخدم)",
    en: "Telegram (username)",
  },
  admNomDUtilisateurUtilise: {
    fr: "Nom d'utilisateur utilisé dans les liens t.me/…",
    ar: "اسم المستخدم المستعمل في روابط t.me/…",
    en: "Username used in t.me/… links",
  },
  admEmailContact: {
    fr: "Email de contact",
    ar: "البريد الإلكتروني للتواصل",
    en: "Contact email",
  },
  admAdresseEmailUtiliseePaiements: {
    fr: "Adresse email utilisée pour les paiements et le support.",
    ar: "عنوان البريد المستعمل للمدفوعات والدعم.",
    en: "Email address used for payments and support.",
  },
  admCesCoordonneesSontPropagees: {
    fr: "Ces coordonnées sont propagées dans toute la plateforme, notamment dans le checkout pour finaliser les paiements.",
    ar: "تُعتمد هذه البيانات في كل أنحاء المنصة، خصوصاً في صفحة الدفع لإتمام المدفوعات.",
    en: "These details are used across the platform, notably in checkout to complete payments.",
  },
  admDeleteNameConfirm: {
    fr: "Supprimer {name} ?",
    ar: "حذف {name}؟",
    en: "Delete {name}?",
  },
  admEditNameTitle: {
    fr: "Modifier — {name}",
    ar: "تعديل — {name}",
    en: "Edit — {name}",
  },
  admBeneficiary: {
    fr: "Bénéficiaire",
    ar: "المستفيد",
    en: "Beneficiary",
  },
  admIdNumber: {
    fr: "N° Identifiant",
    ar: "رقم الهوية",
    en: "ID number",
  },
  admInstructionsTip: {
    fr: "Astuce : utilise **{amount}**, **{target}** et **{plan}** comme variables dynamiques.",
    ar: "نصيحة: استعمل **{amount}** و**{target}** و**{plan}** كمتغيرات ديناميكية.",
    en: "Tip: use **{amount}**, **{target}** and **{plan}** as dynamic variables.",
  },
  admBanque: {
    fr: "Banque",
    ar: "بنك",
    en: "Bank",
  },
  admManuel: {
    fr: "Manuel",
    ar: "يدوي",
    en: "Manual",
  },
  admAjouter: {
    fr: "Ajouter",
    ar: "إضافة",
    en: "Add",
  },
  admAucuneMethodePaiement: {
    fr: "Aucune méthode de paiement",
    ar: "لا توجد طريقة دفع",
    en: "No payment method",
  },
  admAjoutePremiereMethodeRedotpay: {
    fr: "Ajoute ta première méthode (RedotPay, BaridiMob…).",
    ar: "أضف أول طريقة دفع (RedotPay، BaridiMob…).",
    en: "Add your first method (RedotPay, BaridiMob…).",
  },
  admMasque: {
    fr: "Masqué",
    ar: "مخفي",
    en: "Hidden",
  },
  admNouvelleMethodePaiement: {
    fr: "Nouvelle méthode de paiement",
    ar: "طريقة دفع جديدة",
    en: "New payment method",
  },
  admCodeUniqueSlug: {
    fr: "Code (unique, slug)",
    ar: "الرمز (فريد، slug)",
    en: "Code (unique, slug)",
  },
  admEmoji: {
    fr: "Emoji",
    ar: "إيموجي",
    en: "Emoji",
  },
  admType: {
    fr: "Type",
    ar: "النوع",
    en: "Type",
  },
  admDescription: {
    fr: "Description",
    ar: "الوصف",
    en: "Description",
  },
  admPaiementLigneRapideSecurise: {
    fr: "Paiement en ligne rapide et sécurisé",
    ar: "دفع إلكتروني سريع وآمن",
    en: "Fast and secure online payment",
  },
  admOrdreDAffichage: {
    fr: "Ordre d'affichage",
    ar: "ترتيب العرض",
    en: "Display order",
  },
  admVisibleCheckout: {
    fr: "Visible dans le checkout",
    ar: "ظاهرة في صفحة الدفع",
    en: "Visible in checkout",
  },
  admMasquee: {
    fr: "Masquée",
    ar: "مخفية",
    en: "Hidden",
  },
  admEmailReceptionOptionnel: {
    fr: "Email de réception (optionnel)",
    ar: "بريد الاستلام (اختياري)",
    en: "Receiving email (optional)",
  },
  admParDefautAdminEmail: {
    fr: "Par défaut : ADMIN_EMAIL",
    ar: "افتراضياً: ADMIN_EMAIL",
    en: "Default: ADMIN_EMAIL",
  },
  admInstructionsEtapes: {
    fr: "Instructions (étapes)",
    ar: "التعليمات (الخطوات)",
    en: "Instructions (steps)",
  },
  admOuvreLApplication: {
    fr: "Ouvre l'application…",
    ar: "افتح التطبيق…",
    en: "Open the app…",
  },
  admLesPrixDoiventEtre: {
    fr: "Les prix doivent être des nombres entiers positifs.",
    ar: "يجب أن تكون الأسعار أعداداً صحيحة موجبة.",
    en: "Prices must be positive whole numbers.",
  },
  admLeCodeSymboleDevise: {
    fr: "Le code et le symbole de la devise sont requis.",
    ar: "رمز العملة ورمزها المختصر مطلوبان.",
    en: "The currency code and symbol are required.",
  },
  admTarifsDevise: {
    fr: "Tarifs & Devise",
    ar: "الأسعار والعملة",
    en: "Pricing & currency",
  },
  admCodeDevise: {
    fr: "Code devise",
    ar: "رمز العملة",
    en: "Currency code",
  },
  admSymbole: {
    fr: "Symbole",
    ar: "الرمز",
    en: "Symbol",
  },
  admPositionSymbole: {
    fr: "Position du symbole",
    ar: "موضع الرمز",
    en: "Symbol position",
  },
  admApresMontant1500: {
    fr: "Après le montant — « 1 500 DA »",
    ar: "بعد المبلغ — «1 500 DA»",
    en: "After the amount — “1,500 DA”",
  },
  admAvantMontantDa1: {
    fr: "Avant le montant — « DA 1 500 »",
    ar: "قبل المبلغ — «DA 1 500»",
    en: "Before the amount — “DA 1,500”",
  },
  admMensuel: {
    fr: "Mensuel",
    ar: "شهري",
    en: "Monthly",
  },
  admTrimestriel: {
    fr: "Trimestriel",
    ar: "ربع سنوي",
    en: "Quarterly",
  },
  admCesPrixSAppliquent: {
    fr: "Ces prix s'appliquent au checkout, à la page de vente et au montant affiché dans les instructions de paiement.",
    ar: "تُطبَّق هذه الأسعار على صفحة الدفع وصفحة البيع والمبلغ المعروض في تعليمات الدفع.",
    en: "These prices apply to checkout, the sales page and the amount shown in the payment instructions.",
  },
  admDeleteTitleConfirm: {
    fr: "Supprimer « {title} » ?",
    ar: "حذف «{title}»؟",
    en: "Delete “{title}”?",
  },
  admOffresVedetteHotDeals: {
    fr: "Offres en vedette (Hot Deals)",
    ar: "العروض المميّزة (Hot Deals)",
    en: "Featured offers (Hot Deals)",
  },
  admAucuneOffreVedette: {
    fr: "Aucune offre en vedette",
    ar: "لا توجد عروض مميّزة",
    en: "No featured offers",
  },
  admMetsAvantProduitsChauds: {
    fr: "Mets en avant tes produits chauds pour tous les utilisateurs.",
    ar: "أبرز منتجاتك الرائجة لجميع المستخدمين.",
    en: "Highlight your hot products for all users.",
  },
  admModifierLOffre: {
    fr: "Modifier l'offre",
    ar: "تعديل العرض",
    en: "Edit offer",
  },
  admNouvelleOffreVedette: {
    fr: "Nouvelle offre en vedette",
    ar: "عرض مميّز جديد",
    en: "New featured offer",
  },
  admTitre: {
    fr: "Titre",
    ar: "العنوان",
    en: "Title",
  },
  admRobotMenager121: {
    fr: "Robot ménager 12-en-1",
    ar: "روبوت منزلي 12 في 1",
    en: "12-in-1 kitchen robot",
  },
  admPourquoiCeProduitEst: {
    fr: "Pourquoi ce produit est chaud ?",
    ar: "لماذا هذا المنتج رائج؟",
    en: "Why is this product hot?",
  },
  admBadge: {
    fr: "Badge",
    ar: "شارة",
    en: "Badge",
  },
  admPrixAffichage: {
    fr: "Prix (affichage)",
    ar: "السعر (للعرض)",
    en: "Price (display)",
  },
  admLienOptionnel: {
    fr: "Lien (optionnel)",
    ar: "الرابط (اختياري)",
    en: "Link (optional)",
  },
  admOrdre: {
    fr: "Ordre",
    ar: "الترتيب",
    en: "Order",
  },
  admActive: {
    fr: "Active",
    ar: "مفعّلة",
    en: "Active",
  },
  admApiOf: {
    fr: "API — {name}",
    ar: "واجهات API — {name}",
    en: "API — {name}",
  },
  admDeleteKeysConfirm: {
    fr: "Supprimer les API keys de {name} ?",
    ar: "حذف مفاتيح API الخاصة بـ {name}؟",
    en: "Delete {name}'s API keys?",
  },
  admCurrentValue: {
    fr: "actuel : {value}",
    ar: "الحالي: {value}",
    en: "current: {value}",
  },
  admIa: {
    fr: "IA",
    ar: "الذكاء الاصطناعي",
    en: "AI",
  },
  admDivers: {
    fr: "Divers",
    ar: "متفرقات",
    en: "Misc",
  },
  admConfigurationPlateforme: {
    fr: "Configuration de la plateforme",
    ar: "إعدادات المنصة",
    en: "Platform configuration",
  },
  admConfigure: {
    fr: "Configuré",
    ar: "مُعدّ",
    en: "Configured",
  },
  admApiParUtilisateur: {
    fr: "API par utilisateur",
    ar: "واجهات API لكل مستخدم",
    en: "API per user",
  },
  admAucunUtilisateur: {
    fr: "Aucun utilisateur",
    ar: "لا يوجد مستخدمون",
    en: "No users",
  },
  admIntegrationsConnectees: {
    fr: "Intégrations connectées",
    ar: "التكاملات المتصلة",
    en: "Connected integrations",
  },
  admAucune: {
    fr: "Aucune",
    ar: "لا شيء",
    en: "None",
  },
  admLaisserVideGarderL: {
    fr: "Laisser vide pour garder l'actuel",
    ar: "اتركه فارغاً للإبقاء على الحالي",
    en: "Leave empty to keep the current one",
  },
  admDeleteAnnouncementConfirm: {
    fr: "Supprimer l'annonce « {title} » ?",
    ar: "حذف الإعلان «{title}»؟",
    en: "Delete the announcement “{title}”?",
  },
  admFromDate: {
    fr: "Du {date}",
    ar: "من {date}",
    en: "From {date}",
  },
  admToDate: {
    fr: " au {date}",
    ar: " إلى {date}",
    en: " to {date}",
  },
  admImmediate: {
    fr: "Immédiate",
    ar: "فورية",
    en: "Immediate",
  },
  admPermanent: {
    fr: " · permanente",
    ar: " · دائمة",
    en: " · permanent",
  },
  admNouvelleAnnonce: {
    fr: "Nouvelle annonce",
    ar: "إعلان جديد",
    en: "New announcement",
  },
  admAucuneAnnonce: {
    fr: "Aucune annonce",
    ar: "لا توجد إعلانات",
    en: "No announcements",
  },
  admLesAnnoncesApparaissentDashboa: {
    fr: "Les annonces apparaissent dans le dashboard des utilisateurs.",
    ar: "تظهر الإعلانات في لوحة تحكم المستخدمين.",
    en: "Announcements appear in users' dashboards.",
  },
  admModifierLAnnonce: {
    fr: "Modifier l'annonce",
    ar: "تعديل الإعلان",
    en: "Edit announcement",
  },
  admNouveaute: {
    fr: "Nouveauté !",
    ar: "جديد!",
    en: "What's new!",
  },
  admLeMessageAfficheUtilisateurs: {
    fr: "Le message affiché aux utilisateurs…",
    ar: "الرسالة التي تظهر للمستخدمين…",
    en: "The message shown to users…",
  },
  admDebutOptionnel: {
    fr: "Début (optionnel)",
    ar: "البداية (اختياري)",
    en: "Start (optional)",
  },
  admFinOptionnel: {
    fr: "Fin (optionnel)",
    ar: "النهاية (اختياري)",
    en: "End (optional)",
  },
  admAnnonceActive: {
    fr: "Annonce active",
    ar: "إعلان مفعّل",
    en: "Announcement active",
  },
  admAnnonceDesactivee: {
    fr: "Annonce désactivée",
    ar: "إعلان معطّل",
    en: "Announcement disabled",
  },
  admDeleteGuideConfirm: {
    fr: "Supprimer le guide « {title} » ?",
    ar: "حذف الدليل «{title}»؟",
    en: "Delete the guide “{title}”?",
  },
  admAjouterGuideVideo: {
    fr: "Ajouter un guide vidéo",
    ar: "إضافة دليل فيديو",
    en: "Add a video guide",
  },
  admAucunGuideVideo: {
    fr: "Aucun guide vidéo",
    ar: "لا توجد أدلة فيديو",
    en: "No video guides",
  },
  admAjouteLiensVideosYoutube: {
    fr: "Ajoute des liens de vidéos YouTube pour former tes utilisateurs sur le dashboard.",
    ar: "أضف روابط فيديوهات يوتيوب لتكوين مستخدميك داخل لوحة التحكم.",
    en: "Add YouTube video links to train your users on the dashboard.",
  },
  admVoirYoutube: {
    fr: "Voir sur YouTube",
    ar: "المشاهدة على يوتيوب",
    en: "Watch on YouTube",
  },
  admModifierGuideVideo: {
    fr: "Modifier le guide vidéo",
    ar: "تعديل دليل الفيديو",
    en: "Edit video guide",
  },
  admNouveauGuideVideo: {
    fr: "Nouveau guide vidéo",
    ar: "دليل فيديو جديد",
    en: "New video guide",
  },
  admTitreGuide: {
    fr: "Titre du guide",
    ar: "عنوان الدليل",
    en: "Guide title",
  },
  admCommentLancerPubliciteGagnante: {
    fr: "Comment lancer une publicité gagnante",
    ar: "كيف تطلق إعلاناً رابحاً",
    en: "How to launch a winning ad",
  },
  admLienVideoYoutube: {
    fr: "Lien vidéo YouTube",
    ar: "رابط فيديو يوتيوب",
    en: "YouTube video link",
  },
  admDescriptionOptionnelle: {
    fr: "Description (optionnelle)",
    ar: "الوصف (اختياري)",
    en: "Description (optional)",
  },
  admExplicationSuccincteContenuVid: {
    fr: "Explication succincte du contenu de la vidéo...",
    ar: "شرح موجز لمحتوى الفيديو...",
    en: "Short explanation of the video's content...",
  },
  admApercuVideo: {
    fr: "Aperçu vidéo",
    ar: "معاينة الفيديو",
    en: "Video preview",
  },
  admGuideActif: {
    fr: "Guide actif",
    ar: "دليل مفعّل",
    en: "Guide active",
  },
  admLifetimeLower: {
    fr: "à vie",
    ar: "مدى الحياة",
    en: "lifetime",
  },
  admExRedotpay: {
    fr: "ex : redotpay",
    ar: "مثال: redotpay",
    en: "e.g. redotpay",
  },
};

registerTranslations('admin', adminTranslations);
