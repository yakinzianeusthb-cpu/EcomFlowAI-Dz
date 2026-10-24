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
    fr: "Pensé pour la vente en paiement à la livraison en Algérie. Tes pages et tes vidéos restent dans ton historique, et rien n’est publié sans ton accord.",
    ar: "مصمم للبيع بالدفع عند الاستلام في الجزائر. تبقى صفحاتك وفيديوهاتك في سجلك، ولا يُنشر شيء دون موافقتك.",
    en: "Built for cash-on-delivery selling in Algeria. Your pages and videos stay in your history, and nothing is published without your consent.",
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
    fr: "Tes landing pages et tes scripts vidéo restent dans ton historique : tu peux régénérer, retoucher ou y revenir à tout moment.",
    ar: "تبقى صفحات الهبوط وسيناريوهات الفيديو في سجلك: يمكنك إعادة إنشائها أو تعديلها أو الرجوع إليها في أي وقت.",
    en: "Your landing pages and video scripts stay in your history: you can regenerate, edit or come back to them at any time.",
  },
  homeStep1Title: {
    fr: "Le produit",
    ar: "المنتج",
    en: "The product",
  },
  homeStep1Text: {
    fr: "Ajoute les photos de ton produit et quelques infos : son nom, son prix, ses avantages et ton public.",
    ar: "أضف صور منتجك وبعض المعلومات: اسمه وسعره ومزاياه وجمهورك.",
    en: "Add your product photos and a few details: its name, price, benefits and your audience.",
  },
  homeStep2Title: {
    fr: "La génération",
    ar: "الإنشاء",
    en: "Generation",
  },
  homeStep2Text: {
    fr: "L’IA écrit ta landing page section par section, et le script de ta pub vidéo scène par scène.",
    ar: "يكتب الذكاء الاصطناعي صفحة الهبوط قسماً بقسم، وسيناريو إعلان الفيديو مشهداً بمشهد.",
    en: "The AI writes your landing page section by section, and your video ad script scene by scene.",
  },
  homeStep3Title: {
    fr: "Les images",
    ar: "الصور",
    en: "The images",
  },
  homeStep3Text: {
    fr: "Pour chaque section, crée l’image ici en voyant son coût, ou copie le prompt pour la faire avec un autre outil.",
    ar: "لكل قسم، أنشئ الصورة هنا مع رؤية تكلفتها، أو انسخ الوصف لتنشئها بأداة أخرى.",
    en: "For each section, create the image here and see its cost, or copy the prompt to make it with another tool.",
  },
  homeStep4Title: {
    fr: "L’export",
    ar: "التصدير",
    en: "Export",
  },
  homeStep4Text: {
    fr: "Télécharge la page HTML prête à publier et ta vidéo, puis mets-les en ligne où tu veux.",
    ar: "نزّل صفحة HTML الجاهزة للنشر والفيديو، ثم انشرهما حيث تشاء.",
    en: "Download the HTML page ready to publish and your video, then put them online wherever you like.",
  },
  homeStudiosTitle: {
    fr: "Deux studios pour vendre plus.",
    ar: "استوديوهان لتبيع أكثر.",
    en: "Two studios to sell more.",
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
    fr: "Vidéo filmée par l'IA (Google Gemini) en option, avec la facturation Google",
    ar: "فيديو يصوّره الذكاء الاصطناعي (Google Gemini) اختياري، مع تفعيل الفوترة لدى Google",
    en: "Optional AI-filmed video (Google Gemini), with Google billing enabled",
  },
  homeLibraryTitle: {
    fr: "Tous tes fichiers au même endroit",
    ar: "كل ملفاتك في مكان واحد",
    en: "All your files in one place",
  },
  homeLibraryText: {
    fr: "Photos produit, logos et images créées par l’IA, rangés au même endroit et prêts à être réutilisés.",
    ar: "صور المنتجات والشعارات والصور التي أنشأها الذكاء الاصطناعي، مرتبة في مكان واحد وجاهزة لإعادة الاستعمال.",
    en: "Product photos, logos and AI-made images, kept in one place and ready to reuse.",
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
    fr: "L’interface et les contenus générés existent en arabe, en français et en anglais. Chaque page et chaque script choisit sa propre langue.",
    ar: "الواجهة والمحتويات المُنشأة متوفرة بالعربية والفرنسية والإنجليزية. كل صفحة وكل سيناريو يختار لغته.",
    en: "The interface and the generated content are available in Arabic, French and English. Each page and each script picks its own language.",
  },
  homeFaq6Q: {
    fr: "Mes données sont-elles séparées de celles des autres ?",
    ar: "هل بياناتي منفصلة عن بيانات الآخرين؟",
    en: "Is my data kept apart from other accounts?",
  },
  homeFaq6A: {
    fr: "Oui. Chaque page, fichier et réglage appartient à ton compte, et le serveur vérifie le propriétaire à chaque requête.",
    ar: "نعم. كل صفحة وملف وإعداد يخص حسابك، ويتحقق الخادم من المالك في كل طلب.",
    en: "Yes. Every page, file and setting belongs to your account, and the server checks the owner on every request.",
  },
  homeFinalTitle: {
    fr: "Ton prochain produit mérite une vraie campagne.",
    ar: "منتجك القادم يستحق حملة حقيقية.",
    en: "Your next product deserves a real campaign.",
  },
  homeFinalText: {
    fr: "Crée ton compte, ajoute ta clé Gemini et lance ta première landing page à partir d’une photo.",
    ar: "أنشئ حسابك، وأضف مفتاح Gemini، وأطلق أول صفحة هبوط لك انطلاقاً من صورة.",
    en: "Create your account, add your Gemini key and launch your first landing page from one photo.",
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
  homeNavWork: {
    fr: "Réalisations",
    ar: "أعمالنا",
    en: "Our work",
  },
  homeWorkTitle: {
    fr: "Des pages qui vendent déjà.",
    ar: "صفحات تبيع بالفعل.",
    en: "Pages that already sell.",
  },
  homeWorkText: {
    fr: "Une vraie landing page longue, faite pour une boutique algérienne. Touche une partie pour voir le travail qu’elle fait.",
    ar: "صفحة هبوط طويلة حقيقية، صُنعت لمتجر جزائري. اضغط على جزء منها لترى الدور الذي يؤديه.",
    en: "A real long landing page, made for an Algerian shop. Tap a part to see the job it does.",
  },
  homeWorkNote1Title: {
    fr: "Le titre dans l’image",
    ar: "العنوان داخل الصورة",
    en: "The headline in the picture",
  },
  homeWorkNote1Text: {
    fr: "Une promesse courte, lisible même en défilant vite dans le fil Facebook.",
    ar: "وعد قصير يُقرأ حتى عند التمرير السريع في فيسبوك.",
    en: "A short promise that reads even while scrolling fast through Facebook.",
  },
  homeWorkNote2Title: {
    fr: "Le produit en situation",
    ar: "المنتج أثناء الاستعمال",
    en: "The product in use",
  },
  homeWorkNote2Text: {
    fr: "Ton vrai produit, gardé tel quel par l’IA, dans la scène où il sert.",
    ar: "منتجك الحقيقي كما هو، في المشهد الذي يُستعمل فيه.",
    en: "Your real product, kept as it is by the AI, in the scene where it is used.",
  },
  homeWorkNote3Title: {
    fr: "Les avantages, puis le bouton",
    ar: "المزايا ثم زر الطلب",
    en: "The benefits, then the button",
  },
  homeWorkNote3Text: {
    fr: "Trois avantages en icônes, puis « اطلب الآن » avant que le client ne décroche.",
    ar: "ثلاث مزايا بالأيقونات، ثم «اطلب الآن» قبل أن يفقد الزبون اهتمامه.",
    en: "Three benefits as icons, then « اطلب الآن » before the shopper drifts off.",
  },
  homeWorkNote4Title: {
    fr: "Chaque détail expliqué",
    ar: "كل تفصيل مشروح",
    en: "Every detail explained",
  },
  homeWorkNote4Text: {
    fr: "Les questions du client réglées une par une : batterie, fixation, accessoires.",
    ar: "أسئلة الزبون مُجابة واحدة تلو الأخرى: البطارية، التثبيت، الملحقات.",
    en: "The shopper’s questions answered one by one: battery, mounting, accessories.",
  },
  homeWorkAlt: {
    fr: "Landing page longue en arabe pour une douche portable de plage, avec son titre, la photo du produit en situation, ses avantages et le bouton de commande",
    ar: "صفحة هبوط طويلة بالعربية لدوش محمول للشاطئ، بعنوانها وصورة المنتج أثناء الاستعمال ومزاياه وزر الطلب",
    en: "Long Arabic landing page for a portable beach shower, with its headline, the product in use, its benefits and the order button",
  },
  homeWorkMoreTitle: {
    fr: "Six autres pages, six niches.",
    ar: "ست صفحات أخرى، ستة مجالات.",
    en: "Six more pages, six niches.",
  },
  homeWorkMoreText: {
    fr: "Consoles de jeu, soins, plage, voyage en voiture, santé, avis clients : le même format s’adapte à chaque produit.",
    ar: "ألعاب الفيديو، العناية، الشاطئ، السفر بالسيارة، الصحة، آراء الزبائن: نفس الشكل يتكيّف مع كل منتج.",
    en: "Game consoles, personal care, beach, road trips, health, customer reviews: the same format fits every product.",
  },
  homeWorkMoreAlt: {
    fr: "Six autres landing pages longues en arabe : console de jeu, douche, plage, voyage en voiture, douleurs du genou et avis clients",
    ar: "ست صفحات هبوط طويلة أخرى بالعربية: جهاز ألعاب، دوش، شاطئ، سفر بالسيارة، آلام الركبة وآراء الزبائن",
    en: "Six more long Arabic landing pages: game console, shower, beach, road trip, knee pain and customer reviews",
  },
  homeWorkCta: {
    fr: "Créer ma landing page",
    ar: "أنشئ صفحة الهبوط الخاصة بي",
    en: "Create my landing page",
  },
};

registerTranslations('home', homeTranslations);
