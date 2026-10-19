/**
 * Terms of Service and Privacy Policy, in the three interface languages.
 *
 * DRAFT prepared on 2026-10-18 from what the application really does: accounts verified by email or Google,
 * manual subscription payments with a proof upload, a user-supplied Gemini key, stored history and no
 * advertising trackers. It is a starting point, not legal advice: the operator must have it reviewed for
 * their jurisdiction (company details, governing law, data-protection duties) before launch, and bump
 * LEGAL_VERSION_DATE whenever the text changes.
 */
import type { Language } from '../i18n/types';

export type LegalDocId = 'terms' | 'privacy';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_VERSION_DATE = '2026-10-18';

const termsFr: LegalDocument = {
  intro:
    "Ces conditions encadrent l'utilisation d'EcomFlow AI. Lis-les avant de créer un compte : en t'inscrivant ou en utilisant le Service, tu les acceptes.",
  sections: [
    {
      heading: 'Objet du Service',
      paragraphs: [
        "EcomFlow AI (« le Service ») est une plateforme d'outils d'intelligence artificielle pour le e-commerce : scripts de publicités vidéo, pages de vente (landing pages), analyse de produits, calcul de marge, etc.",
      ],
    },
    {
      heading: 'Ton compte',
      paragraphs: [
        "Tu t'inscris avec une adresse email vérifiée par un code à 6 chiffres, ou avec ton compte Google. Tu es responsable de la confidentialité de tes identifiants et de toute activité sur ton compte. Les informations fournies doivent être exactes. Un compte est personnel : ne le partage pas.",
      ],
    },
    {
      heading: 'Abonnements et paiement',
      paragraphs: [
        "Certains outils nécessitent un abonnement actif : mensuel (30 jours), trimestriel (90 jours) ou à vie, selon les offres affichées. Le paiement se fait manuellement (virement ou portefeuille électronique) et tu envoies une preuve de paiement. Ton accès est activé après vérification par notre équipe.",
        "L'abonnement prend fin à sa date d'expiration ; tu peux alors en reprendre un pour continuer. L'accès à vie dure aussi longtemps que le Service est exploité.",
      ],
    },
    {
      heading: 'Remboursements',
      paragraphs: [
        "Les paiements sont vérifiés manuellement. Si tu penses qu'un paiement a été enregistré par erreur, écris-nous : nous étudions chaque demande au cas par cas.",
      ],
    },
    {
      heading: "Clé API Gemini et intelligence artificielle",
      paragraphs: [
        "Les fonctions d'IA utilisent ta propre clé API Google Gemini, que tu renseignes dans les Paramètres. Elle est chiffrée avant d'être enregistrée. Les coûts d'utilisation de cette clé sont facturés par Google, pas par nous. Tu es responsable de ta clé et de ses limites de quota.",
      ],
    },
    {
      heading: "Contenus générés par l'IA",
      paragraphs: [
        "Les textes, scripts, images et pages générés par l'IA peuvent contenir des erreurs ou des approximations : relis-les avant de les publier. Tu es seul responsable de l'usage que tu en fais, y compris de leur conformité aux lois et aux règles des plateformes publicitaires (Facebook, TikTok, Google, etc.). Nous ne garantissons aucun résultat de vente.",
      ],
    },
    {
      heading: 'Tes contenus',
      paragraphs: [
        "Tu conserves tes droits sur les photos, textes et données que tu importes, ainsi que sur les contenus générés pour toi. Tu nous autorises à les traiter uniquement pour fournir le Service (par exemple, les envoyer au service d'IA que tu as configuré).",
      ],
    },
    {
      heading: 'Usages interdits',
      bullets: [
        'Vendre ou promouvoir des produits illégaux, dangereux ou contrefaits.',
        'Tromper les consommateurs : fausses promesses, faux avis, fausses promotions.',
        "Tenter d'accéder aux comptes ou aux données d'autres utilisateurs.",
        "Contourner l'abonnement, les quotas ou les protections du Service.",
        'Surcharger ou perturber le Service.',
        "Revendre l'accès sans autorisation.",
      ],
    },
    {
      heading: 'Disponibilité',
      paragraphs: [
        "Nous faisons de notre mieux pour que le Service soit disponible, mais il est fourni « en l'état », sans garantie d'absence d'interruption ou d'erreur. Nous pouvons le faire évoluer ou le suspendre pour maintenance.",
      ],
    },
    {
      heading: 'Suspension et résiliation',
      paragraphs: [
        "Nous pouvons suspendre ou fermer un compte en cas de violation de ces conditions. Tu peux demander la suppression de ton compte à tout moment en nous contactant.",
      ],
    },
    {
      heading: 'Limitation de responsabilité',
      paragraphs: [
        "Dans la mesure permise par la loi, nous ne sommes pas responsables des pertes indirectes (manque à gagner, perte de clients, décisions prises sur la base de contenus générés) ni des problèmes liés aux services tiers (Google, plateformes publicitaires, hébergeur, services de paiement). Notre responsabilité totale est limitée au montant que tu as payé pour l'abonnement en cours.",
      ],
    },
    {
      heading: 'Modifications',
      paragraphs: [
        "Nous pouvons modifier ces conditions. En cas de changement important, nous t'en informons dans le Service. Continuer à l'utiliser après la mise à jour vaut acceptation.",
      ],
    },
    {
      heading: 'Droit applicable',
      paragraphs: [
        "Ces conditions sont régies par la loi du pays où l'exploitant du Service est établi, et les tribunaux de ce pays sont compétents, sauf disposition légale contraire.",
      ],
    },
  ],
};

