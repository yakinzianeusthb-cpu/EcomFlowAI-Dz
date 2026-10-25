import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// settings: interface text, generated from the components and then maintained by hand.
export const settingsTranslations: TranslationDictionary = {
  stgParametresEnregistresAvecSucce: {
    fr: "Paramètres enregistrés avec succès !",
    ar: "تم حفظ الإعدادات بنجاح!",
    en: "Settings saved successfully!",
  },
  stgErreurLorsSauvegarde: {
    fr: "Erreur lors de la sauvegarde",
    ar: "حدث خطأ أثناء الحفظ",
    en: "Error while saving",
  },
  stgConnecte: {
    fr: "Connecté",
    ar: "متصل",
    en: "Connected",
  },
  stgInformationsGenerales: {
    fr: "Informations Générales",
    ar: "معلومات عامة",
    en: "General information",
  },
  stgPersonnalisezEspaceTravail: {
    fr: "Personnalisez votre espace de travail",
    ar: "خصّص مساحة عملك",
    en: "Customise your workspace",
  },
  stgNomWorkspace: {
    fr: "Nom du Workspace",
    ar: "اسم مساحة العمل",
    en: "Workspace name",
  },
  stgExMonAgenceE: {
    fr: "Ex : Mon agence e-commerce...",
    ar: "مثال: وكالتي للتجارة الإلكترونية...",
    en: "Ex: My E-com Agency...",
  },
  stgCleApiGenerationContenu: {
    fr: "Clé API pour la génération de contenu et analyses stratégiques",
    ar: "مفتاح API لإنشاء المحتوى والتحليلات الاستراتيجية",
    en: "API key for content generation and strategic analysis",
  },
  stgCleApiGeminiV1: {
    fr: "Clé API Gemini",
    ar: "مفتاح Gemini API",
    en: "Gemini API key",
  },
  stgConfigureLaisserVideConserver: {
    fr: "•••••••• (configuré — laisser vide pour conserver)",
    ar: "•••••••• (تم الإعداد — اتركه فارغاً للإبقاء عليه)",
    en: "•••••••• (configured — leave empty to keep it)",
  },
  stgIntroduisezCleApiAi: {
    fr: "Introduisez votre clé API AI Studio...",
    ar: "أدخل مفتاح API الخاص بك من AI Studio...",
    en: "Enter your AI Studio API key...",
  },
  stgCetteCleAlimenteToute: {
    fr: "Cette clé alimente la génération IA (textes, vidéos, analyses, et les images sauf si tu choisis un autre service plus bas). Elle est chiffrée et ne quitte jamais le serveur.",
    ar: "هذا المفتاح يشغّل الذكاء الاصطناعي (النصوص والفيديوهات والتحليلات، والصور ما لم تختر خدمة أخرى في الأسفل). وهو مشفّر ولا يغادر الخادم أبداً.",
    en: "This key powers the AI generation (text, videos, analysis, and images unless you choose another service below). It is encrypted and never leaves the server.",
  },
  stgImgTitle: { fr: "Service d’images", ar: "خدمة الصور", en: "Image service" },
  stgImgSubtitle: {
    fr: "L’IA qui crée tes photos, tes images et tes affiches. Les textes et les vidéos utilisent toujours Gemini.",
    ar: "الذكاء الاصطناعي الذي ينشئ صورك وملصقاتك. النصوص والفيديوهات تستعمل دائماً Gemini.",
    en: "The AI that creates your photos, images and posters. Text and videos always use Gemini.",
  },
  stgImgDefault: { fr: "par défaut", ar: "افتراضي", en: "default" },
  stgImgFree: { fr: "gratuit", ar: "مجاني", en: "free" },
  stgImgGemini: {
    fr: "Recommandé. Garde ton produit tel qu’il est, avec la clé Gemini ci-dessus (facturation activée).",
    ar: "موصى به. يحافظ على منتجك كما هو، باستعمال مفتاح Gemini أعلاه (مع تفعيل الفوترة).",
    en: "Recommended. Keeps your product as it is, with the Gemini key above (billing enabled).",
  },
  stgImgOpenai: {
    fr: "Garde ton produit. Payant : il faut du crédit sur ton compte OpenAI, et OpenAI peut demander de vérifier ton organisation.",
    ar: "يحافظ على منتجك. مدفوع: يلزم رصيد في حساب OpenAI، وقد تطلب OpenAI التحقق من مؤسستك.",
    en: "Keeps your product. Paid: you need credit on your OpenAI account, and OpenAI may ask to verify your organization.",
  },
  stgImgFal: {
    fr: "FLUX Kontext : garde ton produit. Payant à l’image, sur ton compte fal.ai.",
    ar: "FLUX Kontext: يحافظ على منتجك. مدفوع حسب الصورة، من حسابك في fal.ai.",
    en: "FLUX Kontext: keeps your product. Paid per image, on your fal.ai account.",
  },
  stgImgCloudflare: {
    fr: "FLUX.2 : garde ton produit. Gratuit chaque jour dans une limite (environ 80 images), sur ton compte Cloudflare.",
    ar: "FLUX.2: يحافظ على منتجك. مجاني يومياً ضمن حدّ معيّن (حوالي 80 صورة)، من حسابك في Cloudflare.",
    en: "FLUX.2: keeps your product. Free every day within a limit (about 80 images), on your Cloudflare account.",
  },
  stgImgOpenaiKey: { fr: "Clé API OpenAI", ar: "مفتاح OpenAI API", en: "OpenAI API key" },
  stgImgFalKey: { fr: "Clé API fal.ai", ar: "مفتاح fal.ai API", en: "fal.ai API key" },
  stgImgCfAccount: { fr: "Identifiant du compte Cloudflare", ar: "معرّف حساب Cloudflare", en: "Cloudflare account ID" },
  stgImgCfToken: { fr: "Jeton API Cloudflare (Workers AI)", ar: "رمز Cloudflare API (Workers AI)", en: "Cloudflare API token (Workers AI)" },
  stgImgKeyNote: {
    fr: "La clé est chiffrée et ne quitte jamais le serveur. Laisse le champ vide pour garder celle déjà enregistrée.",
    ar: "المفتاح مشفّر ولا يغادر الخادم أبداً. اترك الحقل فارغاً للاحتفاظ بالمفتاح المحفوظ.",
    en: "The key is encrypted and never leaves the server. Leave the field empty to keep the one already saved.",
  },
  stgImgGetKey: { fr: "Créer une clé chez {service}", ar: "أنشئ مفتاحاً لدى {service}", en: "Create a key at {service}" },
  stgSauvegarderParametres: {
    fr: "Sauvegarder les Paramètres",
    ar: "حفظ الإعدادات",
    en: "Save settings",
  },
  stgTxtTitle: {
    fr: "Moteur IA des textes",
    ar: "محرك الذكاء الاصطناعي للنصوص",
    en: "AI engine for texts",
  },
  stgTxtSubtitle: {
    fr: "L’IA qui écrit tes landing pages, tes scripts vidéo et tes analyses. Choisis celle avec qui tu travailles.",
    ar: "الذكاء الاصطناعي الذي يكتب صفحات الهبوط وسكريبتات الفيديو والتحليلات. اختر الذي تعمل معه.",
    en: "The AI that writes your landing pages, video scripts and analyses. Choose the one you work with.",
  },
  stgTxtGemini: {
    fr: "Par défaut. Gratuit pour les textes avec une clé Google AI Studio, ou avec tes points.",
    ar: "افتراضي. مجاني للنصوص بمفتاح Google AI Studio، أو بنقاطك.",
    en: "Default. Free for texts with a Google AI Studio key, or with your points.",
  },
  stgTxtOpenai: {
    fr: "GPT : très bon rédacteur, lit tes photos. Payant sur ton compte OpenAI.",
    ar: "GPT: كاتب ممتاز ويقرأ صورك. مدفوع من حسابك في OpenAI.",
    en: "GPT: a very good writer that reads your photos. Paid on your OpenAI account.",
  },
  stgTxtAnthropic: {
    fr: "Claude : excellent pour les textes de vente, lit tes photos. Payant sur ton compte Anthropic.",
    ar: "Claude: ممتاز لنصوص البيع ويقرأ صورك. مدفوع من حسابك في Anthropic.",
    en: "Claude: excellent for sales copy, reads your photos. Paid on your Anthropic account.",
  },
  stgTxtMistral: {
    fr: "Modèles européens, à l’aise en français. Payant sur ton compte Mistral.",
    ar: "نماذج أوروبية متمكنة من الفرنسية. مدفوع من حسابك في Mistral.",
    en: "European models, at ease in French. Paid on your Mistral account.",
  },
  stgTxtDeepseek: {
    fr: "Très économique, mais ne lit pas les photos : les textes seulement.",
    ar: "اقتصادي جداً، لكنه لا يقرأ الصور: النصوص فقط.",
    en: "Very cheap, but it does not read photos: texts only.",
  },
  stgTxtXai: {
    fr: "Grok, de xAI : lit tes photos. Payant sur ton compte xAI.",
    ar: "Grok من xAI: يقرأ صورك. مدفوع من حسابك في xAI.",
    en: "Grok, by xAI: reads your photos. Paid on your xAI account.",
  },
  stgTxtOpenrouter: {
    fr: "Des centaines de modèles (Llama, Qwen, Claude, GPT…) avec une seule clé.",
    ar: "مئات النماذج (Llama وQwen وClaude وGPT…) بمفتاح واحد.",
    en: "Hundreds of models (Llama, Qwen, Claude, GPT…) with a single key.",
  },
  stgTxtKey: {
    fr: "Clé API {service}",
    ar: "مفتاح API لـ {service}",
    en: "{service} API key",
  },
  stgTxtModel: {
    fr: "Modèle",
    ar: "النموذج",
    en: "Model",
  },
  stgTxtLoadModels: {
    fr: "Charger les modèles",
    ar: "تحميل النماذج",
    en: "Load models",
  },
  stgTxtModelsLoaded: {
    fr: "{count} modèles disponibles avec ta clé : tape pour chercher dans la liste.",
    ar: "{count} نموذج متاح بمفتاحك: اكتب للبحث في القائمة.",
    en: "{count} models available with your key: type to search the list.",
  },
  stgTxtModelHint: {
    fr: "Vide = {model}, le modèle conseillé. « Charger les modèles » liste ceux de ta clé.",
    ar: "فارغ = {model}، النموذج المقترح. «تحميل النماذج» يعرض نماذج مفتاحك.",
    en: "Empty = {model}, the recommended model. “Load models” lists your key’s models.",
  },
  stgTxtSaveFirst: {
    fr: "Enregistre d’abord ta clé pour voir la liste de ses modèles. Vide = {model}.",
    ar: "احفظ مفتاحك أولاً لرؤية قائمة نماذجه. فارغ = {model}.",
    en: "Save your key first to see its list of models. Empty = {model}.",
  },
  stgTxtNoModels: {
    fr: "Aucun modèle trouvé pour cette clé.",
    ar: "لم يُعثر على أي نموذج لهذا المفتاح.",
    en: "No model found for this key.",
  },
  stgTxtNoVision: {
    fr: "Ce moteur ne lit pas les photos : l’analyse de tes photos produit se fera sans elles.",
    ar: "هذا المحرك لا يقرأ الصور: سيتم تحليل منتجك بدونها.",
    en: "This engine does not read photos: your product analysis will be done without them.",
  },
  stgTxtKeyNote: {
    fr: "La clé est chiffrée et ne quitte jamais le serveur. Les vidéos IA utilisent toujours Gemini.",
    ar: "المفتاح مشفّر ولا يغادر الخادم أبداً. تستعمل فيديوهات الذكاء الاصطناعي دائماً Gemini.",
    en: "The key is encrypted and never leaves the server. AI videos always use Gemini.",
  },
  stgTxtGeminiNote: {
    fr: "Les textes utilisent ta clé Gemini ci-dessous, ou tes points si tu n’as pas de clé.",
    ar: "تستعمل النصوص مفتاح Gemini أدناه، أو نقاطك إن لم يكن لديك مفتاح.",
    en: "Texts use your Gemini key below, or your points if you have no key.",
  },
  stgImgSubtitleEngines: {
    fr: "L’IA qui crée tes photos, tes images et tes affiches. Les vidéos IA utilisent toujours Gemini.",
    ar: "الذكاء الاصطناعي الذي يصنع صورك وملصقاتك. تستعمل فيديوهات الذكاء الاصطناعي دائماً Gemini.",
    en: "The AI that makes your photos, images and posters. AI videos always use Gemini.",
  },
  stgSubtitleAi: {
    fr: "Ton espace, tes clés d’IA, tes services d’images et ta voix off.",
    ar: "مساحتك، مفاتيح الذكاء الاصطناعي، خدمات الصور والتعليق الصوتي.",
    en: "Your workspace, your AI keys, your image services and your voice-over.",
  },
  stgImgPollinations: {
    fr: "FLUX.2 et d’autres modèles avec une seule clé : garde ton produit. Moins d’un centime l’image, sur ton compte Pollinations. La même clé sert à la voix off.",
    ar: "FLUX.2 ونماذج أخرى بمفتاح واحد: يحافظ على منتجك. أقل من سنت للصورة، من حسابك في Pollinations. نفس المفتاح يصلح للتعليق الصوتي.",
    en: "FLUX.2 and other models with one key: keeps your product. Less than a cent an image, on your Pollinations account. The same key works for the voice-over.",
  },
  stgImgCheap: {
    fr: "très peu cher",
    ar: "رخيص جداً",
    en: "very cheap",
  },
  stgImgCfHelp: {
    fr: "Crée le jeton avec le modèle « Workers AI » (permission Workers AI : Lire et Modifier). L’identifiant du compte est sur la page d’accueil de ton tableau de bord Cloudflare.",
    ar: "أنشئ الرمز بقالب «Workers AI» (صلاحية Workers AI: قراءة وتعديل). معرّف الحساب موجود في الصفحة الرئيسية للوحة تحكم Cloudflare.",
    en: "Create the token with the “Workers AI” template (Workers AI permission: Read and Edit). The account ID is on the home page of your Cloudflare dashboard.",
  },
  stgImgPollinationsKey: {
    fr: "Clé secrète Pollinations (sk_…)",
    ar: "المفتاح السري لـ Pollinations (sk_…)",
    en: "Pollinations secret key (sk_…)",
  },
  stgVoiceTitle: {
    fr: "Voix off",
    ar: "التعليق الصوتي",
    en: "Voice-over",
  },
  stgVoiceSubtitle: {
    fr: "La voix IA qui lit le texte de tes vidéos, ajoutée dans la vidéo créée.",
    ar: "الصوت الاصطناعي الذي يقرأ نص فيديوهاتك، ويُضاف إلى الفيديو المُنشأ.",
    en: "The AI voice that reads your videos’ text, added to the video you create.",
  },
  stgVoiceEleven: {
    fr: "Les voix les plus naturelles, en arabe aussi. 10 000 caractères gratuits par mois (environ 10 minutes) pour essayer ; un abonnement pour publier.",
    ar: "أكثر الأصوات طبيعية، بالعربية أيضاً. 10,000 حرف مجاناً كل شهر (حوالي 10 دقائق) للتجربة؛ واشتراك للنشر.",
    en: "The most natural voices, in Arabic too. 10,000 free characters a month (about 10 minutes) to try; a subscription to publish.",
  },
  stgVoicePollinations: {
    fr: "La même clé que les images Pollinations. Voix ElevenLabs avec du crédit Pollen, sinon une voix OpenAI ouverte aux comptes gratuits.",
    ar: "نفس مفتاح صور Pollinations. أصوات ElevenLabs برصيد Pollen، وإلا صوت OpenAI المتاح للحسابات المجانية.",
    en: "The same key as the Pollinations images. ElevenLabs voices with Pollen credit, otherwise an OpenAI voice open to free accounts.",
  },
  stgVoiceElevenKey: {
    fr: "Clé API ElevenLabs",
    ar: "مفتاح API لـ ElevenLabs",
    en: "ElevenLabs API key",
  },
  stgVoiceVoice: {
    fr: "Voix",
    ar: "الصوت",
    en: "Voice",
  },
  stgVoiceFirst: {
    fr: "La première voix du service",
    ar: "أول صوت في الخدمة",
    en: "The service’s first voice",
  },
  stgVoiceLoad: {
    fr: "Charger les voix",
    ar: "تحميل الأصوات",
    en: "Load the voices",
  },
  stgVoicePreview: {
    fr: "Écouter un extrait",
    ar: "استمع إلى مقطع",
    en: "Listen to a sample",
  },
  stgVoiceSaveFirst: {
    fr: "Enregistre la clé de ce service pour charger ses voix.",
    ar: "احفظ مفتاح هذه الخدمة لتحميل أصواتها.",
    en: "Save this service’s key to load its voices.",
  },
};

registerTranslations('settings', settingsTranslations);
