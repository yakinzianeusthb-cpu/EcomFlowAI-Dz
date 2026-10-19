/**
 * Translations of the messages the API sends back (login errors, validation errors, rate limits...).
 *
 * The routes keep writing their messages in French, which stays the source of truth; the browser sends the
 * language it displays in the `dzads_lang` cookie, and a middleware swaps the text on the way out.
 * Messages that carry data (an email address, a count) are not listed and are sent as they are.
 *
 * Keep this file in step with the server code: a test fails when a message is added there but not here.
 */
import { LANGUAGE_COOKIE } from './languageCookie';
import type { Language } from './types';

export { LANGUAGE_COOKIE };

export interface ServerMessage {
  fr: string;
  ar: string;
  en: string;
}

// [message as written in the code, English, Arabic]. French sources use themselves as the French text.
const FRENCH_SOURCED: Array<[string, string, string]> = [
  // AI proxy
  ["Trop de requêtes IA. Réessaie dans une minute.", "Too many AI requests. Try again in a minute.", "طلبات الذكاء الاصطناعي كثيرة جدًا. أعد المحاولة بعد دقيقة."],
  ["Ajoute ta clé Gemini dans Paramètres pour utiliser l'IA.", "Add your Gemini key in Settings to use the AI.", "أضف مفتاح Gemini في الإعدادات لاستخدام الذكاء الاصطناعي."],
  ["Modèle non autorisé.", "Model not allowed.", "النموذج غير مسموح به."],
  ["Quota Gemini dépassé. Réessaie dans un instant.", "Gemini quota exceeded. Try again in a moment.", "تم تجاوز حصة Gemini. أعد المحاولة بعد قليل."],
  ["Erreur serveur IA.", "AI server error.", "خطأ في خادم الذكاء الاصطناعي."],
  ["Ta clé Gemini a atteint sa limite gratuite du jour. Réessaie demain, ou active la facturation dans Google AI Studio.", "Your Gemini key has used up its free requests for today. Try again tomorrow, or enable billing in Google AI Studio.", "استنفد مفتاح Gemini الخاص بك طلباته المجانية لهذا اليوم. أعد المحاولة غداً أو فعّل الفوترة في Google AI Studio."],
  ["Ta clé Gemini gratuite ne permet pas de créer des images ni des vidéos. Active la facturation dans Google AI Studio pour utiliser cette fonction.", "Your free Gemini key cannot create images or videos. Enable billing in Google AI Studio to use this feature.", "مفتاح Gemini المجاني لا يسمح بإنشاء الصور أو الفيديوهات. فعّل الفوترة في Google AI Studio لاستخدام هذه الميزة."],
  ["Décris la scène à filmer (3 à 2000 caractères).", "Describe the scene to film (3 to 2000 characters).", "صِف المشهد المطلوب تصويره (من 3 إلى 2000 حرف)."],
  ["Image invalide : utilise une photo PNG, JPG ou WebP de moins de 6 Mo.", "Invalid image: use a PNG, JPG or WebP photo under 6 MB.", "صورة غير صالحة: استعمل صورة PNG أو JPG أو WebP أقل من 6 ميغابايت."],
  ["Google refuse la vidéo IA avec cette clé : il faut une clé Gemini avec facturation activée (ou ton quota vidéo du jour est épuisé).", "Google refuses AI video with this key: you need a Gemini key with billing enabled (or today's video quota is used up).", "ترفض Google إنشاء الفيديو بالذكاء الاصطناعي بهذا المفتاح: يلزم مفتاح Gemini مع تفعيل الفوترة (أو أن حصة الفيديو لهذا اليوم قد نفدت)."],
  ["Vidéo introuvable ou expirée.", "Video not found or expired.", "الفيديو غير موجود أو انتهت صلاحيته."],
  ["La vidéo n'est pas encore prête.", "The video is not ready yet.", "الفيديو ليس جاهزاً بعد."],
  ["La génération de la vidéo a échoué. Essaie une autre description.", "Video generation failed. Try another description.", "فشل إنشاء الفيديو. جرّب وصفاً آخر."],
  ["Le service IA de Google est surchargé. Réessaie dans un instant.", "Google's AI service is overloaded. Try again in a moment.", "خدمة الذكاء الاصطناعي من Google مثقلة حالياً. أعد المحاولة بعد قليل."],
  ["Ta clé Gemini n'est pas valide (mal copiée, expirée ou bloquée). Crée une nouvelle clé dans Google AI Studio et colle-la dans Paramètres.", "Your Gemini key is not valid (copied wrong, expired or blocked). Create a new key in Google AI Studio and paste it in Settings.", "مفتاح Gemini غير صالح (منسوخ بشكل خاطئ أو منتهي الصلاحية أو محظور). أنشئ مفتاحاً جديداً في Google AI Studio والصقه في الإعدادات."],
  ["Cet outil nécessite un plan actif. Abonne-toi pour débloquer tous les outils IA.", "This tool requires an active plan. Subscribe to unlock all AI tools.", "تتطلب هذه الأداة اشتراكاً نشطاً. اشترك لفتح جميع أدوات الذكاء الاصطناعي."],

  // Rate limits and OTP
  ["Trop de tentatives. Réessaie dans 15 minutes.", "Too many attempts. Try again in 15 minutes.", "محاولات كثيرة جدًا. أعد المحاولة بعد 15 دقيقة."],
  ["Trop de comptes créés depuis cette adresse. Réessaie plus tard.", "Too many accounts created from this address. Try again later.", "تم إنشاء حسابات كثيرة جدًا من هذا العنوان. أعد المحاولة لاحقًا."],
  ["Trop de codes essayés. Réessaie dans 15 minutes.", "Too many codes tried. Try again in 15 minutes.", "تمت تجربة رموز كثيرة جدًا. أعد المحاولة بعد 15 دقيقة."],
  ["Trop de demandes de code. Réessaie dans une minute.", "Too many code requests. Try again in a minute.", "طلبات الرمز كثيرة جدًا. أعد المحاولة بعد دقيقة."],
  ["Trop de demandes. Réessaie dans une minute.", "Too many requests. Try again in a minute.", "طلبات كثيرة جدًا. أعد المحاولة بعد دقيقة."],
  ["Trop de requêtes. Réessaie plus tard.", "Too many requests. Try again later.", "طلبات كثيرة جدًا. أعد المحاولة لاحقًا."],
  ["Un code a déjà été envoyé. Réessaie dans une minute.", "A code was already sent. Try again in a minute.", "تم إرسال رمز بالفعل. أعد المحاولة بعد دقيقة."],
  ["Trop de codes envoyés. Réessaie dans une heure.", "Too many codes sent. Try again in an hour.", "تم إرسال رموز كثيرة جدًا. أعد المحاولة بعد ساعة."],

  // Sign up, sign in, verification, password reset
  ["Le nom est requis.", "Name is required.", "الاسم مطلوب."],
  ["Adresse email invalide.", "Invalid email address.", "عنوان البريد الإلكتروني غير صالح."],
  ["Le mot de passe doit contenir au moins 8 caractères.", "The password must be at least 8 characters long.", "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل."],
  ["Erreur lors de la création du compte.", "Error while creating the account.", "حدث خطأ أثناء إنشاء الحساب."],
  ["Email et mot de passe requis.", "Email and password are required.", "البريد الإلكتروني وكلمة المرور مطلوبان."],
  ["Email ou mot de passe incorrect.", "Incorrect email or password.", "البريد الإلكتروني أو كلمة المرور غير صحيحة."],
  ["Erreur lors de la connexion.", "Error while signing in.", "حدث خطأ أثناء تسجيل الدخول."],
  ["Code et email requis.", "Code and email are required.", "الرمز والبريد الإلكتروني مطلوبان."],
  ["Code invalide ou expiré.", "Invalid or expired code.", "رمز غير صالح أو منتهي الصلاحية."],
  ["Erreur lors de la vérification.", "Error during verification.", "حدث خطأ أثناء التحقق."],
  ["Email requis.", "Email is required.", "البريد الإلكتروني مطلوب."],
  ["Erreur lors de l'envoi du code.", "Error while sending the code.", "حدث خطأ أثناء إرسال الرمز."],
  ["Email et code requis.", "Email and code are required.", "البريد الإلكتروني والرمز مطلوبان."],
  ["Tous les champs sont requis.", "All fields are required.", "جميع الحقول مطلوبة."],
  ["Lien expiré ou invalide. Recommence.", "Link expired or invalid. Start over.", "الرابط منتهي أو غير صالح. ابدأ من جديد."],
  ["Utilisateur introuvable.", "User not found.", "المستخدم غير موجود."],
  ["Authentification requise.", "Authentication required.", "المصادقة مطلوبة."],
  ["Non autorisé.", "Not authorized.", "غير مصرّح."],
  ["Accès réservé aux administrateurs.", "Access restricted to administrators.", "الوصول مخصص للمشرفين فقط."],

  // Plans and payment
  ["Plan invalide.", "Invalid plan.", "الباقة غير صالحة."],
  ["Un plan est déjà actif.", "A plan is already active.", "لديك اشتراك نشط بالفعل."],
  ["Preuve invalide.", "Invalid proof.", "إثبات الدفع غير صالح."],
  ["Format de preuve non supporté (image ou PDF).", "Unsupported proof format (image or PDF).", "صيغة الإثبات غير مدعومة (صورة أو PDF)."],
  ["La preuve dépasse 5 Mo.", "The proof exceeds 5 MB.", "إثبات الدفع يتجاوز 5 ميغابايت."],
  ["Méthode de paiement requise.", "Payment method is required.", "طريقة الدفع مطلوبة."],
  ["Méthode de paiement invalide.", "Invalid payment method.", "طريقة الدفع غير صالحة."],
  ["Preuve de paiement requise.", "Proof of payment is required.", "إثبات الدفع مطلوب."],

  // Contact form
  ["Nom invalide.", "Invalid name.", "الاسم غير صالح."],
  ["Email invalide.", "Invalid email.", "البريد الإلكتروني غير صالح."],
  ["Sujet invalide.", "Invalid subject.", "الموضوع غير صالح."],
  ["Le message doit contenir entre 10 et 5000 caractères.", "The message must be between 10 and 5000 characters.", "يجب أن تتراوح رسالتك بين 10 و5000 حرف."],
  ["Erreur lors de l'envoi. Réessaie.", "Error while sending. Try again.", "حدث خطأ أثناء الإرسال. أعد المحاولة."],

  // Settings, catalogue, history, sessions
  ["Valeur trop longue.", "Value too long.", "القيمة طويلة جدًا."],
  ["Erreur serveur.", "Server error.", "خطأ في الخادم."],
  ["name et category sont requis.", "name and category are required.", "الاسم والفئة مطلوبان."],
  ["Produit introuvable.", "Product not found.", "المنتج غير موجود."],
  ["type et title sont requis.", "type and title are required.", "النوع والعنوان مطلوبان."],
  ["Entrée introuvable.", "Entry not found.", "العنصر غير موجود."],
  ["Session introuvable.", "Session not found.", "الجلسة غير موجودة."],
  // projects, assets and brand kit
  ["Donne un nom au projet.", "Give the project a name.", "أعطِ المشروع اسماً."],
  ["Un des champs est trop long.", "One of the fields is too long.", "أحد الحقول طويل جداً."],
  ["Objectif de campagne invalide.", "Invalid campaign objective.", "هدف الحملة غير صالح."],
  ["Plateforme invalide.", "Invalid platform.", "منصة غير صالحة."],
  ["Langue invalide.", "Invalid language.", "لغة غير صالحة."],
  ["Statut de projet invalide.", "Invalid project status.", "حالة المشروع غير صالحة."],
  ["Type de contenu invalide.", "Invalid content type.", "نوع المحتوى غير صالح."],
  ["Contenu invalide.", "Invalid content.", "محتوى غير صالح."],
  ["Ce contenu est trop volumineux pour être enregistré.", "This content is too large to save.", "هذا المحتوى أكبر من أن يُحفظ."],
  ["Projet introuvable.", "Project not found.", "المشروع غير موجود."],
  ["Nombre maximum de projets atteint. Archive ou supprime des projets.", "You have reached the maximum number of projects. Archive or delete some.", "وصلت إلى الحد الأقصى من المشاريع. أرشف بعضها أو احذفها."],
  ["Catégorie de fichier invalide.", "Invalid file category.", "فئة الملف غير صالحة."],
  ["Seules les images JPG, PNG et WebP sont acceptées.", "Only JPG, PNG and WebP images are accepted.", "تُقبل صور JPG وPNG وWebP فقط."],
  ["Image trop lourde (3 Mo maximum).", "Image too large (3 MB maximum).", "الصورة كبيرة جداً (3 ميغابايت كحد أقصى)."],
  ["Espace de stockage plein. Supprime des fichiers dans la bibliothèque.", "Storage is full. Delete files in the library.", "مساحة التخزين ممتلئة. احذف بعض الملفات من المكتبة."],
  ["Ce projet contient déjà le nombre maximum de fichiers.", "This project already has the maximum number of files.", "يحتوي هذا المشروع على الحد الأقصى من الملفات."],
  ["Fichier introuvable.", "File not found.", "الملف غير موجود."],
  ["Trop d'envois. Réessaie dans une minute.", "Too many uploads. Try again in a minute.", "عمليات رفع كثيرة. أعد المحاولة بعد دقيقة."],
  ["Espace de sauvegarde plein. Supprime d’anciennes campagnes pour en enregistrer de nouvelles.", "Your save space is full. Delete old campaigns to save new ones.", "مساحة الحفظ ممتلئة. احذف حملات قديمة لحفظ حملات جديدة."],
  ["La publicité Meta de cette campagne n’a pas pu être mise en pause. Mets-la en pause (onglet Publier ou Gestionnaire de publicités) avant de supprimer la campagne.", "This campaign's Meta ad could not be paused. Pause it (Publish tab or Ads Manager) before deleting the campaign.", "تعذّر إيقاف إعلان Meta لهذه الحملة مؤقتاً. أوقفه من تبويب النشر أو من مدير الإعلانات قبل حذف الحملة."],
  ["Ce compte publicitaire n'est pas actif chez Meta. Choisis-en un autre ou règle le problème dans Meta Business.", "This ad account is not active at Meta. Pick another one or fix the problem in Meta Business.", "هذا الحساب الإعلاني غير نشط لدى Meta. اختر حساباً آخر أو عالج المشكلة في Meta Business."],
  ["Trop de messages envoyés. Réessaie dans une heure.", "Too many messages sent. Try again in an hour.", "أرسلت رسائل كثيرة. أعد المحاولة بعد ساعة."],
  ["Nombre maximum de sessions enregistrées atteint. Supprime d’anciennes sessions.", "You have reached the maximum number of saved sessions. Delete old ones.", "بلغت الحد الأقصى من الجلسات المحفوظة. احذف جلسات قديمة."],
  ["Couleurs invalides (6 codes hexadécimaux maximum).", "Invalid colours (6 hex codes maximum).", "ألوان غير صالحة (6 رموز سداسية كحد أقصى)."],
  ["Nom de police invalide.", "Invalid font name.", "اسم الخط غير صالح."],
  ["Style de marque invalide.", "Invalid brand style.", "نمط العلامة غير صالح."],
  ["Logo introuvable.", "Logo not found.", "الشعار غير موجود."],
  // Meta
  ["La connexion Meta n'est pas encore configurée sur ce site.", "Meta login is not set up on this site yet.", "ربط Meta غير مُعدّ على هذا الموقع بعد."],
  ["Connecte d'abord ton compte Meta.", "Connect your Meta account first.", "اربط حسابك على Meta أولاً."],
  ["Ta connexion Meta a expiré. Reconnecte ton compte.", "Your Meta connection has expired. Reconnect your account.", "انتهت صلاحية ربط Meta. أعد ربط حسابك."],
  ["La connexion Meta a échoué. Réessaie.", "Connecting to Meta failed. Try again.", "فشل الربط مع Meta. أعد المحاولة."],
  ["Compte publicitaire invalide.", "Invalid ad account.", "حساب إعلاني غير صالح."],
  ["Page Facebook invalide.", "Invalid Facebook Page.", "صفحة فيسبوك غير صالحة."],
  ["Objectif Meta invalide.", "Invalid Meta objective.", "هدف Meta غير صالح."],
  ["Une campagne de ventes demande l'identifiant de ton pixel Meta.", "A sales campaign needs your Meta pixel ID.", "تتطلب حملة المبيعات معرّف بكسل Meta الخاص بك."],
  ["Budget quotidien invalide.", "Invalid daily budget.", "ميزانية يومية غير صالحة."],
  ["La date de fin doit suivre la date de début.", "The end date must come after the start date.", "يجب أن يأتي تاريخ النهاية بعد تاريخ البداية."],
  ["Pays invalides (codes à 2 lettres, par exemple DZ).", "Invalid countries (2-letter codes, for example DZ).", "دول غير صالحة (رموز من حرفين، مثل DZ)."],
  ["Tranche d'âge invalide (13 à 65 ans).", "Invalid age range (13 to 65).", "فئة عمرية غير صالحة (من 13 إلى 65 سنة)."],
  ["Le lien doit être l'adresse https de ta page de vente.", "The link must be the https address of your sales page.", "يجب أن يكون الرابط عنوان https لصفحة البيع الخاصة بك."],
  ["Le texte et le titre de la publicité sont obligatoires.", "The ad text and headline are required.", "نص الإعلان وعنوانه إلزاميان."],
  ["Le visuel de la publicité est manquant ou invalide.", "The ad image is missing or invalid.", "صورة الإعلان مفقودة أو غير صالحة."],
  ["Confirme l'activation pour lancer la campagne.", "Confirm the activation to launch the campaign.", "أكّد التفعيل لإطلاق الحملة."],
  ["Campagne introuvable.", "Campaign not found.", "الحملة غير موجودة."],
  ["Meta a refusé la demande. Réessaie dans un instant.", "Meta refused the request. Try again in a moment.", "رفضت Meta الطلب. أعد المحاولة بعد قليل."],
];

