import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// credits: points for the AI on the platform's key (src/lib/credits.ts), in the app and in /admin.
export const creditsTranslations: TranslationDictionary = {
  crdBalance: {
    fr: "Ton solde",
    ar: "رصيدك",
    en: "Your balance",
  },
  crdPointsWord: {
    fr: "points",
    ar: "نقطة",
    en: "points",
  },
  crdPackPoints: {
    fr: "{points} points",
    ar: "{points} نقطة",
    en: "{points} points",
  },
  crdSidebarPoints: {
    fr: "{count} points",
    ar: "{count} نقطة",
    en: "{count} points",
  },
  crdPts: {
    fr: "{count} pts",
    ar: "{count} نقطة",
    en: "{count} pts",
  },
  crdTopUp: {
    fr: "Recharger",
    ar: "إعادة الشحن",
    en: "Top up",
  },
  crdBack: {
    fr: "Retour",
    ar: "رجوع",
    en: "Back",
  },
  crdIntro: {
    fr: "Pas de clé Gemini ? Utilise l’IA avec des points : achète un pack, et chaque génération décompte ses points.",
    ar: "ليس لديك مفتاح Gemini؟ استعمل الذكاء الاصطناعي بالنقاط: اشترِ باقة، وكل عملية إنشاء تخصم نقاطها.",
    en: "No Gemini key? Use the AI with points: buy a pack, and each generation takes its points.",
  },
  crdOwnKeyNote: {
    fr: "Tu utilises ta propre clé Gemini : tes générations ne coûtent pas de points. Les points servent si tu retires ta clé.",
    ar: "أنت تستعمل مفتاح Gemini الخاص بك: لا تكلّفك عمليات الإنشاء أي نقاط. تُستعمل النقاط إذا أزلت مفتاحك.",
    en: "You use your own Gemini key: your generations cost no points. Points are used if you remove your key.",
  },
  crdCostText: {
    fr: "texte, par {tokens} tokens",
    ar: "نص، لكل {tokens} رمز",
    en: "text, per {tokens} tokens",
  },
  crdCostImage: {
    fr: "par image IA",
    ar: "لكل صورة",
    en: "per AI image",
  },
  crdCostVideo: {
    fr: "par seconde de vidéo IA",
    ar: "لكل ثانية فيديو",
    en: "per second of AI video",
  },
  crdUnavailable: {
    fr: "L’achat de points n’est pas encore ouvert. Ajoute ta clé Gemini dans Paramètres, ou reviens plus tard.",
    ar: "شراء النقاط غير متاح بعد. أضف مفتاح Gemini في الإعدادات، أو عد لاحقاً.",
    en: "Buying points is not open yet. Add your Gemini key in Settings, or come back later.",
  },
  crdPendingNote: {
    fr: "Ton achat de {points} points est en attente de vérification. Les points seront ajoutés dès qu’un admin l’aura approuvé.",
    ar: "عملية شراء {points} نقطة في انتظار التحقق. ستُضاف النقاط فور موافقة المسؤول.",
    en: "Your purchase of {points} points is waiting for review. The points will be added as soon as an admin approves it.",
  },
  crdChoosePack: {
    fr: "Choisis un pack",
    ar: "اختر باقة",
    en: "Choose a pack",
  },
  crdPerPoint: {
    fr: "{price} le point",
    ar: "{price} للنقطة",
    en: "{price} per point",
  },
  crdPayAmount: {
    fr: "Montant à payer :",
    ar: "المبلغ المطلوب دفعه:",
    en: "Amount to pay:",
  },
  crdRemoveProof: {
    fr: "Retirer la preuve",
    ar: "إزالة الإثبات",
    en: "Remove the proof",
  },
  crdDoneText: {
    fr: "Ta preuve est envoyée. Tes points seront ajoutés dès qu’un admin aura vérifié le paiement.",
    ar: "تم إرسال الإثبات. ستُضاف نقاطك فور تحقق المسؤول من الدفع.",
    en: "Your proof is sent. Your points will be added as soon as an admin has checked the payment.",
  },
  crdSidebarOwnKey: {
    fr: "Ta clé Gemini est utilisée",
    ar: "يُستعمل مفتاح Gemini الخاص بك",
    en: "Your Gemini key is used",
  },
  crdSidebarPending: {
    fr: "Achat en vérification",
    ar: "الشراء قيد التحقق",
    en: "Purchase under review",
  },
  crdImageCostLine: {
    fr: "Coût : {each} points par image · ton solde : {balance} points.",
    ar: "التكلفة: {each} نقطة للصورة · رصيدك: {balance} نقطة.",
    en: "Cost: {each} points per image · your balance: {balance} points.",
  },
  crdVideoIntro: {
    fr: "L'IA filme une vraie vidéo avec musique pour chaque scène (environ 8 s), à partir de ta photo ; tes textes sont ajoutés par-dessus. Avec tes points : {perScene} points par scène, soit {total} points pour les scènes restantes (solde : {balance}).",
    ar: "يصوّر الذكاء الاصطناعي فيديو حقيقياً مع موسيقى لكل مشهد (حوالي 8 ثوانٍ) انطلاقاً من صورتك، وتُضاف نصوصك فوقه. بنقاطك: {perScene} نقطة لكل مشهد، أي {total} نقطة للمشاهد المتبقية (الرصيد: {balance}).",
    en: "The AI films a real video with music for each scene (about 8 s), starting from your photo; your words are added on top. With your points: {perScene} points per scene, so {total} points for the remaining scenes (balance: {balance}).",
  },
  crdAttLow: {
    fr: "Il te reste {balance} points et pas de clé Gemini : recharge tes points pour continuer à générer.",
    ar: "بقي لديك {balance} نقطة ولا مفتاح Gemini لديك: أعد شحن نقاطك لمواصلة الإنشاء.",
    en: "You have {balance} points left and no Gemini key: top up your points to keep generating.",
  },
  crdAdmTitle: {
    fr: "Points",
    ar: "النقاط",
    en: "Points",
  },
  crdAdmStatPurchases: {
    fr: "Packs vendus ({days} j)",
    ar: "الباقات المباعة ({days} يوماً)",
    en: "Packs sold ({days} d)",
  },
  crdAdmStatRevenue: {
    fr: "Encaissé ({days} j)",
    ar: "المبالغ المحصّلة ({days} يوماً)",
    en: "Collected ({days} d)",
  },
  crdAdmStatUsed: {
    fr: "Points utilisés ({days} j)",
    ar: "النقاط المستعملة ({days} يوماً)",
    en: "Points used ({days} d)",
  },
  crdAdmKeyTitle: {
    fr: "Ta clé Gemini (pour les points)",
    ar: "مفتاح Gemini الخاص بك (للنقاط)",
    en: "Your Gemini key (for points)",
  },
  crdAdmKeyText: {
    fr: "Les vendeurs sans clé utilisent celle-ci et paient en points. Elle est chiffrée et ne quitte jamais le serveur. Elle doit avoir la facturation activée chez Google.",
    ar: "يستعمل البائعون الذين ليس لديهم مفتاح هذا المفتاح ويدفعون بالنقاط. هو مشفّر ولا يغادر الخادم أبداً. يجب تفعيل الفوترة عليه لدى Google.",
    en: "Sellers without a key use this one and pay in points. It is encrypted and never leaves the server. It must have billing enabled at Google.",
  },
  crdAdmKeySet: {
    fr: "Clé enregistrée :",
    ar: "المفتاح المسجّل:",
    en: "Saved key:",
  },
  crdAdmKeyMissing: {
    fr: "Aucune clé : les points ne peuvent pas encore être achetés.",
    ar: "لا يوجد مفتاح: لا يمكن شراء النقاط بعد.",
    en: "No key: points cannot be bought yet.",
  },
  crdAdmKeyInput: {
    fr: "Nouvelle clé Gemini",
    ar: "مفتاح Gemini جديد",
    en: "New Gemini key",
  },
  crdAdmKeySave: {
    fr: "Enregistrer la clé",
    ar: "حفظ المفتاح",
    en: "Save the key",
  },
  crdAdmKeyRemove: {
    fr: "Retirer",
    ar: "حذف",
    en: "Remove",
  },
  crdAdmKeyRemoveConfirm: {
    fr: "Retirer la clé ? Les vendeurs sans clé ne pourront plus utiliser leurs points.",
    ar: "حذف المفتاح؟ لن يتمكن البائعون الذين ليس لديهم مفتاح من استعمال نقاطهم.",
    en: "Remove the key? Sellers without a key will no longer be able to use their points.",
  },
  crdAdmPricesTitle: {
    fr: "Prix en points et packs",
    ar: "الأسعار بالنقاط والباقات",
    en: "Prices in points and packs",
  },
  crdAdmTextCost: {
    fr: "Texte : points par {tokens} tokens",
    ar: "النص: نقاط لكل {tokens} رمز",
    en: "Text: points per {tokens} tokens",
  },
  crdAdmImageCost: {
    fr: "Image IA : points par image",
    ar: "الصورة: نقاط لكل صورة",
    en: "AI image: points per image",
  },
  crdAdmVideoCost: {
    fr: "Vidéo IA : points par seconde",
    ar: "الفيديو: نقاط لكل ثانية",
    en: "AI video: points per second",
  },
  crdAdmMargin: {
    fr: "Coût Google ≈ {cost} DA · marge ×{margin}",
    ar: "تكلفة Google ≈ {cost} دج · الهامش ×{margin}",
    en: "Google cost ≈ {cost} DA · margin ×{margin}",
  },
  crdAdmMarginNote: {
    fr: "Marge calculée avec le point le moins cher de tes packs, à environ 250 DA le dollar. Visé : ×2 au moins.",
    ar: "الهامش محسوب بأرخص نقطة في باقاتك، على أساس 250 دج للدولار تقريباً. الهدف: ×2 على الأقل.",
    en: "Margin worked out with the cheapest point of your packs, at about 250 DA a dollar. Aim: at least ×2.",
  },
  crdAdmPacks: {
    fr: "Packs",
    ar: "الباقات",
    en: "Packs",
  },
  crdAdmPackPoints: {
    fr: "Points",
    ar: "النقاط",
    en: "Points",
  },
  crdAdmPackPrice: {
    fr: "Prix ({currency})",
    ar: "السعر ({currency})",
    en: "Price ({currency})",
  },
  crdAdmPackRemove: {
    fr: "Retirer ce pack",
    ar: "حذف هذه الباقة",
    en: "Remove this pack",
  },
  crdAdmPackAdd: {
    fr: "Ajouter un pack",
    ar: "إضافة باقة",
    en: "Add a pack",
  },
  crdAdmPendingTitle: {
    fr: "Achats de points à vérifier",
    ar: "مشتريات النقاط للتحقق",
    en: "Points purchases to check",
  },
  crdAdmPendingEmpty: {
    fr: "Aucun achat en attente",
    ar: "لا توجد مشتريات في الانتظار",
    en: "No purchase waiting",
  },
  crdAdmPendingLine: {
    fr: "{points} points · {price} · {method} · {date}",
    ar: "{points} نقطة · {price} · {method} · {date}",
    en: "{points} points · {price} · {method} · {date}",
  },
  crdAdmSeeProof: {
    fr: "Voir la preuve",
    ar: "عرض الإثبات",
    en: "See the proof",
  },
  crdAdmReject: {
    fr: "Refuser",
    ar: "رفض",
    en: "Reject",
  },
  crdAdmGrantTitle: {
    fr: "Ajouter des points à la main",
    ar: "إضافة نقاط يدوياً",
    en: "Add points by hand",
  },
  crdAdmGrantText: {
    fr: "Pour un paiement reçu autrement, un cadeau ou une correction. Un nombre négatif retire des points.",
    ar: "لدفعة استُلمت بطريقة أخرى، أو هدية، أو تصحيح. العدد السالب يسحب النقاط.",
    en: "For a payment received another way, a gift or a correction. A negative number takes points back.",
  },
  crdAdmGrantEmail: {
    fr: "Email du compte",
    ar: "البريد الإلكتروني للحساب",
    en: "Account email",
  },
  crdAdmGrantSend: {
    fr: "Ajouter",
    ar: "إضافة",
    en: "Add",
  },
  crdAdmGranted: {
    fr: "Fait : ce compte a maintenant {balance} points.",
    ar: "تم: لدى هذا الحساب الآن {balance} نقطة.",
    en: "Done: this account now has {balance} points.",
  },
  crdFreeAdmin: {
    fr: "gratuit (admin)",
    ar: "مجاني (مسؤول)",
    en: "free (admin)",
  },
  crdPtsRange: {
    fr: "≈ {min} à {max} pts",
    ar: "≈ من {min} إلى {max} نقطة",
    en: "≈ {min} to {max} pts",
  },
};

registerTranslations('credits', creditsTranslations);
