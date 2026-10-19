/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggle from './components/ThemeToggle';
import LockedTool from './components/LockedTool';
import ErrorBoundary from './components/ErrorBoundary';
import { useLanguage } from './context/LanguageContext';
import { useAuth, type PlanId } from './context/AuthContext';
import { cn } from './lib/utils';
import { isToolPaid, hasActivePlan } from './lib/access';
import { TAB_PATHS, TAB_TITLES, projectPath, tabFromPath, type NavItem } from './lib/nav';
import { useDocumentMeta } from './lib/useDocumentMeta';

// Lazy load tools: each one is its own chunk.
const DashboardHome = lazy(() => import('./components/DashboardHome'));
const ProjectsHub = lazy(() => import('./components/projects/ProjectsHub'));
const AdsStudioPage = lazy(() => import('./components/ads/AdsStudioPage'));
const BrandKitPage = lazy(() => import('./components/brand/BrandKitPage'));
const AssetLibrary = lazy(() => import('./components/assets/AssetLibrary'));
const VideoAdGenerator = lazy(() => import('./components/VideoAdGenerator'));
const LandingPageGenerator = lazy(() => import('./components/LandingPageGenerator'));
const LandingAssembler = lazy(() => import('./components/LandingAssembler'));
const MarketTrends = lazy(() => import('./components/MarketTrends'));
const ProductImageGen = lazy(() => import('./components/ProductImageGen'));
const MarginCalculator = lazy(() => import('./components/MarginCalculator'));
const Settings = lazy(() => import('./components/Settings'));
const DarjaAdGenerator = lazy(() => import('./components/DarjaAdGenerator'));
const ProductAnalyzer = lazy(() => import('./components/ProductAnalyzer'));
const ProductCatalog = lazy(() => import('./components/ProductCatalog'));
const TelegramProductScout = lazy(() => import('./components/TelegramProductScout'));
const ContentCalendar = lazy(() => import('./components/ContentCalendar'));
const ContactUs = lazy(() => import('./components/ContactUs'));

// The plan dialog (and the animation library it uses) is only needed once somebody opens it.
const PlanCheckout = lazy(() => import('./components/PlanCheckout'));

// Pages people open most; fetched quietly while the dashboard is being read so the first click is instant.
const WARM_UP_TOOLS = [
  () => import('./components/projects/ProjectsHub'),
  () => import('./components/VideoAdGenerator'),
  () => import('./components/LandingPageGenerator'),
];

const WARM_UP_DELAY_MS = 3500;
const DRAWER_ANIMATION_MS = 200;

// Screens that show data other screens change (campaigns, files, brand kit): mounted fresh on each visit instead of
// kept alive, so they never show yesterday's list. Tools holding work in progress stay alive between visits.
const FRESH_ON_VISIT = new Set<NavItem>(['dashboard', 'ads', 'brand', 'assets']);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Off-canvas navigation for screens below `lg`. The sidebar is only mounted while the drawer is visible. */
function MobileDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { isRTL, t } = useLanguage();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), DRAWER_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // a modal menu: focus moves in, Tab stays inside, and focus returns to the menu button on close
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const raf = requestAnimationFrame(() => focusables()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn('absolute inset-0 bg-black/55 transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0')}
      />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t('menuToolsText', 'Navigation')}
        className={cn(
          'absolute inset-y-0 start-0 w-72 max-w-[85vw] border-e border-line bg-surface shadow-2xl transition-transform duration-200 ease-out',
          visible ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('coFermerMenu', 'Fermer le menu')}
          className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          <X size={18} />
        </button>
        {children}
      </aside>
    </div>
  );
}