const termsAr: LegalDocument = {
  intro:
    'تنظّم هذه الشروط استخدام EcomFlow AI. اقرأها قبل إنشاء حساب: بتسجيلك أو باستخدامك للخدمة فإنك توافق عليها.',
  sections: [
    {
      heading: 'غرض الخدمة',
      paragraphs: [
        'EcomFlow AI («الخدمة») منصة أدوات ذكاء اصطناعي للتجارة الإلكترونية: نصوص الإعلانات المرئية، وصفحات البيع (صفحات الهبوط)، وتحليل المنتجات، وحساب الهوامش وغيرها.',
      ],
    },
    {
      heading: 'حسابك',
      paragraphs: [
        'تسجّل ببريد إلكتروني يتم تأكيده برمز من 6 أرقام، أو بحسابك في Google. أنت مسؤول عن سرّية بيانات دخولك وعن كل نشاط يتم عبر حسابك. يجب أن تكون المعلومات التي تقدّمها صحيحة. الحساب شخصي، فلا تشاركه مع غيرك.',
      ],
    },
    {
      heading: 'الاشتراكات والدفع',
      paragraphs: [
        'تتطلب بعض الأدوات اشتراكًا نشطًا: شهريًا (30 يومًا) أو ربع سنوي (90 يومًا) أو مدى الحياة، حسب العروض المعروضة. يتم الدفع يدويًا (تحويل بنكي أو محفظة إلكترونية) وترسل إثبات الدفع. يُفعَّل وصولك بعد تحقق فريقنا منه.',
        'ينتهي الاشتراك في تاريخ انتهائه، ويمكنك بعدها الاشتراك من جديد لمواصلة الاستخدام. ويستمر الاشتراك مدى الحياة طوال مدة تشغيل الخدمة.',
      ],
    },
    {
      heading: 'الاسترجاع',
      paragraphs: [
        'تتم مراجعة المدفوعات يدويًا. إذا اعتقدت أنه تم تسجيل دفعة عن طريق الخطأ، فراسلنا وسندرس كل طلب على حدة.',
      ],
    },
    {
      heading: 'مفتاح Gemini والذكاء الاصطناعي',
      paragraphs: [
        'تعمل ميزات الذكاء الاصطناعي بمفتاح Google Gemini الخاص بك الذي تضيفه في الإعدادات، ويُشفَّر قبل حفظه. تتقاضى Google تكلفة استخدام هذا المفتاح وليس نحن. أنت مسؤول عن مفتاحك وعن حدود الاستخدام المرتبطة به.',
      ],
    },
    {
      heading: 'المحتوى المُنشأ بالذكاء الاصطناعي',
      paragraphs: [
        'قد تتضمن النصوص والسيناريوهات والصور والصفحات التي ينتجها الذكاء الاصطناعي أخطاءً أو معلومات غير دقيقة، لذا راجعها قبل نشرها. أنت وحدك المسؤول عن استخدامها، بما في ذلك مطابقتها للقوانين ولقواعد منصات الإعلان (Facebook وTikTok وGoogle وغيرها). لا نضمن أي نتائج بيعية.',
      ],
    },
    {
      heading: 'محتواك',
      paragraphs: [
        'تحتفظ بحقوقك على الصور والنصوص والبيانات التي ترفعها وعلى المحتوى المُنشأ لك. وتأذن لنا بمعالجتها فقط لتقديم الخدمة (مثل إرسالها إلى خدمة الذكاء الاصطناعي التي أعددتها).',
      ],
    },
    {
      heading: 'الاستخدامات الممنوعة',
      bullets: [
        'بيع منتجات غير قانونية أو خطرة أو مقلَّدة أو الترويج لها.',
        'خداع المستهلكين: وعود كاذبة أو آراء مزيفة أو عروض وهمية.',
        'محاولة الوصول إلى حسابات أو بيانات مستخدمين آخرين.',
        'التحايل على الاشتراك أو الحصص أو وسائل حماية الخدمة.',
        'إرهاق الخدمة أو تعطيلها.',
        'إعادة بيع الوصول دون إذن.',
      ],
    },
    {
      heading: 'توفّر الخدمة',
      paragraphs: [
        'نبذل جهدنا لإبقاء الخدمة متاحة، لكنها تُقدَّم «كما هي» دون ضمان لعدم الانقطاع أو الخلو من الأخطاء. وقد نطوّرها أو نوقفها مؤقتًا للصيانة.',
      ],
    },
    {
      heading: 'التعليق والإنهاء',
      paragraphs: [
        'يجوز لنا تعليق حساب أو إغلاقه عند مخالفة هذه الشروط. ويمكنك طلب حذف حسابك في أي وقت بمراسلتنا.',
      ],
    },
    {
      heading: 'حدود المسؤولية',
      paragraphs: [
        'بالقدر الذي يسمح به القانون، لا نتحمّل الخسائر غير المباشرة (فوات الربح، فقدان العملاء، القرارات المبنية على المحتوى المُنشأ) ولا المشكلات المتعلقة بخدمات الأطراف الثالثة (Google ومنصات الإعلان والاستضافة وخدمات الدفع). وتقتصر مسؤوليتنا الإجمالية على المبلغ الذي دفعته عن الاشتراك الحالي.',
      ],
    },
    {
      heading: 'التعديلات',
      paragraphs: [
        'قد نعدّل هذه الشروط. عند حدوث تغيير جوهري سنُعلمك داخل الخدمة. ويُعدّ استمرارك في الاستخدام بعد التحديث قبولًا له.',
      ],
    },
    {
      heading: 'القانون الواجب التطبيق',
      paragraphs: [
        'تخضع هذه الشروط لقانون البلد الذي يقيم فيه مشغّل الخدمة، وتختص محاكم ذلك البلد بالنظر في أي نزاع، ما لم ينص القانون على خلاف ذلك.',
      ],
    },
  ],
};

