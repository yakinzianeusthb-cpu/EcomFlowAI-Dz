import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, Clapperboard, Coins, FolderKanban, KeyRound, Layers, Link2, Lock, Megaphone, Palette, Sparkles, Wand2, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasActivePlan } from '../lib/access';
import { attentionItems, type AttentionItem } from '../lib/attention';
import { TAB_PATHS, projectPath, type NavItem } from '../lib/nav';
import { useLanguage } from '../context/LanguageContext';
import { DATE_LOCALE, formatDate } from '../i18n/dates';
import { dashboardApi, settingsApi, type AiUsageSummary } from '../services/api';
import { metaApi, projectsApi, type MetaStatus, type ProjectSummary } from '../services/campaigns';
import { AnnouncementsWidget, GuidesWidget, HotDealsWidget } from './DashboardContentWidgets';
import { ImageDrop, Skeleton } from './ui/primitives';
import { ProjectCard } from './projects/ProjectList';
import { useBrandKit } from './projects/useProject';
import { setPendingPhotos } from './projects/pendingPhotos';
import { outputLabel } from './projects/labels';
import '../i18n/campaigns';

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
  const { kit } = useBrandKit();
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [projectsFailed, setProjectsFailed] = useState(false);
  const [usageFailed, setUsageFailed] = useState(false);

  const loadProjects = () => {
    setProjectsFailed(false);
    projectsApi.list().then(setProjects).catch(() => setProjectsFailed(true));
  };
  useEffect(() => {
    dashboardApi.aiUsage().then(setUsage).catch(() => setUsageFailed(true));
    loadProjects();
    settingsApi.get().then((s) => setHasKey(Boolean(s?.geminiApiKey))).catch(() => {});
    metaApi.status().then(setMeta).catch(() => {});
  }, []);

  const go = (tab: NavItem) => navigate(TAB_PATHS[tab]);
  const startWith = (files: File[]) => {
    setPendingPhotos(files);
    navigate(projectPath('new'));
  };

  const active = (projects ?? []).filter((p) => p.status !== 'archived');
  // without the campaign list the rest can still be checked (plan, key, brand, Meta)
  const attention = projects || projectsFailed
    ? attentionItems({
        hasGeminiKey: hasKey,
        plan: { active: hasActivePlan(user), pending: user?.planStatus === 'pending', expiresAt: user?.planExpiresAt ? String(user.planExpiresAt) : null },
        brand: kit ? { brandName: kit.brandName, colors: kit.colors, logoAssetId: kit.logoAssetId } : null,
        projects: active,
        meta,
      })
    : null;

  const renderItem = (item: AttentionItem) => {
    switch (item.id) {
      case 'no-plan':
        return <AttentionRow key={item.id} icon={Lock} tone="warning" action={t('sidebarSubUpgrade', 'Voir les plans')} onAction={openCheckout}>{t('dashAttNoPlan', 'Aucun abonnement actif : la génération IA est verrouillée.')}</AttentionRow>;
      case 'plan-pending':
        return <AttentionRow key={item.id} icon={CalendarClock} action={t('cmpOpen', 'Ouvrir')} onAction={openCheckout}>{t('dashAttPending', 'Ton paiement est en cours de vérification par un admin.')}</AttentionRow>;
      case 'plan-ending':
        return <AttentionRow key={item.id} icon={CalendarClock} tone="warning" action={t('dashRenew', 'Renouveler')} onAction={openCheckout}>{t('dashAttEnding', 'Ton abonnement se termine le {date}.', { date: user?.planExpiresAt ? formatDate(user.planExpiresAt, language, { day: 'numeric', month: 'long' }) : '' })}</AttentionRow>;
      case 'no-key':
        return <AttentionRow key={item.id} icon={KeyRound} tone="warning" action={t('menuSettings', 'Paramètres')} onAction={() => go('settings')}>{t('dashAttNoKey', 'Ajoute ta clé Gemini : sans elle, l’IA ne peut rien générer.')}</AttentionRow>;
      case 'missing-outputs':
        return (
          <AttentionRow key={item.id} icon={Sparkles} action={t('cmpOpen', 'Ouvrir')} onAction={() => navigate(projectPath(item.projectId))}>
            {t('dashAttMissing', '« {name} » n’a pas encore : {missing}.', { name: item.projectName, missing: new Intl.ListFormat(DATE_LOCALE[language], { type: 'conjunction' }).format(item.missing.map((k) => outputLabel(k, t))) })}
          </AttentionRow>
        );
      case 'brand-empty':
        return <AttentionRow key={item.id} icon={Palette} action={t('cmpOpen', 'Ouvrir')} onAction={() => go('brand')}>{t('dashAttBrand', 'Ajoute ton logo et tes couleurs pour que tout ce que l’IA crée te ressemble.')}</AttentionRow>;
      case 'meta-connect':
        return <AttentionRow key={item.id} icon={Link2} action={t('metaConnect', 'Connecter Meta')} onAction={() => go('settings')}>{t('dashAttMeta', 'Connecte Meta pour publier tes campagnes depuis l’app.')}</AttentionRow>;
      case 'meta-expired':
        return <AttentionRow key={item.id} icon={Link2} tone="warning" action={t('metaReconnect', 'Reconnecter Meta')} onAction={() => go('settings')}>{t('metaExpiredText', 'L’accès donné par Meta a expiré. Reconnecte ton compte pour continuer à publier.')}</AttentionRow>;
    }
  };

  const stats = [
    { label: t('menuProjects', 'Campagnes'), value: projects ? active.length : projectsFailed ? '—' : null },
    { label: t('dashKpiLandingPages', 'Landing pages'), value: usageFailed ? '—' : usage?.landingPages },
    { label: t('dashKpiVideoScripts', 'Scripts vidéo'), value: usageFailed ? '—' : usage?.videoScripts },
    { label: t('dashKpiTotalGen', 'Générations IA'), value: usageFailed ? '—' : usage?.totalGenerations },
  ];
  const studios: { tab: NavItem; icon: LucideIcon; label: string; text: string }[] = [
    { tab: 'landing', icon: Wand2, label: t('menuLanding', 'Landing pages'), text: t('toolLandingBlurb', 'Crée des tunnels de vente et la copie de ta landing page.') },
    { tab: 'video', icon: Clapperboard, label: t('menuVideo', 'Pubs vidéo'), text: t('toolVideoBlurb', 'Génère des scripts de pubs vidéo TikTok et Facebook à fort potentiel.') },
    { tab: 'ads', icon: Megaphone, label: t('menuAds', 'Publicités'), text: t('adsStudioSubtitle', 'Concepts, textes et visuels prêts pour Facebook et Instagram, à partir d’une de tes campagnes.') },
    { tab: 'assembler', icon: Layers, label: t('menuAssembler', 'Constructeur de page'), text: t('toolAssemblerBlurb', 'Assemble visuellement ta landing page, section par section.') },
    { tab: 'calculator', icon: Coins, label: t('menuCalculator', 'Calcul de marge COD'), text: t('toolCalculatorBlurb', 'Calcule tes marges et ton profit net en paiement à la livraison.') },
  ];

  return (
    <div className="space-y-10">
      <section aria-labelledby="dash-hero" className="ui-card grain overflow-hidden">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div>
            <p className="eyebrow">{t('dashGreeting', 'Salam,')} {user?.name?.split(' ')[0] ?? ''}</p>
            <h1 id="dash-hero" className="display-title mt-3 text-4xl text-fg sm:text-5xl">{t('dashHeroTitle', 'Que veux-tu vendre aujourd’hui ?')}</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-fg-muted">{t('dashHeroText', 'Dépose les photos de ton produit. L’IA prépare la landing page, la vidéo et les publicités, toutes avec la même marque et le même message.')}</p>
            <button type="button" onClick={() => navigate(projectPath('new'))} className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-ink hover:underline">
              {t('dashStartWithout', 'Commencer sans photo')} <ArrowRight size={14} className="rtl:rotate-180" />
            </button>
          </div>
          <ImageDrop onFiles={startWith} label={t('dashDropPhotos', 'Dépose les photos du produit')} hint={t('cmpPhotoFormats', 'JPG, PNG ou WebP · glisse-les ici ou clique')} className="min-h-52 bg-surface" />
        </div>
      </section>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="dash-recent">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="dash-recent" className="text-[15px] font-semibold text-fg">{t('dashRecent', 'Campagnes récentes')}</h2>
            {active.length > 0 && (
              <button type="button" onClick={() => go('projects')} className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-ink hover:underline">
                {t('dashViewAll', 'Tout voir')} <ArrowRight size={14} className="rtl:rotate-180" />
              </button>
            )}
          </div>
          {projectsFailed ? (
            <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-line p-6 text-[13px] text-fg-muted">
              <p className="flex-1">{t('cmpLoadFailed', 'Impossible de charger tes campagnes.')}</p>
              <button type="button" onClick={loadProjects} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">{t('cmpRetry', 'Réessayer')}</button>
            </div>
          ) : projects === null ? (
            <div className="grid gap-5 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)}</div>
          ) : active.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-8 text-center">
              <FolderKanban size={22} className="mx-auto text-primary-ink" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-fg">{t('dashNoCampaign', 'Pas encore de campagne.')}</p>
              <p className="mt-1 text-[13px] text-fg-muted">{t('dashNoCampaignText', 'Ta première campagne apparaîtra ici avec sa landing page, sa vidéo et ses publicités.')}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">{active.slice(0, 4).map((p) => <ProjectCard key={p.id} project={p} />)}</div>
          )}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="dash-attention" className="ui-card p-5">
            <h2 id="dash-attention" className="mb-4 text-[15px] font-semibold text-fg">{t('dashAttention', 'À faire')}</h2>
            {attention === null ? (
              <div className="space-y-3"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-4/5" /></div>
            ) : attention.length === 0 ? (
              <p className="text-[13px] text-fg-muted">{t('dashAllGood', 'Tout est prêt. Crée une nouvelle campagne quand tu veux.')}</p>
            ) : (
              <ul className="divide-y divide-line">{attention.map(renderItem)}</ul>
            )}
          </section>

          <section aria-labelledby="dash-stats" className="ui-card p-5">
            <h2 id="dash-stats" className="mb-4 text-[15px] font-semibold text-fg">{t('dashActivity', 'Ton activité')}</h2>
            <dl className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-xs text-fg-faint">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tabular-nums text-fg">{s.value == null ? <Skeleton className="h-7 w-10" /> : s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <section aria-labelledby="dash-studios">
        <h2 id="dash-studios" className="mb-4 text-[15px] font-semibold text-fg">{t('dashStudios', 'Studios et outils')}</h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {studios.map((s) => (
            <li key={s.tab}>
              <button type="button" onClick={() => go(s.tab)} className="ui-card ui-card-hover flex h-full w-full flex-col items-start gap-3 p-4 text-start">
                <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><s.icon size={17} /></span>
                <span className="text-sm font-semibold text-fg">{s.label}</span>
                <span className="line-clamp-2 text-[13px] leading-relaxed text-fg-muted max-sm:hidden">{s.text}</span>
              </button>
            </li>
          ))}
        </ul>
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