// Messages written in English in the code: French users get a French text too.
const ENGLISH_SOURCED: Array<[string, string, string]> = [
  ["Failed to generate product info", "Impossible de générer les informations du produit.", "تعذّر إنشاء معلومات المنتج."],
  ["Missing 'contents' in request body", "Le contenu de la requête est manquant.", "محتوى الطلب مفقود."],
];

export const SERVER_MESSAGES: Record<string, ServerMessage> = {};
for (const [fr, en, ar] of FRENCH_SOURCED) SERVER_MESSAGES[fr] = { fr, en, ar };
for (const [en, fr, ar] of ENGLISH_SOURCED) SERVER_MESSAGES[en] = { fr, en, ar };

/** The language the browser says it displays in; French (the language of the original messages) when unknown. */
export function languageFromCookies(cookieHeader: string | undefined): Language {
  const match = new RegExp(`(?:^|;\\s*)${LANGUAGE_COOKIE}=([a-z]{2})(?:;|$)`).exec(cookieHeader ?? '');
  const value = match?.[1];
  return value === 'ar' || value === 'en' || value === 'fr' ? value : 'fr';
}

const translateText = (text: unknown, language: Language): unknown => {
  if (typeof text !== 'string') return text;
  return SERVER_MESSAGES[text]?.[language] ?? text;
};

/** Returns a copy of a JSON response with its `error` and `message` texts in `language`. Other bodies are returned as they are. */
export function localizeBody(body: unknown, language: Language): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const source = body as Record<string, unknown>;
  const error = translateText(source.error, language);
  const message = translateText(source.message, language);
  if (error === source.error && message === source.message) return body;
  return { ...source, ...(error !== source.error ? { error } : {}), ...(message !== source.message ? { message } : {}) };
}