const termsEn: LegalDocument = {
  intro:
    'These terms govern your use of EcomFlow AI. Read them before creating an account: by signing up or using the Service you accept them.',
  sections: [
    {
      heading: 'What the Service is',
      paragraphs: [
        'EcomFlow AI (the "Service") is a platform of artificial-intelligence tools for e-commerce: video ad scripts, sales pages (landing pages), product analysis, margin calculation and more.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You sign up with an email address verified by a 6-digit code, or with your Google account. You are responsible for keeping your credentials confidential and for everything that happens under your account. The information you give must be accurate. An account is personal: do not share it.',
      ],
    },
    {
      heading: 'Subscriptions and payment',
      paragraphs: [
        'Some tools need an active subscription: monthly (30 days), quarterly (90 days) or lifetime, according to the offers shown. Payment is made manually (bank transfer or e-wallet) and you send a proof of payment. Your access is activated once our team has checked it.',
        'A subscription ends on its expiry date; you can then take a new one to continue. Lifetime access lasts for as long as the Service is operated.',
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        'Payments are checked manually. If you believe a payment was recorded by mistake, write to us and we will review each request on its own merits.',
      ],
    },
    {
      heading: 'Gemini API key and artificial intelligence',
      paragraphs: [
        'The AI features use your own Google Gemini API key, which you enter in Settings. It is encrypted before it is stored. The cost of using that key is billed by Google, not by us. You are responsible for your key and its quota limits.',
      ],
    },
    {
      heading: 'AI-generated content',
      paragraphs: [
        'Texts, scripts, images and pages generated by AI may contain mistakes or approximations: review them before publishing. You alone are responsible for how you use them, including their compliance with the law and with the rules of advertising platforms (Facebook, TikTok, Google and others). We guarantee no sales results.',
      ],
    },
    {
      heading: 'Your content',
      paragraphs: [
        'You keep your rights over the photos, texts and data you upload, and over the content generated for you. You allow us to process them only to provide the Service (for example, sending them to the AI service you configured).',
      ],
    },
    {
      heading: 'Prohibited uses',
      bullets: [
        'Selling or promoting illegal, dangerous or counterfeit products.',
        'Deceiving consumers: false promises, fake reviews, fake promotions.',
        "Trying to access other users' accounts or data.",
        "Bypassing the subscription, quotas or the Service's protections.",
        'Overloading or disrupting the Service.',
        'Reselling access without permission.',
      ],
    },
    {
      heading: 'Availability',
      paragraphs: [
        'We do our best to keep the Service available, but it is provided "as is", with no guarantee that it will be free of interruptions or errors. We may change it or suspend it for maintenance.',
      ],
    },
    {
      heading: 'Suspension and termination',
      paragraphs: [
        'We may suspend or close an account that breaks these terms. You can ask us to delete your account at any time by contacting us.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        "To the extent the law allows, we are not liable for indirect losses (lost profit, lost customers, decisions made on the basis of generated content) or for problems with third-party services (Google, advertising platforms, hosting, payment services). Our total liability is limited to the amount you paid for the current subscription.",
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'We may change these terms. If the change is important, we will tell you inside the Service. Continuing to use it after the update means you accept it.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'These terms are governed by the law of the country where the Service operator is established, and the courts of that country have jurisdiction, unless the law says otherwise.',
      ],
    },
  ],
};

