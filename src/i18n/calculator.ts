import { registerTranslations } from './registry';
import type { TranslationDictionary } from './types';

// calculator: interface text, generated from the components and then maintained by hand.
export const calculatorTranslations: TranslationDictionary = {
  calcInsightUrgent: {
    fr: "Votre rentabilité est épuisée par les coûts fixes. **Action immédiate :** Augmentez votre prix de vente d'au moins 400-600 DZD ou négociez le prix d'achat fournisseur. Si le marché refuse, testez un **Upsell obligatoire** (ex: \"Acheter 2 = Livraison Gratuite\").",
    ar: "ربحيتك تلتهمها التكاليف الثابتة. **إجراء فوري:** ارفع سعر البيع بما لا يقل عن 400-600 DZD أو فاوض المورّد على سعر الشراء. وإن رفض السوق ذلك، جرّب **عرضًا إضافيًا إلزاميًا** (مثال: «اشترِ 2 = توصيل مجاني»).",
    en: "Your profitability is eaten up by fixed costs. **Immediate action:** Raise your selling price by at least 400-600 DZD or negotiate the supplier's purchase price. If the market refuses, test a **mandatory upsell** (e.g. \"Buy 2 = Free Delivery\").",
  },
  calcInsightStable: {
    fr: "Votre business survit mais ne scale pas encore. **Stratégie :** Travaillez sur votre \"Order Bump\" au téléphone pour augmenter le panier moyen de 30% sans augmenter vos frais publicitaires.",
    ar: "نشاطك يصمد لكنه لا يتوسّع بعد. **الاستراتيجية:** اشتغل على «عرض الإضافة عند الطلب» (Order Bump) أثناء المكالمة الهاتفية لرفع متوسط السلة بنسبة 30% دون زيادة نفقات الإعلان.",
    en: "Your business is surviving but not scaling yet. **Strategy:** Work on your phone \"Order Bump\" to raise the average basket by 30% without increasing your ad spend.",
  },
  calcInsightCash: {
    fr: "Rentabilité exceptionnelle. **Scale Immédiat :** Augmentez votre budget publicitaire quotidien de 20% tous les 2 jours tant que le CPA reste stable. Introduisez des **Bundles (Packs)** pour maximiser le profit net par colis livré.",
    ar: "ربحية استثنائية. **توسّع فورًا:** ارفع ميزانية الإعلانات اليومية بنسبة 20% كل يومين ما دامت تكلفة الاكتساب (CPA) مستقرة. قدّم **حزمًا (Packs)** لزيادة صافي الربح لكل طرد مُسلَّم.",
    en: "Exceptional profitability. **Scale now:** Raise your daily ad budget by 20% every 2 days as long as the CPA stays stable. Introduce **bundles (packs)** to maximise the net profit per delivered parcel.",
  },
  calcInsightLeads: {
    fr: "Votre taux de confirmation est sous la moyenne (75%). **Recrutez un agent** dédié qui rappelle les commandes en moins de 15 minutes. Le \"Speed to Lead\" est votre premier moteur de croissance.",
    ar: "نسبة التأكيد لديك أقل من المتوسط (75%). **وظّف موظفًا مخصصًا** يعاود الاتصال بالطلبات خلال 15 دقيقة. «السرعة في الرد على العميل» (Speed to Lead) هي أول محرّك لنموّك.",
    en: "Your confirmation rate is below average (75%). **Hire a dedicated agent** who calls orders back within 15 minutes. \"Speed to Lead\" is your first growth engine.",
  },
  calcInsightLogistics: {
    fr: "Taux de retour trop élevé. Désactivez les wilayas du Sud si vous n'avez pas de transporteur fiable là-bas. Activez l'envoi de **SMS automatisés** à chaque étape (Expédié / Arrivé au bureau).",
    ar: "نسبة الإرجاع مرتفعة جدًا. عطّل ولايات الجنوب إن لم يكن لديك ناقل موثوق هناك. فعّل إرسال **رسائل SMS تلقائية** عند كل مرحلة (تم الشحن / وصل إلى المكتب).",
    en: "Return rate too high. Disable the southern wilayas if you have no reliable carrier there. Turn on **automated SMS** at each step (Shipped / Arrived at the office).",
  },
  calcInsightElite: {
    fr: "Votre taux de livraison est excellent. C'est le moment d'investir dans un **Stock plus important** pour réduire vos coûts d'achat unitaires et exploser vos marges.",
    ar: "نسبة التسليم لديك ممتازة. حان وقت الاستثمار في **مخزون أكبر** لخفض تكلفة الشراء للوحدة ومضاعفة هوامشك.",
    en: "Your delivery rate is excellent. It's time to invest in a **larger stock** to lower your unit purchase costs and boost your margins.",
  },
  calcInsightAds: {
    fr: "Votre budget pub dévore vos profits. Retestez vos créatives (vidéos UGC) ou simplifiez votre page de vente. Un bon produit en Algérie doit avoir un CPA < 15% du prix de vente.",
    ar: "ميزانية الإعلانات تلتهم أرباحك. أعد اختبار موادك الإعلانية (فيديوهات UGC) أو بسّط صفحة البيع. المنتج الجيد في الجزائر ينبغي أن تقل تكلفة اكتسابه (CPA) عن 15% من سعر البيع.",
    en: "Your ad budget is eating your profits. Re-test your creatives (UGC videos) or simplify your sales page. A good product in Algeria should have a CPA below 15% of the selling price.",
  },
  calcGoalBasket: {
    fr: "**Panier moyen :** Visez {amount} DZD minimum.",
    ar: "**متوسط السلة:** استهدف {amount} DZD على الأقل.",
    en: "**Average basket:** Aim for at least {amount} DZD.",
  },
  calcGoalConfirm: {
    fr: "**Confirmation :** Ciblez 85%+ avec une équipe dédiée.",
    ar: "**التأكيد:** استهدف 85%+ بفريق مخصص.",
    en: "**Confirmation:** Target 85%+ with a dedicated team.",
  },
  calcGoalReturns: {
    fr: "**Frais de retour :** Ne doivent pas dépasser 15% de votre CA brut.",
    ar: "**تكاليف الإرجاع:** يجب ألا تتجاوز 15% من رقم أعمالك الإجمالي.",
    en: "**Return costs:** Must not exceed 15% of your gross revenue.",
  },
  calcOptimisezProfitsMarcheAlgerien: {
    fr: "Optimisez vos profits sur le marché algérien",
    ar: "عظّم أرباحك في السوق الجزائري",
    en: "Maximise your profits on the Algerian market",
  },
  calcParametresVente: {
    fr: "Paramètres de Vente",
    ar: "إعدادات البيع",
    en: "Sales settings",
  },
  calcPrixVenteDzd: {
    fr: "Prix de Vente (DZD)",
    ar: "سعر البيع (DZD)",
    en: "Selling price (DZD)",
  },
  calcCoutProduitAchatDzd: {
    fr: "Coût Produit (Achat DZD)",
    ar: "تكلفة المنتج (سعر الشراء بالدينار)",
    en: "Product cost (purchase price, DZD)",
  },
  calcCoutLivraisonMoyenDzd: {
    fr: "Coût Livraison Moyen (DZD)",
    ar: "متوسط تكلفة التوصيل (DZD)",
    en: "Average delivery cost (DZD)",
  },
  calcCoutPublicitaireParLead: {
    fr: "Coût Publicitaire par Lead (DZD)",
    ar: "تكلفة الإعلان لكل عميل محتمل (DZD)",
    en: "Ad cost per lead (DZD)",
  },
  calcTauxConfirmation: {
    fr: "Taux de Confirmation (%)",
    ar: "نسبة التأكيد (%)",
    en: "Confirmation rate (%)",
  },
  calcTauxLivraison: {
    fr: "Taux de Livraison (%)",
    ar: "نسبة التسليم (%)",
    en: "Delivery rate (%)",
  },
  calcProfitNetLead: {
    fr: "Profit net / lead",
    ar: "صافي الربح / عميل محتمل",
    en: "Net profit / lead",
  },
  calcMargeBrute: {
    fr: "Marge brute",
    ar: "الهامش الإجمالي",
    en: "Gross margin",
  },
  calcAnalyseBusiness: {
    fr: "Analyse du Business",
    ar: "تحليل النشاط التجاري",
    en: "Business analysis",
  },
  calcSuccesLivraison: {
    fr: "Succès Livraison",
    ar: "نجاح التسليم",
    en: "Delivery success",
  },
  calcMoyenneMarche: {
    fr: "Moyenne Marché",
    ar: "متوسط السوق",
    en: "Market average",
  },
  calcInsightsActionnables: {
    fr: "Insights actionnables",
    ar: "توصيات قابلة للتنفيذ",
    en: "Actionable insights",
  },
  calcEtatDUrgenceMarge: {
    fr: "État d'Urgence (Marge < 15%)",
    ar: "حالة طوارئ (الهامش أقل من 15%)",
    en: "Emergency (margin below 15%)",
  },
  calcEnPhaseStabilisation15: {
    fr: "En Phase de Stabilisation (15-30%)",
    ar: "في مرحلة الاستقرار (15-30%)",
    en: "Stabilising (15-30%)",
  },
  calcMachineCash30: {
    fr: "Machine à Cash (> 30%)",
    ar: "آلة أرباح (أكثر من 30%)",
    en: "Cash machine (above 30%)",
  },
  calcFuiteLeads: {
    fr: "Fuite de Leads",
    ar: "تسرّب العملاء المحتملين",
    en: "Lead leakage",
  },
  calcLogistiqueCritique: {
    fr: "Logistique critique",
    ar: "لوجستيات حرجة",
    en: "Critical logistics",
  },
  calcLogistiqueDElite: {
    fr: "Logistique d'élite",
    ar: "لوجستيات ممتازة",
    en: "Elite logistics",
  },
  calcMarketingInefficace: {
    fr: "Marketing inefficace",
    ar: "تسويق غير فعّال",
    en: "Ineffective marketing",
  },
  calcObjectifsRecommandesAlgerie: {
    fr: "Objectifs Recommandés (Algérie)",
    ar: "الأهداف الموصى بها (الجزائر)",
    en: "Recommended targets (Algeria)",
  },
  calcPerformance: {
    fr: "Performance",
    ar: "الأداء",
    en: "Performance",
  },
  calcBenchmarks: {
    fr: "Benchmarks",
    ar: "المعايير المرجعية",
    en: "Benchmarks",
  },
};

registerTranslations('calculator', calculatorTranslations);
