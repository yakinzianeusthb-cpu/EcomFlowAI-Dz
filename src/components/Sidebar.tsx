import { Lock, LogOut, MessageCircle, Plus, Settings, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { isToolPaid, hasActivePlan } from '../lib/access';
import { useCountdown } from '../lib/countdown';
import { NAV_GROUPS, type NavItem } from '../lib/nav';
import { BrandLogo } from './BrandMark';

interface SidebarProps {
  activeTab: NavItem;
  setActiveTab: (tab: NavItem) => void;
  /** Starts a new campaign. */
  onNewCampaign: () => void;
  /** Called after a navigation click (used to close the mobile drawer). */
  onNavigate?: () => void;
}

const DAY_MS = 86_400_000;

function PlanStatus() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const expiresAt = user?.planExpiresAt ? new Date(user.planExpiresAt).getTime() : null;
  const activeFrom = user?.planActiveFrom ? new Date(user.planActiveFrom).getTime() : null;
  // Whole days are enough here; ticking once a minute avoids re-rendering the sidebar every second.
  const countdown = useCountdown(expiresAt, 60_000);

  const isActive = user?.planStatus === 'active';
  const isLifetime = isActive && user?.plan === 'lifetime' && !expiresAt;
  const isExpired = isActive && expiresAt != null && expiresAt < Date.now();
  const totalDays = user?.planDays ?? (user?.plan === 'monthly' ? 30 : user?.plan === 'quarterly' ? 90 : null);
  const elapsed = totalDays && activeFrom != null ? Math.min(1, (Date.now() - activeFrom) / (totalDays * DAY_MS)) : 0;
  const openPlans = () => window.dispatchEvent(new CustomEvent('dz_open_checkout'));

  if (isActive && !isExpired) {
    return (
      <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-success-ink">
          <span className="size-1.5 rounded-full bg-success" />
          {t('sidebarSubActive', 'Abonnement actif')}
        </div>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-fg">
          {isLifetime ? t('sidebarSubLifetime', 'Accès à vie') : `${countdown.days} ${t('sidebarSubDaysLeft', 'jours restants')}`}
        </p>
        {!isLifetime && totalDays && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-fg/10">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (1 - elapsed) * 100)}%` }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-3">
      <p className={cn('text-xs font-medium', isExpired ? 'text-danger-ink' : 'text-fg-muted')}>
        {isExpired ? t('sidebarSubExpired', 'Expiré') : t('sidebarSubNoPlan', 'Aucun abonnement')}
      </p>
      <button type="button" onClick={openPlans} className="mt-2 text-[13px] font-semibold text-primary-ink hover:underline">
        {t('sidebarSubUpgrade', 'Voir les plans')}
      </button>
    </div>
  );
}

export default function Sidebar({ activeTab, setActiveTab, onNewCampaign, onNavigate }: SidebarProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const { user, logout } = useAuth();

  const go = (tab: NavItem) => {
    setActiveTab(tab);
    onNavigate?.();
  };

  const paidLocked = !hasActivePlan(user);
  const avatar = user?.avatarUrl ?? user?.avatar;

  const secondary: { id: NavItem; label: string; icon: typeof Settings }[] = [
    { id: 'settings', label: t('menuSettings', 'Paramètres'), icon: Settings },
    { id: 'contact', label: t('menuContact', 'Contact & support'), icon: MessageCircle },
  ];

  return (
    <div className="flex h-full flex-col bg-surface max-lg:overflow-y-auto">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <BrandLogo />
      </div>

      <nav aria-label={t('coNavigationPrincipale', 'Navigation principale')} className="flex-1 p-3 lg:overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            onNewCampaign();
            onNavigate?.();
          }}
          className="btn-dz-primary mb-3 w-full"
        >
          <Plus size={16} /> {t('navNewCampaign', 'Nouvelle campagne')}
        </button>

        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-3 last:mb-0">
            <p className="eyebrow mb-1.5 px-3">{t(group.labelKey, group.fallback)}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={cn('nav-item', active && 'is-active')}
                    >
                      <item.icon size={17} className="shrink-0" />
                      <span className="flex-1 truncate">{t(item.labelKey, item.fallback)}</span>
                      {paidLocked && isToolPaid(item.id) && <Lock size={13} className="shrink-0 text-fg-faint" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-2.5 border-t border-line p-3">
        <div className="space-y-0.5">
          {secondary.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={cn('nav-item', activeTab === item.id && 'is-active')}
            >
              <item.icon size={17} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
          {user?.isAdmin && (
            <a href="/admin" className="nav-item">
              <Shield size={17} className="shrink-0" />
              <span className="truncate">{t('shlAdmin', 'Admin')}</span>
            </a>
          )}
        </div>

        <PlanStatus />

        {user && (
          <div className="flex items-center gap-2.5 px-1">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-primary/15 text-sm font-semibold text-primary-ink">
              {avatar ? (
                <img src={avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                (user.name || '?').charAt(0).toUpperCase()
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-fg">{user.name}</span>
              <span className="block truncate text-xs text-fg-faint">{user.email}</span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await logout();
                toast.success(t('loggedOutMsg', 'Vous êtes déconnecté(e). À bientôt !'));
              }}
              aria-label={t('logout', 'Déconnexion')}
              title={t('logout', 'Déconnexion')}
              className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] text-fg-faint transition-colors hover:bg-danger/10 hover:text-danger-ink"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
