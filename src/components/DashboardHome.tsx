import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CalendarClock, Clapperboard, KeyRound, Lock, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasActivePlan } from '../lib/access';
import { attentionItems, type AttentionItem } from '../lib/attention';
import { TAB_PATHS, type NavItem } from '../lib/nav';
import { useLanguage } from '../context/LanguageContext';
import { formatDate } from '../i18n/dates';
import { dashboardApi, settingsApi, type AiUsageSummary } from '../services/api';
import { AnnouncementsWidget, GuidesWidget, HotDealsWidget } from './DashboardContentWidgets';
import { Skeleton } from './ui/primitives';
import { SectionTile } from './ui/SectionPicture';

const openCheckout = () => window.dispatchEvent(new CustomEvent('dz_open_checkout'));

function AttentionRow({ icon: Icon, children, action, onAction, tone = 'default' }: { icon: LucideIcon; children: ReactNode; action: string; onAction: () => void; tone?: 'default' | 'warning' }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className={tone === 'warning' ? 'mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-warning/12 text-warning-ink' : 'mt-0.5 grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink'}>
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-fg-muted">{children}</div>
      <button type="button" onClick={onAction} className="shrink-0 text-[13px] font-medium text-primary-ink hover:underline">{action}</button>
    </li>
  );
}