const privacyFr: LegalDocument = {
  intro:
    "Cette politique explique quelles données EcomFlow AI collecte, pourquoi, et comment tu peux les contrôler. Nous ne vendons pas tes données.",
  sections: [
    {
      heading: 'Données que nous collectons',
      bullets: [
        "Compte : nom, adresse email, photo de profil (si tu te connectes avec Google) et mot de passe (conservé uniquement sous une forme chiffrée irréversible).",
        "Abonnement : formule choisie, moyen de paiement, preuve de paiement (image ou PDF) et notes de vérification.",
        "Utilisation : historique des générations, sessions de travail, catalogue de produits et préférences (langue, thème, ordre des outils).",
        "Paramètres : clé API Gemini et jetons des plateformes publicitaires que tu ajoutes (chiffrés).",
        'Contact : les messages que tu nous envoies.',
        "Technique : adresse IP, utilisée pour la sécurité et la limitation des abus.",
      ],
    },
    {
      heading: 'Pourquoi nous les utilisons',
      bullets: [
        'Fournir et sécuriser le Service.',
        'Vérifier les paiements et activer ton accès.',
        'Envoyer les codes de vérification à ton email.',
        'Répondre à tes demandes.',
        'Prévenir les abus et la fraude.',
      ],
    },
    {
      heading: 'Services tiers',
      paragraphs: [
        "Le Service s'appuie sur : Google (connexion avec Google et API Gemini : les textes et images que tu soumets aux outils IA sont envoyés à Google avec ta propre clé) ; un service d'envoi d'emails (codes de vérification, messages de contact) ; un hébergeur et un fournisseur de base de données. Chacun traite les données selon ses propres conditions.",
      ],
    },
    {
      heading: 'Cookies et stockage local',
      paragraphs: [
        "Nous utilisons un cookie de session indispensable pour te garder connecté (un cookie temporaire sert aussi à la connexion avec Google) et un petit cookie qui mémorise ta langue pour que le serveur te réponde dans cette langue. Ton navigateur conserve aussi tes préférences (langue, thème, ordre des outils) dans son stockage local. Nous n'utilisons ni cookies publicitaires ni outils de suivi marketing sur ce site.",
      ],
    },
    {
      heading: 'Durée de conservation',
      paragraphs: [
        "Nous conservons tes données tant que ton compte existe. À ta demande, nous supprimons ton compte et les données associées, sauf celles que la loi nous oblige à conserver.",
      ],
    },
    {
      heading: 'Sécurité',
      paragraphs: [
        "Les mots de passe sont stockés sous forme hachée, tes clés API et jetons sont chiffrés, et les échanges sont protégés par HTTPS. Aucun système n'est infaillible : choisis un mot de passe unique et ne partage pas tes codes.",
      ],
    },
    {
      heading: 'Tes droits',
      paragraphs: [
        "Tu peux demander l'accès à tes données, leur correction ou leur suppression, ou t'opposer à certains traitements, en nous contactant. Nous répondrons dans un délai raisonnable.",
      ],
    },
    {
      heading: 'Mineurs',
      paragraphs: ["Le Service s'adresse aux adultes qui exercent une activité commerciale. Il n'est pas destiné aux mineurs."],
    },
    {
      heading: 'Modifications',
      paragraphs: [
        "Nous pouvons mettre à jour cette politique. En cas de changement important, nous t'en informons dans le Service.",
      ],
    },
  ],
};

