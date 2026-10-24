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
  // images made by another service than Gemini (src/lib/imageProviders.ts IMAGE_ERRORS) and its settings
  ["Ajoute la clé du service d'images choisi dans Paramètres.", "Add the key of the chosen image service in Settings.", "أضف مفتاح خدمة الصور المختارة في الإعدادات."],
  ["Le service d'images choisi refuse ta clé (mal copiée, expirée ou sans accès). Vérifie-la dans Paramètres.", "The chosen image service refuses your key (copied wrong, expired or without access). Check it in Settings.", "ترفض خدمة الصور المختارة مفتاحك (منسوخ بشكل خاطئ أو منتهي الصلاحية أو بدون صلاحية). تحقّق منه في الإعدادات."],
  ["Ton compte du service d'images choisi n'a plus de crédit, ou sa facturation n'est pas activée.", "Your account with the chosen image service has no credit left, or its billing is not enabled.", "لم يعد لحسابك في خدمة الصور المختارة رصيد، أو أن الفوترة غير مفعّلة."],
  ["Le service d'images est occupé ou ta limite est atteinte. Réessaie dans un instant.", "The image service is busy or your limit is reached. Try again in a moment.", "خدمة الصور مشغولة أو أنك بلغت حدّك. أعد المحاولة بعد قليل."],
  ["Le service d'images a refusé cette demande (règles de contenu). Essaie une autre photo ou une autre description.", "The image service refused this request (content rules). Try another photo or another description.", "رفضت خدمة الصور هذا الطلب (قواعد المحتوى). جرّب صورة أو وصفاً آخر."],
  ["Le service d'images n'a pas pu créer l'image. Réessaie.", "The image service could not create the image. Try again.", "لم تتمكن خدمة الصور من إنشاء الصورة. أعد المحاولة."],
  ["Ce service ne peut pas partir de ta photo : il ne garderait pas ton produit. Choisis Gemini, OpenAI ou FLUX dans Paramètres.", "This service cannot start from your photo: it would not keep your product. Choose Gemini, OpenAI or FLUX in Settings.", "لا تستطيع هذه الخدمة الانطلاق من صورتك: لن تحافظ على منتجك. اختر Gemini أو OpenAI أو FLUX في الإعدادات."],
  ["Demande d'image invalide.", "Invalid image request.", "طلب صورة غير صالح."],
  ["Cloudflare demande une photo de moins de 512 px de côté. Recharge la page et réessaie : elle sera réduite toute seule.", "Cloudflare needs a photo under 512 px a side. Reload the page and try again: it will be shrunk on its own.", "يطلب Cloudflare صورة أقل من 512 بكسل لكل ضلع. أعد تحميل الصفحة وحاول مجدداً: سيتم تصغيرها تلقائياً."],
  ["Gemini est le service d'images choisi : cette demande passe par Gemini.", "Gemini is the chosen image service: this request goes through Gemini.", "Gemini هي خدمة الصور المختارة: يمرّ هذا الطلب عبر Gemini."],
  ["Identifiant de compte Cloudflare invalide (32 caractères 0-9 et a-f).", "Invalid Cloudflare account ID (32 characters, 0-9 and a-f).", "معرّف حساب Cloudflare غير صالح (32 حرفاً من 0-9 و a-f)."],
  ["Service d'images inconnu.", "Unknown image service.", "خدمة صور غير معروفة."],
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
  // points (src/lib/credits.ts, src/routes/credits.ts)
  ["Pas assez de points pour cette action. Recharge tes points.", "Not enough points for this. Top up your points.", "نقاطك لا تكفي لهذا الإجراء. أعد شحن نقاطك."],
  ["Réglages des points invalides : des nombres entiers, et au moins un pack.", "Invalid points settings: whole numbers, and at least one pack.", "إعدادات النقاط غير صالحة: أعداد صحيحة، وباقة واحدة على الأقل."],
  ["Pack de points invalide.", "Invalid points pack.", "باقة النقاط غير صالحة."],
  ["Tu as déjà un achat de points en attente de vérification.", "You already have a points purchase waiting for review.", "لديك بالفعل عملية شراء نقاط في انتظار التحقق."],
  ["Achat introuvable.", "Purchase not found.", "عملية الشراء غير موجودة."],
  ["Cet achat a déjà été traité.", "This purchase has already been handled.", "تمت معالجة عملية الشراء هذه بالفعل."],
  ["Nombre de points invalide.", "Invalid number of points.", "عدد النقاط غير صالح."],
  ["Aucun compte avec cet email.", "No account with this email.", "لا يوجد حساب بهذا البريد الإلكتروني."],
  ["Clé Gemini invalide.", "Invalid Gemini key.", "مفتاح Gemini غير صالح."],
  // text engines (src/lib/textEngines.ts)
  ["Ajoute la clé du moteur IA choisi dans Paramètres (ou choisis Google Gemini).", "Add the key of the chosen AI engine in Settings (or choose Google Gemini).", "أضف مفتاح محرك الذكاء الاصطناعي المختار في الإعدادات (أو اختر Google Gemini)."],
  ["La clé du moteur IA choisi est refusée : vérifie-la dans Paramètres.", "The chosen AI engine refuses the key: check it in Settings.", "مفتاح محرك الذكاء الاصطناعي المختار مرفوض: تحقق منه في الإعدادات."],
  ["Le moteur IA choisi refuse : plus de crédit ou facturation à activer sur ton compte chez ce service.", "The chosen AI engine refuses: no credit left, or billing must be enabled on your account with that service.", "يرفض محرك الذكاء الاصطناعي المختار: نفد الرصيد أو يجب تفعيل الفوترة في حسابك لدى هذه الخدمة."],
  ["Le moteur IA choisi est surchargé ou ton quota est atteint. Réessaie dans un moment.", "The chosen AI engine is overloaded or your quota is reached. Try again in a moment.", "محرك الذكاء الاصطناعي المختار مزدحم أو بلغت حصتك. أعد المحاولة بعد قليل."],
  ["Ce modèle n'existe pas chez le moteur IA choisi, ou ta clé n'y a pas accès : choisis-en un autre dans Paramètres.", "This model does not exist with the chosen AI engine, or your key cannot use it: choose another one in Settings.", "هذا النموذج غير موجود لدى المحرك المختار، أو لا يملك مفتاحك صلاحية استعماله: اختر نموذجاً آخر في الإعدادات."],
  ["Le moteur IA choisi n'a pas pu répondre. Réessaie.", "The chosen AI engine could not answer. Try again.", "تعذّر على محرك الذكاء الاصطناعي المختار الرد. أعد المحاولة."],
  ["Le moteur IA a refusé cette demande. Reformule-la.", "The AI engine refused this request. Rephrase it.", "رفض محرك الذكاء الاصطناعي هذا الطلب. أعد صياغته."],
  ["Moteur IA inconnu.", "Unknown AI engine.", "محرك ذكاء اصطناعي غير معروف."],
  ["Nom de modèle invalide.", "Invalid model name.", "اسم النموذج غير صالح."],

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