export default function AppShell() {
  const { t } = useLanguage();
  const { user, isMock } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { tab: activeTab, projectId } = tabFromPath(location.pathname);
  const [visitedTabs, setVisitedTabs] = useState<Set<NavItem>>(() => new Set<NavItem>([activeTab]));
  const [navOpen, setNavOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoaded, setCheckoutLoaded] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanId | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const closeNav = useCallback(() => setNavOpen(false), []);

  const setActiveTab = useCallback((tab: NavItem) => navigate(TAB_PATHS[tab]), [navigate]);
  const newCampaign = useCallback(() => navigate(projectPath('new')), [navigate]);

  useEffect(() => {
    // other screens ask for a page with an event, so they do not need the router
    const onNavChange = (e: Event) => {
      const detail = (e as CustomEvent<NavItem>).detail;
      if (detail && detail in TAB_PATHS) navigate(TAB_PATHS[detail]);
    };
    const onOpenCheckout = () => {
      setCheckoutPlan(null);
      setCheckoutLoaded(true);
      setCheckoutOpen(true);
    };
    window.addEventListener('nav-change', onNavChange);
    window.addEventListener('dz_open_checkout', onOpenCheckout);
    return () => {
      window.removeEventListener('nav-change', onNavChange);
      window.removeEventListener('dz_open_checkout', onOpenCheckout);
    };
  }, [navigate]);

  // After login, resume a plan chosen on the landing page.
  useEffect(() => {
    if (!user) return;
    const intent = sessionStorage.getItem('dz_plan_intent') as PlanId | null;
    if (intent) {
      sessionStorage.removeItem('dz_plan_intent');
      setCheckoutPlan(intent);
      setCheckoutLoaded(true);
      setCheckoutOpen(true);
    }
  }, [user]);

  // Warm up the main pages a few seconds after the dashboard is up, so it never competes with the
  // dashboard's own assets (skipped on data-saver / very slow connections).
  useEffect(() => {
    if (!hasActivePlan(user)) return;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) return;
    const warm = () => WARM_UP_TOOLS.forEach((load) => void load().catch(() => {}));
    const timer = window.setTimeout(() => {
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle(warm, { timeout: 3000 });
      else warm();
    }, WARM_UP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    setVisitedTabs((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Screens kept alive between visits so work in progress survives (the campaign pages reload from the server instead).
  const components = useMemo<Partial<Record<NavItem, ReactNode>>>(
    () => ({
      dashboard: <DashboardHome />,
      video: <VideoAdGenerator />,
      landing: <LandingPageGenerator />,
      ads: <AdsStudioPage />,
      brand: <BrandKitPage />,
      assets: <AssetLibrary />,
      assembler: <LandingAssembler />,
      images: <ProductImageGen />,
      calculator: <MarginCalculator />,
      trends: <MarketTrends />,
      settings: <Settings />,
      darja: <DarjaAdGenerator />,
      analyzer: <ProductAnalyzer />,
      catalog: <ProductCatalog />,
      scout: <TelegramProductScout />,
      calendar: <ContentCalendar />,
      contact: <ContactUs />,
    }),
    [],
  );

  const openPlans = () => {
    setCheckoutPlan(null);
    setCheckoutLoaded(true);
    setCheckoutOpen(true);
  };
  const title = t(TAB_TITLES[activeTab].key, TAB_TITLES[activeTab].fallback);
  useDocumentMeta({ title: `${title} — EcomFlow AI` });
  const needsPlan = !user?.plan || !hasActivePlan(user);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
      >
        {t('skipToContent', 'Aller au contenu')}
      </a>

      {/* Desktop sidebar */}
      <aside aria-label={t('coNavigationPrincipale', 'Navigation principale')} className="hidden w-64 shrink-0 border-e border-line lg:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNewCampaign={newCampaign} />
      </aside>

      {/* Mobile drawer */}
      <MobileDrawer open={navOpen} onClose={closeNav}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onNewCampaign={newCampaign} onNavigate={closeNav} />
      </MobileDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label={t('coOuvrirMenu', 'Ouvrir le menu')}
            aria-expanded={navOpen}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
          >
            <Menu size={18} />
          </button>
          {/* on wide screens the sidebar and the page heading already say where you are */}
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg lg:invisible">{title}</p>
          {isMock && (
            <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning-ink">DEV</span>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </header>

        <main id="app-main" ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {needsPlan && (
              <div className="ui-tint-accent mb-6 flex flex-col gap-3 rounded-[var(--radius-md)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-fg">
                  {user?.planStatus === 'pending'
                    ? t('planBannerPending', "Paiement en attente d'approbation : un admin vérifie ta preuve et active ton accès.")
                    : user?.planStatus === 'active'
                      ? t('planBannerExpired', 'Ton abonnement a expiré : renouvelle-le pour retrouver les outils IA.')
                      : t('planBannerNone', 'Aucun plan actif : abonne-toi pour débloquer les outils IA.')}
                </p>
                <button type="button" onClick={openPlans} className="btn-dz-accent !min-h-9 shrink-0 !px-4 !py-1.5 !text-[13px]">
                  {t('sidebarSubUpgrade', 'Voir les plans')}
                </button>
              </div>
            )}

            <ErrorBoundary resetKey={location.pathname}>
              <Suspense
                fallback={
                  <div className="grid min-h-[50vh] place-items-center">
                    <Loader2 className="size-7 animate-spin text-primary-ink" aria-label={t('coChargement', 'Chargement')} />
                  </div>
                }
              >
                {activeTab === 'projects' && <ProjectsHub key={projectId ?? 'list'} projectId={projectId} />}
                {(Object.entries(components) as [NavItem, ReactNode][]).map(([key, component]) => {
                  const isVisible = activeTab === key;

                  // Paid tool without an active plan: never mount it, show the locked screen instead.
                  if (isToolPaid(key) && !hasActivePlan(user)) {
                    return isVisible ? (
                      <div key={key} className="w-full">
                        <LockedTool tab={key} onSubscribe={openPlans} />
                      </div>
                    ) : null;
                  }

                  // Keep visited tools mounted (hidden) so their in-progress work survives tab switches.
                  if (!isVisible && (FRESH_ON_VISIT.has(key) || !visitedTabs.has(key))) return null;

                  return (
                    <div key={key} className={cn('w-full', !isVisible && 'hidden')} hidden={!isVisible}>
                      {component}
                    </div>
                  );
                })}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {checkoutLoaded && (
        <Suspense fallback={null}>
          <PlanCheckout open={checkoutOpen} initialPlan={checkoutPlan} onClose={() => setCheckoutOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
