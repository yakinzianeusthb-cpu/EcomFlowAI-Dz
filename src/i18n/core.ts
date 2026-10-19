import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// Shared interface text: navigation, dashboard, authentication, landing page and plans.
export const coreTranslations: TranslationDictionary = {
  // Topbar & Header
  winningProductsCount: {
    fr: "Produits Gagnants",
    ar: "المنتجات الرابحة",
    en: "Winning Products",
  },
  lightMode: {
    fr: "Clair",
    ar: "نهار",
    en: "Light",
  },
  darkMode: {
    fr: "Sombre",
    ar: "ليل",
    en: "Dark",
  },
  selectLanguage: {
    fr: "Choisir la langue",
    ar: "اختر اللغة",
    en: "Select Language",
  },
  
  // Tabs Title in Topbar
  tabImages: {
    fr: "Studio Photos Produit",
    ar: "إستوديو صور المنتجات والتصوير",
    en: "Product Photo Studio",
  },
  tabTrends: {
    fr: "Détecteur de Produits Gagnants (Winning Products)",
    ar: "كاشف المنتجات الرابحة واتجاهات السوق",
    en: "Winning Products & Market Trends",
  },
  tabDarja: {
    fr: "Générateur d'Annonces Darja",
    ar: "مولد إعلانات الدارجة",
    en: "Darija Ad Copy Generator",
  },
  tabAnalyzer: {
    fr: "Consultant Expert IA (Analyse Produit)",
    ar: "مستشار الخبراء بالذكاء الاصطناعي لتحليل المنتجات",
    en: "AI Expert Product Consultant",
  },
  tabCatalog: {
    fr: "Catalogue & Gestion Produits",
    ar: "كتالوج وإدارة المنتجات",
    en: "Product Catalog & Management",
  },
  tabScout: {
    fr: "Scout de Produits Telegram",
    ar: "مستكشف منتجات التلغرام",
    en: "Telegram Product Scout",
  },
  tabCalendar: {
    fr: "Calendrier de Contenu",
    ar: "تقويم محتوى التجارة الإلكترونية",
    en: "Content Calendar",
  },

  // Sidebar Menu Items
  menuDashboard: {
    fr: "Tableau de bord",
    ar: "لوحة التحكم",
    en: "Dashboard",
  },
  menuVideo: {
    fr: "Pubs vidéo",
    ar: "إعلانات الفيديو",
    en: "Video ads",
  },
  menuLanding: {
    fr: "Landing pages",
    ar: "صفحات الهبوط",
    en: "Landing pages",
  },
  menuAssembler: {
    fr: "Constructeur de page",
    ar: "باني الصفحات",
    en: "Page builder",
  },
  menuCalculator: {
    fr: "Calcul de marge COD",
    ar: "حاسبة أرباح COD",
    en: "COD margin calculator",
  },
  menuTrends: {
    fr: "Produits Gagnants",
    ar: "المنتجات الأكثر مبيعاً",
    en: "Winning Products",
  },
  menuSettings: {
    fr: "Paramètres",
    ar: "الإعدادات",
    en: "Settings",
  },
  menuDarja: {
    fr: "Annonces Darja",
    ar: "إعلانات الدارجة",
    en: "Darija Ads",
  },
  menuCatalog: {
    fr: "Catalogue Produits",
    ar: "كتالوج المنتجات",
    en: "Product Catalog",
  },
  menuScout: {
    fr: "Scout Telegram",
    ar: "ماسح التلغرام",
    en: "Telegram Scout",
  },
  menuCalendar: {
    fr: "Calendrier Contenu",
    ar: "تقويم المحتوى",
    en: "Content Calendar",
  },
  menuToolsText: {
    fr: "Menu Outils",
    ar: "قائمة الأدوات",
    en: "Tools Menu",
  },
  logout: {
    fr: "Déconnexion",
    ar: "تسجيل الخروج",
    en: "Logout",
  },

  // Sidebar subscription
  sidebarSubActive: {
    fr: "Abonnement actif",
    ar: "الاشتراك نشط",
    en: "Active subscription",
  },
  sidebarSubDaysLeft: {
    fr: "jours restants",
    ar: "يوم متبقي",
    en: "days left",
  },
  sidebarSubLifetime: {
    fr: "Accès à vie",
    ar: "وصول مدى الحياة",
    en: "Lifetime access",
  },
  sidebarSubExpired: {
    fr: "Expiré",
    ar: "منتهي الصلاحية",
    en: "Expired",
  },
  sidebarSubNoPlan: {
    fr: "Aucun abonnement",
    ar: "لا يوجد اشتراك",
    en: "No active plan",
  },
  sidebarSubUpgrade: {
    fr: "Voir les plans",
    ar: "عرض الخطط",
    en: "View plans",
  },

  // App shell
  menuContact: {
    fr: "Contact & support",
    ar: "الدعم والتواصل",
    en: "Contact & support",
  },
  loggedOutMsg: {
    fr: "Vous êtes déconnecté(e). À bientôt !",
    ar: "تم تسجيل خروجك. إلى اللقاء!",
    en: "You've been signed out. See you soon!",
  },
  skipToContent: {
    fr: "Aller au contenu",
    ar: "انتقل إلى المحتوى",
    en: "Skip to content",
  },
  planBannerPending: {
    fr: "Paiement en attente d'approbation : un admin vérifie ta preuve et active ton accès.",
    ar: "الدفع قيد المراجعة: سيتحقق المشرف من إثبات الدفع ويفعّل حسابك.",
    en: "Payment pending approval: an admin is checking your proof and will activate your access.",
  },
  planBannerNone: {
    fr: "Aucun plan actif : abonne-toi pour débloquer les outils IA.",
    ar: "لا يوجد اشتراك نشط: اشترك لفتح أدوات الذكاء الاصطناعي.",
    en: "No active plan: subscribe to unlock the AI tools.",
  },
  planBannerExpired: {
    fr: "Ton abonnement a expiré : renouvelle-le pour retrouver les outils IA.",
    ar: "انتهى اشتراكك: جدّده لاستعادة أدوات الذكاء الاصطناعي.",
    en: "Your subscription has expired: renew it to get the AI tools back.",
  },

  // Prompt fields (shared form control)
  pfClear: {
    fr: "Effacer le champ",
    ar: "تصفير (مسح) الخانة",
    en: "Clear field",
  },
  pfHide: {
    fr: "Masquer le champ",
    ar: "إخفاء / طي الخانة",
    en: "Hide field",
  },
  pfShow: {
    fr: "Afficher le champ",
    ar: "إظهار الخانة",
    en: "Show field",
  },
  pfShowShort: {
    fr: "Afficher",
    ar: "إظهار",
    en: "Show",
  },
  pfHiddenNow: {
    fr: "Champ masqué",
    ar: "الخانة مخفية حالياً",
    en: "Field hidden",
  },
  pfEmpty: {
    fr: "vide",
    ar: "فارغة",
    en: "empty",
  },

  // Landing page additions

  // Dashboard
  dashWidgetAnnouncements: {
    fr: "Annonces",
    ar: "الإعلانات",
    en: "Announcements",
  },
  dashWidgetHotDeals: {
    fr: "Offres chaudes",
    ar: "العروض الساخنة",
    en: "Hot deals",
  },
  toolVideoBlurb: {
    fr: "Génère des scripts de pubs vidéo TikTok et Facebook à fort potentiel.",
    ar: "أنشئ سكريبتات إعلانات فيديو لتيك توك وفيسبوك بقدرة تحويل عالية.",
    en: "Generate high-converting TikTok and Facebook video ad scripts.",
  },
  toolLandingBlurb: {
    fr: "Crée des tunnels de vente et la copie de ta landing page.",
    ar: "أنشئ مسارات البيع ونصوص صفحة الهبوط.",
    en: "Build sales funnels and landing page copy.",
  },
  toolAssemblerBlurb: {
    fr: "Assemble visuellement ta landing page, section par section.",
    ar: "اجمع صفحة الهبوط قسماً بقسم بشكل مرئي.",
    en: "Assemble your landing page visually, section by section.",
  },
  toolCalculatorBlurb: {
    fr: "Calcule tes marges et ton profit net en paiement à la livraison.",
    ar: "احسب هوامش الربح وصافي الربح في الدفع عند الاستلام.",
    en: "Calculate your margins and net profit for cash on delivery.",
  },
  lockedBadgeText: {
    fr: "Réservé aux abonnés",
    ar: "للمشتركين فقط",
    en: "Subscribers only",
  },
  lockedBody: {
    fr: "Cet outil nécessite un plan actif. Abonne-toi pour débloquer tous les outils IA.",
    ar: "تتطلب هذه الأداة اشتراكاً نشطاً. اشترك لفتح جميع أدوات الذكاء الاصطناعي.",
    en: "This tool requires an active plan. Subscribe to unlock all AI tools.",
  },
  lockedBack: {
    fr: "Retour au tableau de bord",
    ar: "العودة إلى لوحة التحكم",
    en: "Back to dashboard",
  },

  // Common Actions
  generate: {
    fr: "Générer",
    ar: "إنشاء",
    en: "Generate",
  },
  download: {
    fr: "Télécharger",
    ar: "تحميل",
    en: "Download",
  },
  copy: {
    fr: "Copier",
    ar: "نسخ",
    en: "Copy",
  },
  copied: {
    fr: "Copié !",
    ar: "تم النسخ!",
    en: "Copied!",
  },
  restore: {
    fr: "Restaurer",
    ar: "استرجاع",
    en: "Restore",
  },
  delete: {
    fr: "Supprimer",
    ar: "حذف",
    en: "Delete",
  },

  // Auth pages
  authBack: {
    fr: "Retour à l'accueil",
    ar: "العودة إلى الرئيسية",
    en: "Back to home",
  },
  authSecure: {
    fr: "Connexion sécurisée · code à 6 chiffres",
    ar: "اتصال آمن · رمز من 6 أرقام",
    en: "Secure login · 6-digit code",
  },
  authEmail: {
    fr: "Adresse email",
    ar: "البريد الإلكتروني",
    en: "Email address",
  },
  authPassword: {
    fr: "Mot de passe",
    ar: "كلمة المرور",
    en: "Password",
  },
  authName: {
    fr: "Nom complet",
    ar: "الاسم الكامل",
    en: "Full name",
  },
  authNamePlaceholder: {
    fr: "Ahmed Benali",
    ar: "أحمد بن علي",
    en: "Ahmed Benali",
  },
  authConfirmPassword: {
    fr: "Confirmer le mot de passe",
    ar: "تأكيد كلمة المرور",
    en: "Confirm password",
  },
  authLoginTitle: {
    fr: "Bienvenue",
    ar: "مرحباً بعودتك",
    en: "Welcome back",
  },
  authLoginSubtitle: {
    fr: "Connecte-toi à ton espace e-commerce. Un code à 6 chiffres te sera envoyé.",
    ar: "سجّل الدخول إلى مساحة التجارة الإلكترونية الخاصة بك. سيتم إرسال رمز من 6 أرقام إليك.",
    en: "Sign in to your e-commerce workspace. A 6-digit code will be sent to you.",
  },
  authRegisterTitle: {
    fr: "Créer un compte",
    ar: "إنشاء حساب",
    en: "Create account",
  },
  authRegisterSubtitle: {
    fr: "Le compte est gratuit. Ensuite, tu choisis un plan et tu ajoutes ta clé Gemini pour générer.",
    ar: "إنشاء الحساب مجاني. بعد ذلك تختار خطة وتضيف مفتاح Gemini الخاص بك لبدء الإنشاء.",
    en: "The account is free. Then you pick a plan and add your Gemini key to start generating.",
  },
  authLoginBtn: {
    fr: "Se connecter",
    ar: "تسجيل الدخول",
    en: "Sign in",
  },
  authRegisterBtn: {
    fr: "Créer mon compte",
    ar: "إنشاء حسابي",
    en: "Create my account",
  },
  authNoAccount: {
    fr: "Pas encore de compte ?",
    ar: "ليس لديك حساب بعد؟",
    en: "Don't have an account?",
  },
  authCreateAccount: {
    fr: "Créer un compte",
    ar: "إنشاء حساب",
    en: "Create one",
  },
  authHaveAccount: {
    fr: "Déjà un compte ?",
    ar: "لديك حساب بالفعل؟",
    en: "Already have an account?",
  },
  authSignIn: {
    fr: "Se connecter",
    ar: "تسجيل الدخول",
    en: "Sign in",
  },
  authOr: {
    fr: "ou",
    ar: "أو",
    en: "or",
  },
  authGoogle: {
    fr: "Continuer avec Google",
    ar: "المتابعة عبر جوجل",
    en: "Continue with Google",
  },
  authVerifyTitle: {
    fr: "Vérifie ton email",
    ar: "تحقق من بريدك الإلكتروني",
    en: "Verify your email",
  },
  authOtpSentTo: {
    fr: "Code envoyé à",
    ar: "تم إرسال الرمز إلى",
    en: "Code sent to",
  },
  authVerifyBtn: {
    fr: "Vérifier le code",
    ar: "تحقق من الرمز",
    en: "Verify code",
  },
  authVerifying: {
    fr: "Vérification…",
    ar: "جارٍ التحقق…",
    en: "Verifying…",
  },
  authVerified: {
    fr: "Email vérifié ! Connexion…",
    ar: "تم التحقق من البريد! جارٍ تسجيل الدخول…",
    en: "Email verified! Signing in…",
  },
  authResend: {
    fr: "Renvoyer le code",
    ar: "إعادة إرسال الرمز",
    en: "Resend code",
  },
  authResendIn: {
    fr: "Renvoyer dans",
    ar: "إعادة الإرسال خلال",
    en: "Resend in",
  },
  authNoCode: {
    fr: "Tu n'as rien reçu ?",
    ar: "لم يصلك شيء؟",
    en: "Didn't get it?",
  },
  authChangeEmail: {
    fr: "Ce n'est pas mon email — revenir",
    ar: "هذا ليس بريدي — العودة",
    en: "Not my email — go back",
  },
  authDevHint: {
    fr: "Mode dév : le code est affiché dans la console du serveur.",
    ar: "وضع التطوير: يظهر الرمز في سجل الخادم.",
    en: "Dev mode: the code is printed in the server console.",
  },
  authLoginOtpNote: {
    fr: "Code de connexion · valable 10 minutes",
    ar: "رمز الدخول · صالح لمدة 10 دقائق",
    en: "Login code · valid for 10 minutes",
  },
  authPleaseWait: {
    fr: "Envoi du code…",
    ar: "جارٍ إرسال الرمز…",
    en: "Sending code…",
  },
  authResent: {
    fr: "Nouveau code envoyé !",
    ar: "تم إرسال رمز جديد!",
    en: "New code sent!",
  },
  authShowPw: {
    fr: "Afficher le mot de passe",
    ar: "إظهار كلمة المرور",
    en: "Show password",
  },
  authHidePw: {
    fr: "Masquer le mot de passe",
    ar: "إخفاء كلمة المرور",
    en: "Hide password",
  },
  authErrFill: {
    fr: "Remplis tous les champs.",
    ar: "املأ جميع الحقول.",
    en: "Please fill in all fields.",
  },
  authErrGeneric: {
    fr: "Une erreur est survenue.",
    ar: "حدث خطأ ما.",
    en: "Something went wrong.",
  },
  authErrCode: {
    fr: "Entre le code complet à 6 chiffres.",
    ar: "أدخل الرمز الكامل المكوّن من 6 أرقام.",
    en: "Enter the full 6-digit code.",
  },
  authErrCodeInvalid: {
    fr: "Code invalide ou expiré.",
    ar: "رمز غير صالح أو منتهي الصلاحية.",
    en: "Invalid or expired code.",
  },
  authPwShort: {
    fr: "Le mot de passe doit contenir au moins 8 caractères.",
    ar: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.",
    en: "Password must be at least 8 characters.",
  },
  authPwMismatch: {
    fr: "Les mots de passe ne correspondent pas.",
    ar: "كلمتا المرور غير متطابقتين.",
    en: "Passwords do not match.",
  },
  authForgotPassword: {
    fr: "Mot de passe oublié ?",
    ar: "نسيت كلمة المرور؟",
    en: "Forgot password?",
  },
  authErrName: {
    fr: "Entre ton nom.",
    ar: "أدخل اسمك.",
    en: "Enter your name.",
  },
  authErrEmail: {
    fr: "Adresse email invalide.",
    ar: "بريد إلكتروني غير صالح.",
    en: "Invalid email address.",
  },
  authTerms: {
    fr: "En créant un compte, tu acceptes les {terms} et la {privacy}.",
    ar: "بإنشاء حساب، فإنك توافق على {terms} و{privacy}.",
    en: "By creating an account you agree to the {terms} and the {privacy}.",
  },
  // Auth brand panel
  authBrandBadge: {
    fr: "Pour les vendeurs e-commerce en Algérie",
    ar: "لبائعي التجارة الإلكترونية في الجزائر",
    en: "For e-commerce sellers in Algeria",
  },
  authBrandHeadlineA: {
    fr: "Une photo produit.",
    ar: "صورة منتج واحدة.",
    en: "One product photo.",
  },
  authBrandHeadlineB: {
    fr: "Toute la campagne.",
    ar: "وحملة كاملة.",
    en: "A whole campaign.",
  },
  authBrandDesc: {
    fr: "La landing page, le script vidéo et les publicités, rédigés à partir de tes photos, aux couleurs de ta marque.",
    ar: "صفحة الهبوط وسيناريو الفيديو والإعلانات، تُكتب انطلاقاً من صورك وبألوان علامتك.",
    en: "The landing page, the video script and the ads, written from your photos in your brand colors.",
  },
  // Forgot password
  fpTitle: {
    fr: "Réinitialiser le mot de passe",
    ar: "إعادة تعيين كلمة المرور",
    en: "Reset your password",
  },
  fpEmailSubtitle: {
    fr: "Entre ton email, on t'envoie un code à 6 chiffres.",
    ar: "أدخل بريدك الإلكتروني وسنرسل لك رمزاً من 6 أرقام.",
    en: "Enter your email and we'll send you a 6-digit code.",
  },
  fpStepEmail: {
    fr: "Email",
    ar: "البريد",
    en: "Email",
  },
  fpStepCode: {
    fr: "Code",
    ar: "الرمز",
    en: "Code",
  },
  fpStepPassword: {
    fr: "Mot de passe",
    ar: "كلمة المرور",
    en: "Password",
  },
  fpContinue: {
    fr: "Continuer",
    ar: "متابعة",
    en: "Continue",
  },
  fpSending: {
    fr: "Envoi du code…",
    ar: "جارٍ الإرسال…",
    en: "Sending…",
  },
  fpCodeSentTo: {
    fr: "Code envoyé à",
    ar: "تم إرسال الرمز إلى",
    en: "Code sent to",
  },
  fpNewPwSubtitle: {
    fr: "8 caractères minimum.",
    ar: "8 أحرف على الأقل.",
    en: "At least 8 characters.",
  },
  fpNewPassword: {
    fr: "Nouveau mot de passe",
    ar: "كلمة المرور الجديدة",
    en: "New password",
  },
  fpResetBtn: {
    fr: "Réinitialiser le mot de passe",
    ar: "إعادة تعيين كلمة المرور",
    en: "Reset password",
  },
  fpResetting: {
    fr: "Réinitialisation…",
    ar: "جارٍ إعادة التعيين…",
    en: "Resetting…",
  },
  fpResetSuccess: {
    fr: "Mot de passe réinitialisé ! Connecte-toi avec ton nouveau mot de passe.",
    ar: "تمت إعادة تعيين كلمة المرور! سجّل الدخول بكلمة المرور الجديدة.",
    en: "Password reset! Sign in with your new password.",
  },
  fpBackToLogin: {
    fr: "Retour à la connexion",
    ar: "العودة إلى تسجيل الدخول",
    en: "Back to sign in",
  },
  fpChangeEmail: {
    fr: "Ce n'est pas mon email — changer",
    ar: "تغيير البريد",
    en: "Not my email",
  },
  fpErrEmail: {
    fr: "Entre ton adresse email.",
    ar: "أدخل بريدك الإلكتروني.",
    en: "Enter your email address.",
  },
  fpErrPwShort: {
    fr: "Le mot de passe doit contenir au moins 8 caractères.",
    ar: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.",
    en: "Password must be at least 8 characters.",
  },
  fpErrPwMismatch: {
    fr: "Les mots de passe ne correspondent pas.",
    ar: "كلمتا المرور غير متطابقتين.",
    en: "Passwords do not match.",
  },
  fpErrTokenExpired: {
    fr: "Le lien a expiré. Recommence depuis le début.",
    ar: "انتهت صلاحية الرابط. ابدأ من جديد.",
    en: "Link expired. Start over.",
  },
  fpErrGeneric: {
    fr: "Une erreur est survenue.",
    ar: "حدث خطأ ما.",
    en: "Something went wrong.",
  },
  // Password strength
  pwWeak: {
    fr: "Faible",
    ar: "ضعيفة",
    en: "Weak",
  },
  pwMedium: {
    fr: "Moyen",
    ar: "متوسطة",
    en: "Medium",
  },
  pwStrong: {
    fr: "Fort",
    ar: "قوية",
    en: "Strong",
  },
  pwVeryStrong: {
    fr: "Très fort",
    ar: "قوية جداً",
    en: "Very strong",
  },
  pwHint: {
    fr: "Mélange majuscules, minuscules, chiffres et symboles.",
    ar: "امزج الأحرف الكبيرة والصغيرة والأرقام والرموز.",
    en: "Mix uppercase, lowercase, numbers and symbols.",
  },
  authPwPlaceholder: {
    fr: "8 caractères minimum",
    ar: "8 أحرف على الأقل",
    en: "At least 8 characters",
  },
  authEmailPlaceholder: {
    fr: "vous@exemple.com",
    ar: "you@example.com",
    en: "you@example.com",
  },
  // Dashboard
  dashGreeting: {
    fr: "Salam,",
    ar: "مرحباً،",
    en: "Hello,",
  },
  dashKpiVideoScripts: {
    fr: "Scripts vidéo",
    ar: "نصوص الفيديو",
    en: "Video scripts",
  },
  dashKpiLandingPages: {
    fr: "Landing pages",
    ar: "صفحات الهبوط",
    en: "Landing pages",
  },
  dashKpiTotalGen: {
    fr: "Générations IA",
    ar: "توليدات الذكاء الاصطناعي",
    en: "AI generations",
  },
  dashKpiProducts: {
    fr: "Produits Gagnants",
    ar: "المنتجات الرابحة",
    en: "Winning Products",
  },
  dashViewAll: {
    fr: "Tout voir",
    ar: "عرض الكل",
    en: "View all",
  },
  dashActionScout: {
    fr: "Scout Telegram",
    ar: "مستكشف تلغرام",
    en: "Telegram Scout",
  },
  dashOpen: {
    fr: "Ouvrir",
    ar: "فتح",
    en: "Open",
  },
  // Dashboard LP Generator
  dashLpProductName: {
    fr: "Nom du produit",
    ar: "اسم المنتج",
    en: "Product name",
  },
  dashLpSections: {
    fr: "sections",
    ar: "أقسام",
    en: "sections",
  },
  dashLpCollapse: {
    fr: "Masquer",
    ar: "إخفاء",
    en: "Hide",
  },

  // Page builder
  pbUploadTitle: {
    fr: "Dépose tes sections ici",
    ar: "أسقط الأقسام هنا",
    en: "Drop your sections here",
  },
  pbUploadHint: {
    fr: "Images de landing page (PNG, JPG, WebP)",
    ar: "صور صفحة الهبوط (PNG, JPG, WebP)",
    en: "Landing page images (PNG, JPG, WebP)",
  },
  pbUploadBtn: {
    fr: "Importer des Sections",
    ar: "استيراد الأقسام",
    en: "Import Sections",
  },
  pbSections: {
    fr: "sections",
    ar: "أقسام",
    en: "sections",
  },
  pbReset: {
    fr: "Réinitialiser",
    ar: "إعادة تعيين",
    en: "Reset",
  },
  pbMobile: {
    fr: "Mobile",
    ar: "موبايل",
    en: "Mobile",
  },
  pbDownload: {
    fr: "Télécharger",
    ar: "تحميل",
    en: "Download",
  },
  pbRemove: {
    fr: "Supprimer",
    ar: "حذف",
    en: "Remove",
  },
  pbDragHint: {
    fr: "Glisser pour réorganiser",
    ar: "اسحب لإعادة الترتيب",
    en: "Drag to reorder",
  },

  // Landing page (EcomFlow AI)
  lpNavPricing: {
    fr: "Tarifs",
    ar: "الأسعار",
    en: "Pricing",
  },
  lpNavLogin: {
    fr: "Se connecter",
    ar: "تسجيل الدخول",
    en: "Log in",
  },
  lpNavGetStarted: {
    fr: "Créer un compte",
    ar: "ابدأ الآن",
    en: "Get Started",
  },
  lpKpiProducts: {
    fr: "Produits",
    ar: "المنتجات",
    en: "Products",
  },
  lpKpiAnalysis: {
    fr: "Analyse IA",
    ar: "التحليل بالذكاء الاصطناعي",
    en: "AI Analysis",
  },
  lpKpiCampaigns: {
    fr: "Campagnes",
    ar: "الحملات",
    en: "Campaigns",
  },
  freeTrialAnnouncementTitle: {
    fr: "🎁 Offre Spéciale : 7 Jours d'Essai Gratuit !",
    ar: "🎁 عرض خاص: 7 أيام تجربة مجانية!",
    en: "🎁 Special Offer: 7-Day Free Trial!",
  },
  freeTrialAnnouncementMessage: {
    fr: "Profitez de 7 jours d'accès gratuit et illimité à tous nos outils IA e-commerce pour tester et booster vos ventes dès aujourd'hui. Pour en profiter, contactez-nous sur WhatsApp !",
    ar: "استمتع بـ 7 أيام من الوصول الكامل والمجاني إلى جميع أدوات الذكاء الاصطناعي لتجربتها وزيادة مبيعاتك اليوم. للحصول على العرض، تواصل معنا عبر WhatsApp!",
    en: "Enjoy 7 days of full free access to all our e-commerce AI tools to test and boost your sales today. To claim it, contact us on WhatsApp!",
  },
  contactUsOnWhatsApp: {
    fr: "Contactez-nous sur WhatsApp",
    ar: "تواصل معنا عبر WhatsApp",
    en: "Contact us on WhatsApp",
  },
  dashGuidesTitle: {
    fr: "Guides & Tutoriels Vidéo",
    ar: "الشروحات والفيديوهات التعليمية",
    en: "Video Guides & Tutorials",
  },
  watchOnYouTube: {
    fr: "Regarder la vidéo",
    ar: "مشاهدة الفيديو",
    en: "Watch Video",
  },
  openYouTubeLink: {
    fr: "Ouvrir dans YouTube",
    ar: "فتح في YouTube",
    en: "Open in YouTube",
  },
  menuProjects: {
    fr: "Campagnes",
    ar: "الحملات",
    en: "Campaigns",
  },
  menuAds: {
    fr: "Publicités",
    ar: "الإعلانات",
    en: "Ads",
  },
  menuBrand: {
    fr: "Identité de marque",
    ar: "هوية العلامة",
    en: "Brand kit",
  },
  menuAssets: {
    fr: "Fichiers",
    ar: "الملفات",
    en: "Assets",
  },
  navGroupWorkspace: {
    fr: "Espace de travail",
    ar: "مساحة العمل",
    en: "Workspace",
  },
  navGroupStudios: {
    fr: "Studios",
    ar: "الاستوديوهات",
    en: "Studios",
  },
  navGroupLibrary: {
    fr: "Bibliothèque",
    ar: "المكتبة",
    en: "Library",
  },
  navGroupTools: {
    fr: "Outils",
    ar: "الأدوات",
    en: "Tools",
  },
  navNewCampaign: {
    fr: "Nouvelle campagne",
    ar: "حملة جديدة",
    en: "New campaign",
  },
  dashAttNoPlan: {
    fr: "Aucun abonnement actif : la génération IA est verrouillée.",
    ar: "لا يوجد اشتراك نشط: الإنشاء بالذكاء الاصطناعي مقفل.",
    en: "No active plan: AI generation is locked.",
  },
  dashAttPending: {
    fr: "Ton paiement est en cours de vérification par un admin.",
    ar: "دفعتك قيد المراجعة من طرف المشرف.",
    en: "An admin is checking your payment.",
  },
  dashRenew: {
    fr: "Renouveler",
    ar: "تجديد",
    en: "Renew",
  },
  dashAttEnding: {
    fr: "Ton abonnement se termine le {date}.",
    ar: "ينتهي اشتراكك في {date}.",
    en: "Your plan ends on {date}.",
  },
  dashAttNoKey: {
    fr: "Ajoute ta clé Gemini : sans elle, l’IA ne peut rien générer.",
    ar: "أضف مفتاح Gemini الخاص بك: بدونه لا يستطيع الذكاء الاصطناعي إنشاء أي شيء.",
    en: "Add your Gemini key: without it, the AI can’t generate anything.",
  },
  dashAttMissing: {
    fr: "« {name} » n’a pas encore : {missing}.",
    ar: "ما زال ينقص حملة «{name}»: {missing}.",
    en: "“{name}” is still missing: {missing}.",
  },
  dashAttBrand: {
    fr: "Ajoute ton logo et tes couleurs pour que tout ce que l’IA crée te ressemble.",
    ar: "أضف شعارك وألوانك ليشبه علامتك كل ما يُنشئه الذكاء الاصطناعي.",
    en: "Add your logo and colors so everything the AI makes looks like your brand.",
  },
  dashAttMeta: {
    fr: "Connecte Meta pour publier tes campagnes depuis l’app.",
    ar: "اربط Meta لنشر حملاتك من التطبيق مباشرة.",
    en: "Connect Meta to publish your campaigns from the app.",
  },
  dashHeroTitle: {
    fr: "Que veux-tu vendre aujourd’hui ?",
    ar: "ماذا تريد أن تبيع اليوم؟",
    en: "What do you want to sell today?",
  },
  dashHeroText: {
    fr: "Dépose les photos de ton produit. L’IA prépare la landing page, la vidéo et les publicités, toutes avec la même marque et le même message.",
    ar: "ضع صور منتجك، وسيُحضّر الذكاء الاصطناعي صفحة الهبوط والفيديو والإعلانات، كلها بنفس العلامة ونفس الرسالة.",
    en: "Drop your product photos. The AI prepares the landing page, the video and the ads, all with the same brand and the same message.",
  },
  dashStartWithout: {
    fr: "Commencer sans photo",
    ar: "البدء بدون صورة",
    en: "Start without a photo",
  },
  dashDropPhotos: {
    fr: "Dépose les photos du produit",
    ar: "ضع صور المنتج هنا",
    en: "Drop the product photos",
  },
  dashRecent: {
    fr: "Campagnes récentes",
    ar: "الحملات الأخيرة",
    en: "Recent campaigns",
  },
  dashNoCampaign: {
    fr: "Pas encore de campagne.",
    ar: "لا توجد حملة بعد.",
    en: "No campaign yet.",
  },
  dashNoCampaignText: {
    fr: "Ta première campagne apparaîtra ici avec sa landing page, sa vidéo et ses publicités.",
    ar: "ستظهر حملتك الأولى هنا مع صفحة الهبوط والفيديو والإعلانات الخاصة بها.",
    en: "Your first campaign will show up here with its landing page, video and ads.",
  },
  dashAttention: {
    fr: "À faire",
    ar: "ما يجب فعله",
    en: "To do",
  },
  dashAllGood: {
    fr: "Tout est prêt. Crée une nouvelle campagne quand tu veux.",
    ar: "كل شيء جاهز. أنشئ حملة جديدة متى شئت.",
    en: "Everything is set up. Create a new campaign whenever you like.",
  },
  dashActivity: {
    fr: "Ton activité",
    ar: "نشاطك",
    en: "Your activity",
  },
  dashStudios: {
    fr: "Studios et outils",
    ar: "الاستوديوهات والأدوات",
    en: "Studios and tools",
  },
};

registerTranslations('core', coreTranslations);
