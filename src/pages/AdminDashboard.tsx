import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, LayoutDashboard, Users, Key, CreditCard, Megaphone, Flame, Coins, Phone, ArrowLeft, PlaySquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminApis from './admin/AdminApis';
import AdminPayments from './admin/AdminPayments';
import AdminAnnouncements from './admin/AdminAnnouncements';
import AdminHotDeals from './admin/AdminHotDeals';
import AdminGuides from './admin/AdminGuides';
import AdminPricing from './admin/AdminPricing';
import AdminContacts from './admin/AdminContacts';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/admin';

type AdminTab = 'overview' | 'users' | 'apis' | 'payments' | 'pricing' | 'announcements' | 'deals' | 'guides' | 'contacts';

const TABS: { id: AdminTab; labelKey: string; fallback: string; icon: typeof Users }[] = [
  { id: 'overview', labelKey: 'admTabOverview', fallback: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'users', labelKey: 'admTabUsers', fallback: 'Utilisateurs', icon: Users },
  { id: 'apis', labelKey: 'admTabApis', fallback: 'APIs', icon: Key },
  { id: 'payments', labelKey: 'admTabPayments', fallback: 'Paiements', icon: CreditCard },
  { id: 'pricing', labelKey: 'lpNavPricing', fallback: 'Tarifs', icon: Coins },
  { id: 'announcements', labelKey: 'dashWidgetAnnouncements', fallback: 'Annonces', icon: Megaphone },
  { id: 'deals', labelKey: 'admTabDeals', fallback: 'Offres Hot', icon: Flame },
  { id: 'guides', labelKey: 'admTabGuides', fallback: 'Guides Vidéo', icon: PlaySquare },
  { id: 'contacts', labelKey: 'admTabContacts', fallback: 'Contacts', icon: Phone },
];

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');

  if (user?.isAdmin !== true) {
    return (
      <div className="min-h-screen bg-dz-green flex items-center justify-center">
        <main className="text-center">
          <Shield size={48} className="mx-auto text-fg-faint mb-4" />
          <h1 className="font-display text-2xl font-bold text-fg mb-2">{t('admAccesRefuse', 'Accès refusé')}</h1>
          <p className="text-fg-muted">{t('admCettePageEstReservee', 'Cette page est réservée aux administrateurs.')}</p>
          <a href="/" className="inline-block mt-6 text-[13px] text-fg-muted hover:text-fg transition-colors">{t('admRetourSite', 'Retour au site')}</a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dz-green p-4 sm:p-6">
      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-fg flex items-center gap-3">
              <Shield size={26} className="text-dz-emerald shrink-0" />
              {t('admTableauBordAdmin', 'Tableau de bord admin')}
            </h1>
            <p className="text-fg-muted text-sm mt-1 truncate">{t('admGestionCompletePlateforme', 'Gestion complète de la plateforme')}</p>
          </div>
          <a href="/" className="shrink-0 text-[13px] text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5">
            <ArrowLeft size={14} className="rtl:rotate-180" /> {t('admRetourSite', 'Retour au site')}
          </a>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {TABS.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer border',
                  active
                    ? 'bg-primary/15 text-fg border-dz-emerald/30'
                    : 'text-fg-muted border-fg/[0.06] hover:bg-fg/[0.04] hover:text-fg'
                )}
              >
                <item.icon size={15} className={active ? 'text-dz-emerald' : ''} />
                {t(item.labelKey, item.fallback)}
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {tab === 'overview' && <AdminOverview />}
            {tab === 'users' && <AdminUsers />}
            {tab === 'apis' && <AdminApis />}
            {tab === 'payments' && <AdminPayments />}
            {tab === 'pricing' && <AdminPricing />}
            {tab === 'announcements' && <AdminAnnouncements />}
            {tab === 'deals' && <AdminHotDeals />}
            {tab === 'guides' && <AdminGuides />}
            {tab === 'contacts' && <AdminContacts />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
