import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// home: the public home page (loaded with it, not by the app).
export const homeTranslations: TranslationDictionary = {
  homeNavHow: {
    fr: "Comment ça marche",
    ar: "كيف يعمل",
    en: "How it works",
  },
  homeNavStudios: {
    fr: "Studios",
    ar: "الاستوديوهات",
    en: "Studios",
  },
  homeNavPricing: {
    fr: "Tarifs",
    ar: "الأسعار",
    en: "Pricing",
  },
  homeNavFaq: {
    fr: "Questions fréquentes",
    ar: "أسئلة شائعة",
    en: "FAQ",
  },
  homeHeroHeadline: {
    fr: "Une photo. Toute la campagne.",
    ar: "صورة واحدة. حملة كاملة.",
    en: "One photo. A whole campaign.",
  },
  homeHeroSide: {
    fr: "Pensé pour la vente en paiement à la livraison en Algérie. Chaque campagne garde ses photos, son brief et toutes ses versions, et rien n’est publié sans ton accord.",
    ar: "مصمَّم للبيع بالدفع عند الاستلام في الجزائر. تحتفظ كل حملة بصورها وملخّصها وكل نسخها، ولا يُنشر شيء دون موافقتك.",
    en: "Built for cash-on-delivery selling in Algeria. Every campaign keeps its photos, its brief and every version, and nothing goes live without your approval.",
  },
  homeHeroFacts: {
    fr: "En bref",
    ar: "باختصار",
    en: "In short",
  },
  homeStatWilayas: {
    fr: "wilayas dans chaque formulaire de commande",
    ar: "ولاية في كل استمارة طلب",
    en: "wilayas in every order form",
  },
  homeStatFormats: {
    fr: "formats vidéo, de la story au plein écran",
    ar: "صيغ فيديو، من الستوري إلى الشاشة الكاملة",
    en: "video formats, from story to widescreen",
  },
  homeStatLangs: {
    fr: "langues : arabe, français et anglais",
    ar: "لغات: العربية والفرنسية والإنجليزية",
    en: "languages: Arabic, French and English",
  },
  homeMenu: {
    fr: "Menu",
    ar: "القائمة",
    en: "Menu",
  },
  homeHeroLead: {
    fr: "Dépose les photos de ton produit. EcomFlow AI écrit la landing page, le script vidéo et les publicités, aux couleurs de ta marque, en arabe, en français ou en anglais.",
    ar: "ضع صور منتجك، ويكتب EcomFlow AI صفحة الهبوط وسيناريو الفيديو والإعلانات بألوان علامتك، بالعربية أو الفرنسية أو الإنجليزية.",
    en: "Drop in your product photos. EcomFlow AI writes the landing page, the video script and the ads in your brand colors, in Arabic, French or English.",
  },
  homeCtaStart: {
    fr: "Créer mon compte",
    ar: "إنشاء حسابي",
    en: "Create my account",
  },
  homeCtaHow: {
    fr: "Voir le parcours",
    ar: "شاهد المسار",
    en: "See the workflow",
  },
  homeDemoVideo: {
    fr: "Vidéo",
    ar: "الفيديو",
    en: "Video",
  },
  homeDemoAds: {
    fr: "Publicités",
    ar: "الإعلانات",
    en: "Ads",
  },
  homeDemoHeadline: {
    fr: "Une lumière douce pour chaque soir",
    ar: "ضوء هادئ لكل مساء",
    en: "Soft light for every evening",
  },
  homeDemoOrder: {
    fr: "Commander",
    ar: "اطلب الآن",
    en: "Order now",
  },
  homeDemoShop: {
    fr: "Acheter",
    ar: "اشترِ الآن",
    en: "Shop now",
  },
  homeDemoScene1: {
    fr: "Accroche",
    ar: "عنصر الجذب",
    en: "Hook",
  },
  homeDemoScene2: {
    fr: "Démonstration",
    ar: "التجربة",
    en: "Demo",
  },
  homeDemoScene3: {
    fr: "Offre",
    ar: "العرض",
    en: "Offer",
  },
  homeFlowTitle: {
    fr: "Du brief à la mise en ligne, au même endroit.",
    ar: "من الملخص إلى النشر، في مكان واحد.",
    en: "From brief to launch, in one place.",
  },
  homeFlowIntro: {
    fr: "Chaque campagne garde ses photos, son brief et toutes les versions de ses contenus : tu peux régénérer, retoucher ou revenir en arrière à tout moment.",
    ar: "تحتفظ كل حملة بصورها وملخصها وكل نسخ محتوياتها: يمكنك إعادة الإنشاء أو التعديل أو الرجوع إلى نسخة سابقة في أي وقت.",
    en: "Every campaign keeps its photos, its brief and every version of its content: regenerate, edit or roll back at any time.",
  },
  homeStep1Title: {
    fr: "Le brief",
    ar: "الملخص",
    en: "The brief",
  },
  homeStep1Text: {
    fr: "Ajoute jusqu’à 8 photos. L’IA peut remplir le nom, les avantages, le public et le ton à partir de la première.",
    ar: "أضف حتى 8 صور. يمكن للذكاء الاصطناعي ملء الاسم والمزايا والجمهور والنبرة انطلاقاً من الصورة الأولى.",
    en: "Add up to 8 photos. The AI can fill in the name, benefits, audience and tone from the first one.",
  },
  homeStep2Title: {
    fr: "La génération",
    ar: "الإنشاء",
    en: "Generation",
  },
  homeStep2Text: {
    fr: "Landing page, script vidéo et publicités partent du même brief et de ton identité de marque. Chacun peut être relancé seul.",
    ar: "تنطلق صفحة الهبوط وسيناريو الفيديو والإعلانات من نفس الملخص ومن هوية علامتك، ويمكن إعادة إنشاء كل منها على حدة.",
    en: "The landing page, video script and ads all start from the same brief and your brand identity. Each one can be regenerated on its own.",
  },
  homeStep3Title: {
    fr: "La retouche",
    ar: "التعديل",
    en: "Refinement",
  },
  homeStep3Text: {
    fr: "Modifie les textes, réordonne les sections, change de format. Chaque génération est gardée comme une version.",
    ar: "عدّل النصوص، وأعد ترتيب الأقسام، وغيّر الصيغة. يُحفظ كل إنشاء كنسخة.",
    en: "Edit the copy, reorder sections, switch formats. Every generation is kept as a version.",
  },
  homeStep4Title: {
    fr: "L’export",
    ar: "التصدير",
    en: "Export",
  },
  homeStep4Text: {
    fr: "Télécharge la page HTML, la vidéo, les visuels et les textes publicitaires en CSV.",
    ar: "حمّل صفحة HTML والفيديو والتصاميم والنصوص الإعلانية بصيغة CSV.",
    en: "Download the HTML page, the video, the visuals and the ad copy as CSV.",
  },
  homeStep4TextMeta: {
    fr: "Télécharge tout, ou crée la campagne sur Facebook et Instagram : elle reste en pause jusqu’à ta confirmation.",
    ar: "حمّل كل شيء، أو أنشئ الحملة على فيسبوك وإنستغرام: تبقى متوقفة حتى تؤكدها.",
    en: "Download everything, or create the campaign on Facebook and Instagram: it stays paused until you confirm.",
  },
  homeStudiosTitle: {
    fr: "Trois studios, une seule marque.",
    ar: "ثلاثة استوديوهات، علامة واحدة.",
    en: "Three studios, one brand.",
  },
  homeLandingTitle: {
    fr: "Une page de vente prête pour le paiement à la livraison",
    ar: "صفحة بيع جاهزة للدفع عند الاستلام",
    en: "A sales page ready for cash on delivery",
  },
  homeLandingText: {
    fr: "Des textes écrits pour ton produit et ton public, et un formulaire de commande avec les 58 wilayas. Les commandes arrivent sur ton WhatsApp ou sur ton propre webhook.",
    ar: "نصوص مكتوبة لمنتجك وجمهورك، واستمارة طلب تضم 58 ولاية. تصلك الطلبات على واتساب أو على رابط webhook الخاص بك.",
    en: "Copy written for your product and audience, plus an order form with all 58 wilayas. Orders arrive on your WhatsApp or your own webhook.",
  },
  homeLandingPoint1: {
    fr: "Arabe et darija, français ou anglais",
    ar: "العربية والدارجة، أو الفرنسية، أو الإنجليزية",
    en: "Arabic and Darja, French or English",
  },
  homeLandingPoint2: {
    fr: "Sections à réécrire, réordonner ou retirer",
    ar: "أقسام يمكن إعادة كتابتها أو ترتيبها أو حذفها",
    en: "Sections you can rewrite, reorder or remove",
  },
  homeLandingPoint3: {
    fr: "Une page HTML autonome, à héberger où tu veux",
    ar: "صفحة HTML مستقلة تستضيفها أينما شئت",
    en: "A standalone HTML page you can host anywhere",
  },
  homeLandingSection1: {
    fr: "Accroche",
    ar: "عنصر الجذب",
    en: "Hook",
  },
  homeLandingSection2: {
    fr: "Avantages",
    ar: "المزايا",
    en: "Benefits",
  },
  homeLandingSection3: {
    fr: "Mode d’emploi",
    ar: "طريقة الاستعمال",
    en: "How to use",
  },
  homeLandingSection4: {
    fr: "Questions",
    ar: "الأسئلة",
    en: "Questions",
  },
  homeLandingSection5: {
    fr: "Bon de commande",
    ar: "استمارة الطلب",
    en: "Order form",
  },
  homeLandingWilaya: {
    fr: "Wilaya",
    ar: "الولاية",
    en: "Province",
  },
  homeLandingWilayaValue: {
    fr: "16 · Alger",
    ar: "16 · الجزائر",
    en: "16 · Algiers",
  },
  homeVideoTitle: {
    fr: "Un script scène par scène, puis la vidéo",
    ar: "سيناريو مشهداً بمشهد، ثم الفيديو",
    en: "A scene-by-scene script, then the video",
  },
  homeVideoText: {
    fr: "L’IA écrit l’accroche, les scènes et le texte à l’écran. La vidéo est ensuite montée dans ton navigateur à partir de tes photos.",
    ar: "يكتب الذكاء الاصطناعي جملة الجذب والمشاهد والنص الظاهر على الشاشة، ثم يُركَّب الفيديو في متصفحك انطلاقاً من صورك.",
    en: "The AI writes the hook, the scenes and the on-screen text. The video is then put together in your browser from your photos.",
  },
  homeVideoPoint1: {
    fr: "Formats 9:16, 4:5, 1:1 et 16:9",
    ar: "صيغ 9:16 و4:5 و1:1 و16:9",
    en: "9:16, 4:5, 1:1 and 16:9 formats",
  },
  homeVideoPoint2: {
    fr: "Export MP4 (ou WebM selon le navigateur), sans bande son",
    ar: "تصدير MP4 (أو WebM حسب المتصفح)، بدون صوت",
    en: "MP4 export (or WebM depending on the browser), without sound",
  },
  homeVideoPoint3: {
    fr: "Plans vidéo générés par IA (Veo) en option, avec la facturation Google",
    ar: "لقطات فيديو بالذكاء الاصطناعي (Veo) اختيارية، مع تفعيل الفوترة لدى Google",
    en: "Optional AI video clips (Veo), with Google billing enabled",
  },
  homeAdsTitle: {
    fr: "Des concepts publicitaires et leurs visuels",
    ar: "أفكار إعلانية مع تصاميمها",
    en: "Ad concepts with their visuals",
  },
  homeAdsText: {
    fr: "Plusieurs angles, chacun avec son texte principal, son titre, sa description et son bouton d’action. Les visuels sont composés avec tes photos et tes couleurs.",
    ar: "عدة زوايا، لكل منها نصها الرئيسي وعنوانها ووصفها وزر الإجراء الخاص بها. تُصمَّم الصور بصورك وألوانك.",
    en: "Several angles, each with its primary text, headline, description and call-to-action button. The visuals are composed with your photos and colors.",
  },
  homeAdsPoint1: {
    fr: "Carré, portrait et story, avec zone de sécurité",
    ar: "مربع وعمودي وستوري، مع منطقة آمنة",
    en: "Square, portrait and story, with a safe zone",
  },
  homeAdsPoint2: {
    fr: "Textes exportables en CSV",
    ar: "نصوص قابلة للتصدير بصيغة CSV",
    en: "Copy exportable as CSV",
  },
  homeAdsPoint3: {
    fr: "Visuels enregistrés dans ta bibliothèque",
    ar: "تصاميم تُحفظ في مكتبتك",
    en: "Visuals saved to your library",
  },
  homeBrandTitle: {
    fr: "Ton identité de marque, appliquée partout",
    ar: "هوية علامتك، في كل مكان",
    en: "Your brand identity, everywhere",
  },
  homeBrandText: {
    fr: "Logo, couleurs, polices, ton et public : l’IA les reprend dans chaque landing page, chaque script et chaque publicité.",
    ar: "الشعار والألوان والخطوط والنبرة والجمهور: يعتمدها الذكاء الاصطناعي في كل صفحة هبوط وكل سيناريو وكل إعلان.",
    en: "Logo, colors, fonts, tone and audience: the AI carries them into every landing page, script and ad.",
  },
  homeBrandTone: {
    fr: "Chaleureux · premium",
    ar: "دافئ · فاخر",
    en: "Warm · premium",
  },
  homeLibraryTitle: {
    fr: "Tous tes fichiers au même endroit",
    ar: "كل ملفاتك في مكان واحد",
    en: "All your files in one place",
  },
  homeLibraryText: {
    fr: "Photos produit, logos et visuels générés, rangés par campagne et prêts à être réutilisés.",
    ar: "صور المنتجات والشعارات والتصاميم المُنشأة، مرتبة حسب الحملة وجاهزة لإعادة الاستخدام.",
    en: "Product photos, logos and generated visuals, sorted by campaign and ready to reuse.",
  },
  homeMetaTitle: {
    fr: "Publie sur Facebook et Instagram sans perdre la main",
    ar: "انشر على فيسبوك وإنستغرام دون أن تفقد السيطرة",
    en: "Publish to Facebook and Instagram and stay in control",
  },
  homeMetaText: {
    fr: "Connecte ton compte publicitaire avec la connexion officielle de Meta. La campagne et ses annonces sont créées en pause : tu vérifies le budget, les dates et le ciblage avant d’activer.",
    ar: "اربط حسابك الإعلاني عبر تسجيل الدخول الرسمي من Meta. تُنشأ الحملة وإعلاناتها متوقفة: تراجع الميزانية والتواريخ والاستهداف قبل التفعيل.",
    en: "Connect your ad account through Meta’s official login. The campaign and its ads are created paused: you check the budget, dates and targeting before turning it on.",
  },
  homeMetaPoint1: {
    fr: "Connexion officielle, aucun mot de passe partagé",
    ar: "تسجيل دخول رسمي، دون مشاركة أي كلمة مرور",
    en: "Official login, no password shared",
  },
  homeMetaPoint2: {
    fr: "Activation seulement après ta confirmation",
    ar: "لا تفعيل إلا بعد تأكيدك",
    en: "Turned on only after you confirm",
  },
  homeMetaPoint3: {
    fr: "Statut et statistiques lus directement chez Meta",
    ar: "الحالة والإحصائيات تُقرأ مباشرة من Meta",
    en: "Status and stats read straight from Meta",
  },
  homeMetaCardTitle: {
    fr: "Avant d’activer",
    ar: "قبل التفعيل",
    en: "Before going live",
  },
  homeMetaBudget: {
    fr: "Budget quotidien",
    ar: "الميزانية اليومية",
    en: "Daily budget",
  },
  homeMetaCountry: {
    fr: "Pays ciblé",
    ar: "البلد المستهدف",
    en: "Target country",
  },
  homeMetaCountryValue: {
    fr: "Algérie",
    ar: "الجزائر",
    en: "Algeria",
  },
  homeMetaAge: {
    fr: "Âge",
    ar: "العمر",
    en: "Age",
  },
  homeMetaStatus: {
    fr: "Statut",
    ar: "الحالة",
    en: "Status",
  },
  homeMetaPaused: {
    fr: "En pause",
    ar: "متوقفة",
    en: "Paused",
  },
  homeMetaCheck: {
    fr: "J’ai vérifié ces réglages",
    ar: "راجعتُ هذه الإعدادات",
    en: "I have checked these settings",
  },
  homeMetaActivate: {
    fr: "Activer",
    ar: "تفعيل",
    en: "Turn on",
  },
  homePriceTitle: {
    fr: "Un abonnement, tous les studios.",
    ar: "اشتراك واحد، كل الاستوديوهات.",
    en: "One plan, every studio.",
  },
  homePriceSub: {
    fr: "Tu paies localement, tu envoies le justificatif depuis l’app, et un admin active ton accès.",
    ar: "تدفع محلياً، وترسل إثبات الدفع من التطبيق، ثم يفعّل المشرف وصولك.",
    en: "Pay locally, send the receipt from the app, and an admin turns on your access.",
  },
  homePriceFeat1: {
    fr: "Landing pages, vidéos et publicités",
    ar: "صفحات الهبوط والفيديوهات والإعلانات",
    en: "Landing pages, videos and ads",
  },
  homePriceFeat2: {
    fr: "Identité de marque et bibliothèque de fichiers",
    ar: "هوية العلامة ومكتبة الملفات",
    en: "Brand kit and file library",
  },
  homePriceFeat3: {
    fr: "Calcul de marge COD et constructeur de page",
    ar: "حاسبة أرباح COD وباني الصفحات",
    en: "COD margin calculator and page builder",
  },
  homePriceSubscribe: {
    fr: "Choisir ce plan",
    ar: "اختر هذه الخطة",
    en: "Choose this plan",
  },
  homePriceKeyNote: {
    fr: "La génération utilise ta propre clé Gemini (Google AI Studio). La clé gratuite suffit pour les textes ; les images et les clips vidéo IA demandent la facturation Google.",
    ar: "يستخدم الإنشاء مفتاح Gemini الخاص بك (Google AI Studio). المفتاح المجاني يكفي للنصوص، أما الصور ولقطات الفيديو بالذكاء الاصطناعي فتتطلب تفعيل الفوترة لدى Google.",
    en: "Generation uses your own Gemini key (Google AI Studio). The free key covers text; AI images and video clips need Google billing.",
  },
  homeFaq1Q: {
    fr: "Faut-il savoir designer ou écrire des pubs ?",
    ar: "هل يجب أن أعرف التصميم أو كتابة الإعلانات؟",
    en: "Do I need design or copywriting skills?",
  },
  homeFaq1A: {
    fr: "Non. Tu fournis les photos et quelques informations, puis tu relis et ajustes ce que l’IA propose.",
    ar: "لا. تقدّم الصور وبعض المعلومات، ثم تراجع ما يقترحه الذكاء الاصطناعي وتعدّله.",
    en: "No. You provide the photos and a few details, then review and adjust what the AI suggests.",
  },
  homeFaq2Q: {
    fr: "Quelle clé IA faut-il ?",
    ar: "ما مفتاح الذكاء الاصطناعي المطلوب؟",
    en: "Which AI key do I need?",
  },
  homeFaq2A: {
    fr: "Une clé Gemini, créée gratuitement sur Google AI Studio. Elle est enregistrée chiffrée dans ton compte et n’est jamais réaffichée en entier.",
    ar: "مفتاح Gemini تنشئه مجاناً على Google AI Studio. يُحفظ مشفّراً في حسابك ولا يُعرض كاملاً مرة أخرى.",
    en: "A Gemini key, created for free in Google AI Studio. It is stored encrypted in your account and never shown in full again.",
  },
  homeFaq3Q: {
    fr: "Mes publicités partent-elles toutes seules ?",
    ar: "هل تُنشر إعلاناتي تلقائياً؟",
    en: "Do my ads go live on their own?",
  },
  homeFaq3A: {
    fr: "Non. Tu télécharges tes contenus et tu les publies toi-même, quand tu veux.",
    ar: "لا. تحمّل محتوياتك وتنشرها بنفسك، متى شئت.",
    en: "No. You download your content and publish it yourself, whenever you want.",
  },
  homeFaq3AMeta: {
    fr: "Non. Tu télécharges tes contenus, ou tu crées la campagne depuis l’app : elle reste en pause tant que tu ne l’as pas activée.",
    ar: "لا. تحمّل محتوياتك، أو تنشئ الحملة من التطبيق: تبقى متوقفة ما لم تفعّلها.",
    en: "No. You download your content, or create the campaign from the app: it stays paused until you turn it on.",
  },
  homeFaq4Q: {
    fr: "Comment se passe le paiement ?",
    ar: "كيف يتم الدفع؟",
    en: "How does payment work?",
  },
  homeFaq4A: {
    fr: "Tu choisis un plan, tu paies avec l’un des moyens indiqués, puis tu envoies le justificatif depuis l’app. Un admin le vérifie et active ton accès.",
    ar: "تختار خطة، وتدفع بإحدى الطرق المعروضة، ثم ترسل إثبات الدفع من التطبيق. يتحقق منه المشرف ويفعّل وصولك.",
    en: "Pick a plan, pay with one of the listed methods, then send the receipt from the app. An admin checks it and turns on your access.",
  },
  homeFaq5Q: {
    fr: "Dans quelles langues ?",
    ar: "بأي لغات؟",
    en: "In which languages?",
  },
  homeFaq5A: {
    fr: "L’interface et les contenus générés existent en arabe, en français et en anglais. Chaque campagne choisit sa propre langue.",
    ar: "الواجهة والمحتوى المُنشأ متوفران بالعربية والفرنسية والإنجليزية، ولكل حملة لغتها الخاصة.",
    en: "The interface and the generated content come in Arabic, French and English. Each campaign picks its own language.",
  },
  homeFaq6Q: {
    fr: "Mes données sont-elles séparées de celles des autres ?",
    ar: "هل بياناتي منفصلة عن بيانات الآخرين؟",
    en: "Is my data kept apart from other accounts?",
  },
  homeFaq6A: {
    fr: "Oui. Chaque campagne, fichier et connexion appartient à ton compte, et le serveur vérifie le propriétaire à chaque requête.",
    ar: "نعم. كل حملة وملف واتصال يخص حسابك، ويتحقق الخادم من المالك في كل طلب.",
    en: "Yes. Every campaign, file and connection belongs to your account, and the server checks the owner on every request.",
  },
  homeFinalTitle: {
    fr: "Ton prochain produit mérite une vraie campagne.",
    ar: "منتجك القادم يستحق حملة حقيقية.",
    en: "Your next product deserves a real campaign.",
  },
  homeFinalText: {
    fr: "Crée ton compte, ajoute ta clé Gemini et lance ta première campagne à partir d’une photo.",
    ar: "أنشئ حسابك، وأضف مفتاح Gemini، وابدأ حملتك الأولى من صورة واحدة.",
    en: "Create your account, add your Gemini key and start your first campaign from a single photo.",
  },
  homeFooterTagline: {
    fr: "Campagnes e-commerce assistées par l’IA, pensées pour l’Algérie.",
    ar: "حملات تجارة إلكترونية بمساعدة الذكاء الاصطناعي، مصممة للجزائر.",
    en: "AI-assisted e-commerce campaigns, built for Algeria.",
  },
  homeMenuOpen: {
    fr: "Ouvrir le menu",
    ar: "فتح القائمة",
    en: "Open menu",
  },
  homeMenuClose: {
    fr: "Fermer le menu",
    ar: "إغلاق القائمة",
    en: "Close menu",
  },
  homeNavLabel: {
    fr: "Sections",
    ar: "الأقسام",
    en: "Sections",
  },
};

registerTranslations('home', homeTranslations);
