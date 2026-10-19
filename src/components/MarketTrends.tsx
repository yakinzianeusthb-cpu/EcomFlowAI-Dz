import { TrendingUp, BarChart3, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';
import DemoDataNotice from './DemoDataNotice';

export default function MarketTrends() {
  const trendingProducts = [
    { name: 'Épilateur Laser IPL', trend: '+140%', volume: 'Élevé', category: 'Cosmétique' },
    { name: 'Mini Projecteur HD', trend: '+85%', volume: 'Moyen', category: 'Tech' },
    { name: 'Brosse Nettoyante Électrique', trend: '+120%', volume: 'Élevé', category: 'Cosmétique' },
    { name: 'Organisateur de Cuisine', trend: '+60%', volume: 'Moyen', category: 'Maison' },
  ];

  return (
    <div className="space-y-8">
      <DemoDataNotice />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-2 tracking-tight flex items-center gap-3">
          <div className="p-2 bg-dz-emerald/20 rounded-lg text-dz-emerald">
            <TrendingUp size={24} />
          </div>
          Tendances du Marché Algérien
        </h1>
        <p className="text-fg-muted px-1">Restez informé sur ce qui se vend le mieux en ce moment en Algérie.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="ui-card overflow-hidden">
            <div className="p-6 border-b border-fg/10 flex justify-between items-center bg-fg/5">
              <div className="flex items-center gap-3">
                 <div className="p-1.5 bg-fg/10 rounded-lg text-fg">
                   <ShoppingBag size={18} />
                 </div>
                 <h3 className="font-bold text-fg text-xs">Produits à Fort Potentiel</h3>
              </div>
              <BarChart3 size={18} className="text-fg-faint" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead className="bg-fg/5 text-fg-muted text-xs font-bold border-b border-fg/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">Produit</th>
                    <th className="px-6 py-4 font-bold">Catégorie</th>
                    <th className="px-6 py-4 font-bold">Croissance</th>
                    <th className="px-6 py-4 font-bold">Volume Search</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trendingProducts.map((p) => (
                    <tr key={p.name} className="hover:bg-fg/5 transition-colors group">
                      <td className="px-6 py-5 text-sm text-fg font-semibold">{p.name}</td>
                      <td className="px-6 py-5 text-fg-muted text-xs">{p.category}</td>
                      <td className="px-6 py-5 text-sm text-dz-emerald font-bold">{p.trend}</td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-fg/5 border border-fg/10 text-fg-muted rounded-full text-xs font-bold">
                          {p.volume}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-dz-emerald/10 border border-dz-emerald/20 p-6 rounded-2xl">
            <h4 className="text-dz-emerald font-bold mb-2 flex items-center gap-2 text-xs">
              <TrendingUp size={16} /> Opportunité de Saison
            </h4>
            <p className="text-fg-muted text-sm leading-relaxed">
              L'approche de l'été voit une augmentation massive de la demande pour les **articles de bureau portables** et les **systèmes de refroidissement**. Le stock local est limité, ce qui favorise les prix premium.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="ui-card p-6">
            <h3 className="text-sm font-bold text-fg mb-6 text-fg-muted">Mots Clés Populaires (DZ)</h3>
            <div className="flex flex-wrap gap-2">
              {['Livraison 58 wilayas', 'Meilleur prix Algérie', 'Original', 'Garanti', 'Promo Ramadhan', 'Check product'].map(tag => (
                <span key={tag} className="px-3 py-2 bg-fg/5 border border-fg/10 rounded-xl text-fg-muted text-xs font-medium hover:border-dz-emerald/50 hover:text-fg transition-all cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="ui-card p-6 bg-gradient-to-br from-dz-emerald/10 to-dz-emerald/5">
            <h3 className="text-sm font-bold text-fg mb-6 text-fg-muted">Plateformes Ads</h3>
            <div className="space-y-5">
              {[
                { name: 'Facebook Ads', rate: 85, color: 'bg-primary' },
                { name: 'TikTok Ads', rate: 65, color: 'bg-dz-emerald' },
                { name: 'Instagram', rate: 45, color: 'bg-primary' },
              ].map(plat => (
                <div key={plat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted text-xs font-medium">{plat.name}</span>
                    <span className="text-fg font-bold text-xs">{plat.rate}% util.</span>
                  </div>
                  <div className="h-1.5 w-full bg-fg/5 rounded-full overflow-hidden">
                    <div className={cn("h-full", plat.color)} style={{ width: `${plat.rate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