const privacyAr: LegalDocument = {
  intro:
    'توضّح هذه السياسة البيانات التي تجمعها EcomFlow AI ولماذا، وكيف يمكنك التحكم بها. نحن لا نبيع بياناتك.',
  sections: [
    {
      heading: 'البيانات التي نجمعها',
      bullets: [
        'الحساب: الاسم والبريد الإلكتروني وصورة الملف الشخصي (عند الدخول عبر Google) وكلمة المرور (تُحفظ بصيغة مُشفَّرة لا يمكن عكسها فقط).',
        'الاشتراك: الباقة المختارة ووسيلة الدفع وإثبات الدفع (صورة أو ملف PDF) وملاحظات التحقق.',
        'الاستخدام: سجل عمليات الإنشاء وجلسات العمل وكتالوج المنتجات والتفضيلات (اللغة والمظهر وترتيب الأدوات).',
        'الإعدادات: مفتاح Gemini ورموز منصات الإعلان التي تضيفها (مُشفَّرة).',
        'التواصل: الرسائل التي ترسلها إلينا.',
        'تقنية: عنوان IP لأغراض الأمان والحدّ من إساءة الاستخدام.',
      ],
    },
    {
      heading: 'لماذا نستخدمها',
      bullets: [
        'تقديم الخدمة وتأمينها.',
        'التحقق من المدفوعات وتفعيل وصولك.',
        'إرسال رموز التحقق إلى بريدك الإلكتروني.',
        'الرد على طلباتك.',
        'منع إساءة الاستخدام والاحتيال.',
      ],
    },
    {
      heading: 'الخدمات الخارجية',
      paragraphs: [
        'تعتمد الخدمة على: Google (الدخول عبر Google وواجهة Gemini: النصوص والصور التي ترسلها إلى أدوات الذكاء الاصطناعي تُرسل إلى Google بمفتاحك الخاص)؛ وخدمة إرسال البريد الإلكتروني (رموز التحقق ورسائل التواصل)؛ ومزوّد استضافة ومزوّد قاعدة بيانات. يعالج كل منهم البيانات وفق شروطه الخاصة.',
      ],
    },
    {
      heading: 'ملفات تعريف الارتباط والتخزين المحلي',
      paragraphs: [
        'نستخدم ملف تعريف ارتباط أساسيًا للجلسة يُبقيك مسجّلًا للدخول (وملفًا مؤقتًا آخر عند الدخول عبر Google) وملفًا صغيرًا يحفظ لغتك ليجيبك الخادم بها. كما يحفظ متصفحك تفضيلاتك (اللغة والمظهر وترتيب الأدوات) في التخزين المحلي. لا نستخدم ملفات تعريف ارتباط إعلانية ولا أدوات تتبّع تسويقي في هذا الموقع.',
      ],
    },
    {
      heading: 'مدة الاحتفاظ',
      paragraphs: [
        'نحتفظ ببياناتك ما دام حسابك قائمًا. وبناءً على طلبك نحذف حسابك والبيانات المرتبطة به، باستثناء ما يلزمنا القانون بالاحتفاظ به.',
      ],
    },
    {
      heading: 'الأمان',
      paragraphs: [
        'تُحفظ كلمات المرور بصيغة مُجزَّأة (hash)، وتُشفَّر مفاتيح API والرموز، وتُحمى الاتصالات بـ HTTPS. لا يوجد نظام معصوم من الخطأ، لذا اختر كلمة مرور فريدة ولا تشارك رموزك مع أحد.',
      ],
    },
    {
      heading: 'حقوقك',
      paragraphs: [
        'يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها، أو الاعتراض على بعض أنواع المعالجة، بمراسلتنا. سنرد خلال مدة معقولة.',
      ],
    },
    {
      heading: 'القاصرون',
      paragraphs: ['الخدمة موجّهة إلى البالغين الذين يمارسون نشاطًا تجاريًا، وليست مخصصة للقاصرين.'],
    },
    {
      heading: 'التعديلات',
      paragraphs: ['قد نحدّث هذه السياسة. وعند حدوث تغيير جوهري سنُعلمك داخل الخدمة.'],
    },
  ],
};

