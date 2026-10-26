import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// checkout: interface text, generated from the components and then maintained by hand.
export const checkoutTranslations: TranslationDictionary = {
  coProofSendFailed: {
    fr: "Impossible d'envoyer la preuve. Réessaie.",
    ar: "تعذّر إرسال إثبات الدفع. أعد المحاولة.",
    en: "Couldn't send the proof. Try again.",
  },
  coCustomPlan: {
    fr: "Plan personnalisé",
    ar: "باقة مخصصة",
    en: "Custom plan",
  },
  coPlanLine: {
    fr: "Plan **{label}** — {price}",
    ar: "الباقة **{label}** — {price}",
    en: "**{label}** plan — {price}",
  },
  coPlanLineBold: {
    fr: "Plan **{label}** — **{price}**",
    ar: "الباقة **{label}** — **{price}**",
    en: "**{label}** plan — **{price}**",
  },
  coContactToFinish: {
    fr: "Contacte-nous sur {email} pour finaliser.",
    ar: "تواصل معنا على {email} لإتمام العملية.",
    en: "Contact us at {email} to finish.",
  },
  coBeneficiary: {
    fr: "Bénéficiaire",
    ar: "المستفيد",
    en: "Beneficiary",
  },
  coIdNumber: {
    fr: "N° d'identifiant",
    ar: "رقم التعريف",
    en: "ID number",
  },
  coBankReference: {
    fr: "**Référence :** Envoie ton email dans le motif du virement.",
    ar: "**المرجع:** أرسل بريدك الإلكتروني في خانة سبب التحويل.",
    en: "**Reference:** Put your email in the transfer reason.",
  },
  coEmailSubject: {
    fr: "En objet : **Ton email + \"Plan {label}\"**",
    ar: "في الموضوع: **بريدك الإلكتروني + «باقة {label}»**",
    en: "Subject: **Your email + \"{label} plan\"**",
  },
  coProofReceived: {
    fr: "Ta preuve de paiement a bien été reçue. Un **administrateur** va vérifier ton paiement puis activer ton plan.",
    ar: "تم استلام إثبات الدفع. سيتحقق **مشرف** من دفعتك ثم يفعّل باقتك.",
    en: "We received your proof of payment. An **administrator** will check your payment, then activate your plan.",
  },
  coFichierTropVolumineuxMax: {
    fr: "Fichier trop volumineux (max 5 Mo).",
    ar: "الملف كبير جدًا (الحد الأقصى 5 ميغابايت).",
    en: "File too large (max 5 MB).",
  },
  coFichierIllisibleChoisisAutre: {
    fr: "Fichier illisible. Choisis une autre image.",
    ar: "تعذّرت قراءة الملف. اختر صورة أخرى.",
    en: "Unreadable file. Choose another image.",
  },
  coVeuillezJoindrePreuvePaiement: {
    fr: "Veuillez joindre une preuve de paiement.",
    ar: "يرجى إرفاق إثبات الدفع.",
    en: "Please attach a proof of payment.",
  },
  coPaiementEnregistreAttenteVerif: {
    fr: "Paiement enregistré — en attente de vérification.",
    ar: "تم تسجيل الدفع — بانتظار التحقق.",
    en: "Payment recorded — awaiting verification.",
  },
  coPlanActif: {
    fr: "Plan actif",
    ar: "الباقة نشطة",
    en: "Active plan",
  },
  coVotreAbonnementEstCours: {
    fr: "Votre abonnement est en cours.",
    ar: "اشتراكك ساري المفعول.",
    en: "Your subscription is active.",
  },
  coChoisirPlan: {
    fr: "Choisir un plan",
    ar: "اختر باقة",
    en: "Choose a plan",
  },
  coSelectionneLOffreQui: {
    fr: "Sélectionne l'offre qui te convient.",
    ar: "اختر العرض الذي يناسبك.",
    en: "Pick the offer that suits you.",
  },
  coModePaiement: {
    fr: "Mode de paiement",
    ar: "طريقة الدفع",
    en: "Payment method",
  },
  coAucuneMethodePaiementDisponibl: {
    fr: "Aucune méthode de paiement disponible pour le moment.",
    ar: "لا توجد طريقة دفع متاحة حاليًا.",
    en: "No payment method is available right now.",
  },
  coInstructionsPaiement: {
    fr: "Instructions de paiement",
    ar: "تعليمات الدفع",
    en: "Payment instructions",
  },
  coInformationsBancaires: {
    fr: "Informations bancaires",
    ar: "المعلومات البنكية",
    en: "Bank details",
  },
  coMontant: {
    fr: "Montant",
    ar: "المبلغ",
    en: "Amount",
  },
  coEnvoieMontant: {
    fr: "Envoie le montant à :",
    ar: "أرسل المبلغ إلى:",
    en: "Send the amount to:",
  },
  coCliqueUploaderPreuve: {
    fr: "Clique pour uploader ta preuve",
    ar: "انقر لرفع إثبات الدفع",
    en: "Click to upload your proof",
  },
  coPdfImageMax5: {
    fr: "PDF ou image · max 5 Mo",
    ar: "PDF أو صورة · الحد الأقصى 5 ميغابايت",
    en: "PDF or image · max 5 MB",
  },
  coEnvoiCours: {
    fr: "Envoi en cours...",
    ar: "جارٍ الإرسال...",
    en: "Sending...",
  },
  coJAiEffectuePaiement: {
    fr: "J'ai effectué le paiement",
    ar: "لقد أجريت الدفع",
    en: "I've made the payment",
  },
  coEnAttenteDApprobation: {
    fr: "En attente d'approbation",
    ar: "بانتظار الموافقة",
    en: "Awaiting approval",
  },
  coTonAccesSeraDebloque: {
    fr: "Ton accès sera débloqué automatiquement dès l'approbation. Merci de patienter.",
    ar: "سيُفتح وصولك تلقائيًا فور الموافقة. شكرًا لصبرك.",
    en: "Your access will unlock automatically once approved. Thanks for your patience.",
  },
  coUneQuestion: {
    fr: "Une question ?",
    ar: "هل لديك سؤال؟",
    en: "A question?",
  },
  coFermer: {
    fr: "Fermer",
    ar: "إغلاق",
    en: "Close",
  },
  coPaymentFallback: {
    fr: "Paiement",
    ar: "الدفع",
    en: "Payment",
  },
  coExpiresOn: {
    fr: "Expire le {date}",
    ar: "ينتهي في {date}",
    en: "Expires on {date}",
  },
  coCountdown: {
    fr: "{days}j {hours}h {minutes}min {seconds}s",
    ar: "{days} ي {hours} س {minutes} د {seconds} ث",
    en: "{days}d {hours}h {minutes}m {seconds}s",
  },
  coPaidMessage: {
    fr: "Bonjour, je viens de payer le plan {plan} ({price}) via {method}.\n\nMon compte : {email}\nJ'attends la vérification de mon paiement.",
    ar: "مرحباً، لقد دفعت للتو باقة {plan} ({price}) عبر {method}.\n\nحسابي: {email}\nفي انتظار التحقق من دفعتي.",
    en: "Hello, I have just paid for the {plan} plan ({price}) via {method}.\n\nMy account: {email}\nI am waiting for my payment to be verified.",
  },
};

registerTranslations('checkout', checkoutTranslations);
