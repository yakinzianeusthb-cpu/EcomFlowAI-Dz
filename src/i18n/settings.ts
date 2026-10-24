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
    fr: "Gratuit chaque jour dans une limite, mais il dessine seulement d’après les mots : il ne garde pas ton produit (pas pour les images de ta page).",
    ar: "مجاني يومياً ضمن حدّ معيّن، لكنه يرسم من الكلمات فقط: لا يحافظ على منتجك (ليس لصور صفحتك).",
    en: "Free every day within a limit, but it only draws from words: it does not keep your product (not for your page's images).",
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
};

registerTranslations('settings', settingsTranslations);
