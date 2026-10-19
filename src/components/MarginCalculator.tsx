import { useState } from 'react';
import { Calculator, Coins, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import RichText from './RichText';
import PageHeader from './PageHeader';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/calculator';

export default function MarginCalculator() {
  const { t } = useLanguage();
  const [values, setValues] = useState({
    productCost: 1500,
    sellingPrice: 3500,
    shippingCost: 600,
    confirmationRate: 80,
    deliveryRate: 70,
    adSpendPerOrder: 500,
  });

  const calculateMetrics = () => {
    // We expect confirmationRate and deliveryRate to be percentages
    const confirmedCount = values.confirmationRate / 100;
    const deliveredCount = (values.confirmationRate / 100) * (values.deliveryRate / 100);
    
    // Revenue is only from delivered packages
    const totalRevenue = values.sellingPrice * deliveredCount;
    // Costs: Product cost for all delivered, Shipping cost for all sent (confirmed), Ad spend for all leads (1 lead = 1 calculation base here)
    const totalProductCost = values.productCost * deliveredCount;
    const totalShippingCost = values.shippingCost * confirmedCount; 
    const totalAdCost = values.adSpendPerOrder; // Per 1 order attempt

    const netProfit = totalRevenue - totalProductCost - totalShippingCost - totalAdCost;
    const margin = (netProfit / totalRevenue) * 100;

    return {
      netProfit: Math.round(netProfit),
      margin: Math.round(margin),
      deliveredCount,
      totalRevenue
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Coins}
        title={t('menuCalculator', 'Calcul de marge COD')}
        subtitle={t('calcOptimisezProfitsMarcheAlgerien', 'Optimisez vos profits sur le marché algérien')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4 ui-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-1.5 bg-dz-emerald/10 rounded-lg text-dz-emerald">
              <Calculator size={18} />
            </div>
            <h2 className="text-lg font-bold text-fg tracking-tight">{t('calcParametresVente', 'Paramètres de Vente')}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="mc-selling-price" className="block text-sm font-medium text-fg-muted mb-1.5">{t('calcPrixVenteDzd', 'Prix de Vente (DZD)')}</label>
              <input
                id="mc-selling-price"
                type="number"
                value={values.sellingPrice}
                onChange={(e) => setValues({ ...values, sellingPrice: Number(e.target.value) })}
                className="w-full bg-fg/[0.04] border border-fg/10 rounded-xl px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-emerald/50"
              />
            </div>
            <div>
              <label htmlFor="mc-product-cost" className="block text-sm font-medium text-fg-muted mb-1.5">{t('calcCoutProduitAchatDzd', 'Coût Produit (Achat DZD)')}</label>
              <input
                id="mc-product-cost"
                type="number"
                value={values.productCost}
                onChange={(e) => setValues({ ...values, productCost: Number(e.target.value) })}
                className="w-full bg-fg/[0.04] border border-fg/10 rounded-xl px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-emerald/50"
              />
            </div>
            <div>
              <label htmlFor="mc-shipping-cost" className="block text-sm font-medium text-fg-muted mb-1.5">{t('calcCoutLivraisonMoyenDzd', 'Coût Livraison Moyen (DZD)')}</label>
              <input
                id="mc-shipping-cost"
                type="number"
                value={values.shippingCost}
                onChange={(e) => setValues({ ...values, shippingCost: Number(e.target.value) })}
                className="w-full bg-fg/[0.04] border border-fg/10 rounded-xl px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-emerald/50"
              />
            </div>
            <div>
              <label htmlFor="mc-ad-spend" className="block text-sm font-medium text-fg-muted mb-1.5">{t('calcCoutPublicitaireParLead', 'Coût Publicitaire par Lead (DZD)')}</label>
              <input
                id="mc-ad-spend"
                type="number"
                value={values.adSpendPerOrder}
                onChange={(e) => setValues({ ...values, adSpendPerOrder: Number(e.target.value) })}
                className="w-full bg-fg/[0.04] border border-fg/10 rounded-xl px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-emerald/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="mc-confirmation-rate" className="block text-sm font-medium text-fg-muted mb-1.5">{t('calcTauxConfirmation', 'Taux de Confirmation (%)')}</label>
                <input
                  id="mc-confirmation-rate"
                  type="number"
                  value={values.confirmationRate}
                  onChange={(e) => setValues({ ...values, confirmationRate: Number(e.target.value) })}
                  className="w-full bg-fg/[0.04] border border-fg/10 rounded-xl px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-emerald/50"
                />
              </div>
              <div>
                <label htmlFor="mc-delivery-rate" className="block text-sm font-medium text-fg-muted mb-1.5">{t('calcTauxLivraison', 'Taux de Livraison (%)')}</label>
                <input
                  id="mc-delivery-rate"
                  type="number"
                  value={values.deliveryRate}
                  onChange={(e) => setValues({ ...values, deliveryRate: Number(e.target.value) })}
                  className="w-full bg-fg/[0.04] border border-fg/10 rounded-xl px-4 py-2.5 text-fg focus:outline-none focus:ring-2 focus:ring-dz-emerald/50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border rounded-2xl p-6",
                metrics.netProfit > 0 ? "bg-success/10 border-success/30" : "bg-danger/10 border-danger/30"
              )}
            >
              <p className={cn("text-sm font-medium mb-1", metrics.netProfit > 0 ? "text-success-ink" : "text-danger-ink")}>{t('calcProfitNetLead', 'Profit net / lead')}</p>
              <p className="text-3xl font-bold text-fg">{metrics.netProfit} DZD</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "border rounded-2xl p-6",
                metrics.margin > 30 ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30"
              )}
            >
              <p className="text-sm font-medium text-fg-muted mb-1">{t('calcMargeBrute', 'Marge brute')}</p>
              <p className="text-3xl font-bold text-fg">{metrics.margin}%</p>
            </motion.div>
          </div>

          <div className="ui-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-dz-emerald" />
              {t('calcAnalyseBusiness', 'Analyse du Business')}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-fg-faint block">{t('calcPerformance', 'Performance')}</span>
                  <div className="flex justify-between items-center bg-fg/[0.04] p-2 rounded-lg">
                    <span className="text-xs text-fg-muted">{t('calcSuccesLivraison', 'Succès Livraison')}</span>
                    <span className={cn(
                      "text-xs font-bold",
                      (values.confirmationRate * values.deliveryRate / 100) > 55 ? "text-success-ink" : "text-warning-ink"
                    )}>
                      {(values.confirmationRate * values.deliveryRate / 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-fg-faint block">{t('calcBenchmarks', 'Benchmarks')}</span>
                  <div className="flex justify-between items-center bg-fg/[0.04] p-2 rounded-lg">
                    <span className="text-xs text-fg-muted">{t('calcMoyenneMarche', 'Moyenne Marché')}</span>
                    <span className="text-xs font-bold text-dz-emerald">55-60%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium text-fg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-dz-emerald" />
                  {t('calcInsightsActionnables', 'Insights actionnables')}
                </h3>
                
                <div className="grid gap-3">
                  {/* Insight 1: Marge & Profitabilité Globale */}
                  {metrics.margin < 15 ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="font-semibold">{t('calcEtatDUrgenceMarge', "État d'Urgence (Marge < 15%)")}</span>
                      </div>
                      <p className="leading-relaxed">
                        <RichText text={t('calcInsightUrgent')} />
                      </p>
                    </div>
                  ) : metrics.margin >= 15 && metrics.margin < 30 ? (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-xs text-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-400" />
                        <span className="font-semibold">{t('calcEnPhaseStabilisation15', 'En Phase de Stabilisation (15-30%)')}</span>
                      </div>
                      <p className="leading-relaxed">
                        <RichText text={t('calcInsightStable')} />
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-success/10 border border-success/30 rounded-2xl text-xs text-fg">
                      <div className="flex items-center gap-2 mb-2 text-success-ink">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">{t('calcMachineCash30', 'Machine à Cash (> 30%)')}</span>
                      </div>
                      <p className="leading-relaxed">
                        <RichText text={t('calcInsightCash')} />
                      </p>
                    </div>
                  )}

                  {/* Insight 2: Confirmation */}
                  {values.confirmationRate < 75 && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold tracking-tight text-xs text-amber-400">{t('calcFuiteLeads', 'Fuite de Leads')}</span>
                      </div>
                      <RichText text={t('calcInsightLeads')} strongClassName="font-normal underline decoration-amber-500/50" />
                    </div>
                  )}

                  {/* Insight 3: Livraison */}
                  {values.deliveryRate < 60 ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold tracking-tight text-xs text-rose-400">{t('calcLogistiqueCritique', 'Logistique critique')}</span>
                      </div>
                      <RichText text={t('calcInsightLogistics')} />
                    </div>
                  ) : values.deliveryRate >= 80 && (
                    <div className="p-4 bg-success/10 border border-success/30 rounded-2xl text-xs text-fg">
                      <div className="flex items-center gap-2 mb-1 text-success-ink">
                        <span className="font-bold tracking-tight text-xs">{t('calcLogistiqueDElite', "Logistique d'élite")}</span>
                      </div>
                      <RichText text={t('calcInsightElite')} />
                    </div>
                  )}

                  {/* Insight 4: Ads Cost */}
                  {values.adSpendPerOrder > values.sellingPrice * 0.25 && (
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-xs text-purple-100">
                      <div className="flex items-center gap-1 mb-1 text-purple-400">
                         <span className="font-bold tracking-tight text-xs">{t('calcMarketingInefficace', 'Marketing inefficace')}</span>
                      </div>
                      {t('calcInsightAds')}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-fg/10">
                <div className="p-4 bg-dz-emerald/10 rounded-xl border border-dz-emerald/20">
                  <h3 className="text-xs font-bold text-dz-emerald mb-2">{t('calcObjectifsRecommandesAlgerie', 'Objectifs Recommandés (Algérie)')}</h3>
                  <ul className="text-xs text-fg-muted space-y-1.5 list-disc ps-4">
                    <li><RichText text={t('calcGoalBasket', undefined, { amount: values.productCost * 2.5 })} strongClassName="font-normal text-fg" /></li>
                    <li><RichText text={t('calcGoalConfirm')} strongClassName="font-normal text-fg" /></li>
                    <li><RichText text={t('calcGoalReturns')} strongClassName="font-normal text-fg" /></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