export default function DashboardHome() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [usageFailed, setUsageFailed] = useState(false);

  useEffect(() => {
    dashboardApi.aiUsage().then(setUsage).catch(() => setUsageFailed(true));
    settingsApi.get().then((s) => setHasKey(Boolean(s?.geminiApiKey))).catch(() => {});
  }, []);

  const go = (tab: NavItem) => navigate(TAB_PATHS[tab]);

  const attention = attentionItems({
    hasGeminiKey: hasKey,
    plan: { active: hasActivePlan(user), pending: user?.planStatus === 'pending', expiresAt: user?.planExpiresAt ? String(user.planExpiresAt) : null },
  });

  const renderItem = (item: AttentionItem) => {
    switch (item.id) {
      case 'no-plan':
        return <AttentionRow key={item.id} icon={Lock} tone="warning" action={t('sidebarSubUpgrade', 'Voir les plans')} onAction={openCheckout}>{t('dashAttNoPlan', 'Aucun abonnement actif : la génération IA est verrouillée.')}</AttentionRow>;
      case 'plan-pending':
        return <AttentionRow key={item.id} icon={CalendarClock} action={t('dashOpen', 'Ouvrir')} onAction={openCheckout}>{t('dashAttPending', 'Ton paiement est en cours de vérification par un admin.')}</AttentionRow>;
      case 'plan-ending':
        return <AttentionRow key={item.id} icon={CalendarClock} tone="warning" action={t('dashRenew', 'Renouveler')} onAction={openCheckout}>{t('dashAttEnding', 'Ton abonnement se termine le {date}.', { date: user?.planExpiresAt ? formatDate(user.planExpiresAt, language, { day: 'numeric', month: 'long' }) : '' })}</AttentionRow>;
      case 'no-key':
        return <AttentionRow key={item.id} icon={KeyRound} tone="warning" action={t('menuSettings', 'Paramètres')} onAction={() => go('settings')}>{t('dashAttNoKey', 'Ajoute ta clé Gemini : sans elle, l’IA ne peut rien générer.')}</AttentionRow>;
    }
  };

  const stats = [
    { label: t('dashKpiLandingPages', 'Landing pages'), value: usageFailed ? '—' : usage?.landingPages },
    { label: t('dashKpiVideoScripts', 'Scripts vidéo'), value: usageFailed ? '—' : usage?.videoScripts },
    { label: t('dashKpiTotalGen', 'Générations IA'), value: usageFailed ? '—' : usage?.totalGenerations },
  ];
  // every section of the menu, each with its picture, so the one you want is found at a glance
  const sections: { tab: NavItem; label: string; text: string }[] = [
    { tab: 'landing', label: t('menuLanding', 'Landing pages'), text: t('toolLandingBlurb', 'Crée des tunnels de vente et la copie de ta landing page.') },
    { tab: 'video', label: t('menuVideo', 'Pubs vidéo'), text: t('toolVideoBlurb', 'Génère des scripts de pubs vidéo TikTok et Facebook à fort potentiel.') },
    { tab: 'assets', label: t('menuAssets', 'Fichiers'), text: t('dashAssetsBlurb', 'Tes photos produit et les images créées par l’IA, au même endroit.') },
    { tab: 'assembler', label: t('menuAssembler', 'Constructeur de page'), text: t('toolAssemblerBlurb', 'Assemble visuellement ta landing page, section par section.') },
    { tab: 'calculator', label: t('menuCalculator', 'Calcul de marge COD'), text: t('toolCalculatorBlurb', 'Calcule tes marges et ton profit net en paiement à la livraison.') },
  ];

  return (
    <div className="space-y-12">
      {/* the home page's first screen at banner size: the red-lit room, the promise in large light type, the white pill */}
      <section aria-labelledby="dash-hero" className="theme-dark dash-room overflow-hidden rounded-[var(--radius-lg)] text-fg">
        <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-12 lg:items-end lg:gap-8 lg:p-12">
          <div className="lg:col-span-8">
            <p className="text-[13px] text-fg-muted">{t('dashGreeting', 'Salam,')} {user?.name?.split(' ')[0] ?? ''}</p>
            <h1 id="dash-hero" className="home-display mt-4 max-w-[14ch] text-[clamp(2.25rem,1.3rem+3vw,4.25rem)] text-fg">{t('dashHeroTitle', 'Que veux-tu vendre aujourd’hui ?')}</h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-fg-muted">{t('dashHeroText', 'Crée une landing page avec les images de chaque section, ou une pub vidéo prête à publier, à partir des photos de ton produit.')}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => go('landing')} className="pill-cta">
                {t('dashNewLanding', 'Créer une landing page')}
                <span className="pill-cta-dot"><ArrowUpRight size={18} className="rtl:-scale-x-100" /></span>
              </button>
              <button type="button" onClick={() => go('video')} className="pill-ghost"><Clapperboard size={16} /> {t('dashNewVideo', 'Créer une pub vidéo')}</button>
            </div>
          </div>
          <dl aria-label={t('dashActivity', 'Ton activité')} className="grid grid-cols-3 gap-4 lg:col-span-4 lg:grid-cols-1 lg:gap-6">
            {stats.map((s) => (
              // the label comes first for screen readers; the figure shows above it, like the home page's facts
              <div key={s.label} className="flex flex-col-reverse">
                <dt className="mt-2 text-[13px] leading-snug text-fg-muted">{s.label}</dt>
                <dd className="hero-stat text-fg">{s.value == null ? <Skeleton className="h-12 w-14" /> : <span dir="ltr">{s.value}</span>}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="dash-sections">
        <h2 id="dash-sections" className="home-display mb-5 text-[26px] text-fg sm:text-[30px]">{t('dashQuickAccess', 'Accès rapide')}</h2>
        {/* 5 sections: the two studios across the top on a phone, then the others two by two */}
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {sections.map((s) => (
            <li key={s.tab}>
              <button type="button" onClick={() => go(s.tab)} className="section-card group relative flex h-full w-full flex-col items-start gap-4 rounded-[var(--radius-lg)] bg-surface p-5 text-start transition-colors duration-200 hover:bg-surface-2">
                <SectionTile id={s.tab} size="lg" />
                <ArrowUpRight size={18} aria-hidden="true" className="absolute end-4 top-4 text-fg-faint transition-transform duration-300 group-hover:rotate-45 group-hover:text-fg rtl:-scale-x-100 rtl:group-hover:-rotate-45" />
                <span className="text-[15px] font-medium text-fg">{s.label}</span>
                <span className="line-clamp-2 text-[13px] leading-relaxed text-fg-muted max-sm:hidden">{s.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dash-attention" className="rounded-[var(--radius-lg)] bg-surface p-6 sm:p-8">
        <h2 id="dash-attention" className="home-display mb-5 text-[22px] text-fg">{t('dashAttention', 'À faire')}</h2>
        {attention.length === 0 ? (
          <p className="text-[14px] text-fg-muted">{t('dashAllGood', 'Tout est prêt. Lance une landing page ou une pub vidéo quand tu veux.')}</p>
        ) : (
          <ul className="divide-y divide-line">{attention.map(renderItem)}</ul>
        )}
      </section>

      {/* each widget hides itself when it has nothing to show; whatever is left fills the row */}
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <GuidesWidget className="min-w-0 xl:flex-[2]" />
        <div className="min-w-0 space-y-6 empty:hidden xl:flex-1">
          <AnnouncementsWidget />
          <HotDealsWidget />
        </div>
      </div>
    </div>
  );
}