const privacyEn: LegalDocument = {
  intro:
    'This policy explains what data EcomFlow AI collects, why, and how you can control it. We do not sell your data.',
  sections: [
    {
      heading: 'Data we collect',
      bullets: [
        'Account: name, email address, profile picture (if you sign in with Google) and password (kept only in an irreversible hashed form).',
        'Subscription: the plan you chose, payment method, proof of payment (image or PDF) and verification notes.',
        'Usage: generation history, work sessions, product catalogue and preferences (language, theme, tool order).',
        'Settings: the Gemini API key and the advertising-platform tokens you add (encrypted).',
        'Contact: the messages you send us.',
        'Technical: IP address, used for security and to limit abuse.',
      ],
    },
    {
      heading: 'Why we use it',
      bullets: [
        'To provide and secure the Service.',
        'To check payments and activate your access.',
        'To send verification codes to your email.',
        'To answer your requests.',
        'To prevent abuse and fraud.',
      ],
    },
    {
      heading: 'Third-party services',
      paragraphs: [
        'The Service relies on: Google (sign-in with Google and the Gemini API: the texts and images you submit to the AI tools are sent to Google using your own key); an email-sending service (verification codes, contact messages); a hosting provider and a database provider. Each handles data under its own terms.',
      ],
    },
    {
      heading: 'Cookies and local storage',
      paragraphs: [
        'We use one essential session cookie to keep you signed in (a temporary cookie is also used for sign-in with Google) and a small cookie that remembers your language so the server answers in it. Your browser also keeps your preferences (language, theme, tool order) in its local storage. We use no advertising cookies and no marketing trackers on this site.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'We keep your data for as long as your account exists. On request, we delete your account and the data tied to it, except what the law requires us to keep.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'Passwords are stored hashed, your API keys and tokens are encrypted, and traffic is protected by HTTPS. No system is infallible: choose a unique password and do not share your codes.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You can ask to access, correct or delete your data, or object to certain processing, by contacting us. We will answer within a reasonable time.',
      ],
    },
    {
      heading: 'Minors',
      paragraphs: ['The Service is for adults who run a business. It is not intended for minors.'],
    },
    {
      heading: 'Changes',
      paragraphs: ['We may update this policy. If the change is important, we will tell you inside the Service.'],
    },
  ],
};

export const LEGAL: Record<LegalDocId, Record<Language, LegalDocument>> = {
  terms: { fr: termsFr, ar: termsAr, en: termsEn },
  privacy: { fr: privacyFr, ar: privacyAr, en: privacyEn },
};
