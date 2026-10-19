import { useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, ArchiveRestore, ArrowLeft, Check, CircleAlert, ImageIcon, Pencil, RefreshCw, SearchX, Trash2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TAB_PATHS } from '../../lib/nav';
import { cn } from '../../lib/utils';
import { ApiError, assetUrl, projectsApi } from '../../services/campaigns';
import { ConfirmButton, EmptyState, Skeleton } from '../ui/primitives';
import { objectiveOptions, outputLabel } from './labels';
import { useBrandKit, useProject } from './useProject';
import { useGenerators } from './useGenerators';
import BriefPanel from './BriefPanel';
import LandingPanel from './LandingPanel';
import VideoPanel from './VideoPanel';
import AdsPanel from '../ads/AdsPanel';
import PublishPanel from './PublishPanel';
import '../../i18n/campaigns';

const TABS = ['brief', 'landing', 'video', 'ads', 'publish'] as const;
type Tab = (typeof TABS)[number];

export default function ProjectWorkspace({ projectId }: { projectId: string }) {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const project = useProject(projectId);
  const brand = useBrandKit();
  const { kit } = brand;
  const gen = useGenerators(project.detail, kit, project.saveOutput);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  // Escape closes the field; the blur that follows must not save what was typed
  const cancelName = useRef(false);
  const [metaStillRunning, setMetaStillRunning] = useState('');
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});

  const tab: Tab = (TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as Tab) : 'brief';
  const setTab = (next: Tab) => setParams(next === 'brief' ? {} : { tab: next }, { replace: true });

  if (project.state === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-4"><Skeleton className="size-14" /><div className="space-y-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-3 w-32" /></div></div>
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (project.state === 'missing') {
    return (
      <EmptyState
        icon={SearchX}
        title={t('cmpNotFound', 'Cette campagne n’existe pas ou plus.')}
        action={<button type="button" onClick={() => navigate(TAB_PATHS.projects)} className="btn-dz-secondary">{t('cmpBackToList', 'Voir mes campagnes')}</button>}
      />
    );
  }
  if (project.state === 'error' || !project.detail) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={t('cmpLoadOneFailed', 'Impossible de charger cette campagne.')}
        body={t('cmpCheckConnection', 'Vérifie ta connexion puis réessaie.')}
        action={<button type="button" onClick={project.reload} className="btn-dz-secondary">{t('cmpRetry', 'Réessayer')}</button>}
      />
    );
  }

  const { project: p, assets, outputs } = project.detail;
  const photos = assets.filter((a) => a.kind === 'product');
  const cover = photos[0];
  const objective = objectiveOptions(t).find((o) => o.value === p.objective)?.label;

  const saveName = async () => {
    if (cancelName.current) {
      cancelName.current = false;
      return;
    }
    const name = nameDraft.trim();
    setEditingName(false);
    if (!name || name === p.name) return;
    try {
      await project.updateBrief({ name });
    } catch (err) {
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
    }
  };
  const onNameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void saveName();
    if (e.key === 'Escape') {
      cancelName.current = true;
      setEditingName(false);
    }
  };
  const toggleArchive = async () => {
    try {
      await project.updateBrief({ status: p.status === 'archived' ? 'draft' : 'archived' });
    } catch (err) {
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
    }
  };
  const remove = async (force = false) => {
    try {
      await projectsApi.remove(p.id, { force });
      navigate(TAB_PATHS.projects, { replace: true });
    } catch (err) {
      // its Meta ad may still be running and could not be paused: say so, and let the user decide
      if (err instanceof ApiError && err.code === 'META_ACTIVE') setMetaStillRunning(err.message);
      else toast.error((err as Error).message || t('cmpDeleteFailed', 'Suppression impossible. Réessaie.'));
    }
  };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, k: Tab) => {
    const i = TABS.indexOf(k);
    const rtl = document.documentElement.dir === 'rtl';
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key as 'ArrowRight' | 'ArrowLeft'];
    const next = e.key === 'Home' ? TABS[0] : e.key === 'End' ? TABS[TABS.length - 1] : step ? TABS[(i + step + TABS.length) % TABS.length] : null;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  const tabState = (k: 'landing' | 'video' | 'ads') => (gen.status[k] === 'running' ? 'running' : gen.status[k] === 'failed' ? 'failed' : outputs[k] ? 'ready' : 'none');
  const tabLabels: Record<Tab, string> = {
    brief: t('cmpTabBrief', 'Brief et photos'),
    landing: outputLabel('landing', t),
    video: outputLabel('video', t),
    ads: outputLabel('ads', t),
    publish: t('cmpTabPublish', 'Publier'),
  };

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigate(TAB_PATHS.projects)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} className="rtl:rotate-180" /> {t('menuProjects', 'Campagnes')}
      </button>

      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface-2 text-fg-faint">
          {cover ? <img src={assetUrl(cover.id)} alt="" className="size-full object-cover" /> : <ImageIcon size={22} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                aria-label={t('cmpCampaignName', 'Nom de la campagne')}
                value={nameDraft}
                maxLength={120}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={onNameKey}
                onBlur={saveName}
                className="input-dz max-w-md !py-1.5 text-xl font-semibold"
              />
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={saveName} aria-label={t('cmpSave', 'Enregistrer')} className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-success-ink hover:bg-success/10">
                <Check size={18} />
              </button>
            </div>
          ) : (
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-fg">
              <span className="truncate">{p.name}</span>
              <button type="button" onClick={() => { setNameDraft(p.name); setEditingName(true); }} aria-label={t('cmpRename', 'Renommer la campagne')} className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] text-fg-faint hover:bg-surface-2 hover:text-fg">
                <Pencil size={15} />
              </button>
            </h1>
          )}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-fg-muted">
            {p.productName && <span>{p.productName}</span>}
            {p.price && <><span aria-hidden="true">·</span><bdi dir="ltr">{p.price}</bdi></>}
            {objective && <><span aria-hidden="true">·</span><span>{objective}</span></>}
            {p.status === 'archived' && <><span aria-hidden="true">·</span><span className="text-warning-ink">{t('cmpArchived', 'Archivée')}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleArchive} className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-fg-muted hover:bg-surface-2 hover:text-fg">
            {p.status === 'archived' ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            {p.status === 'archived' ? t('cmpRestore', 'Restaurer') : t('cmpArchive', 'Archiver')}
          </button>
          <ConfirmButton icon={Trash2} label={t('cmpDelete', 'Supprimer')} confirmLabel={t('cmpConfirmDelete', 'Supprimer la campagne et ses fichiers')} cancelLabel={t('cmpCancel', 'Annuler')} onConfirm={() => void remove()} />
        </div>
      </header>

      {metaStillRunning && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 p-4 text-[13px] text-fg">
          <CircleAlert size={16} className="shrink-0 text-warning-ink" aria-hidden="true" />
          <p className="min-w-0 flex-1">{metaStillRunning}</p>
          <button type="button" onClick={() => setMetaStillRunning('')} className="rounded-[var(--radius-sm)] px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:text-fg">{t('cmpCancel', 'Annuler')}</button>
          <button type="button" onClick={() => void remove(true)} className="btn-dz-danger">{t('cmpDeleteAnyway', 'Supprimer quand même')}</button>
        </div>
      )}
      {brand.failed && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4 text-[13px] text-fg-muted">
          <p className="min-w-0 flex-1">{t('cmpBrandLoadFailed', 'Ton identité de marque n’a pas pu être chargée : les contenus générés maintenant ne la suivront pas.')}</p>
          <button type="button" onClick={brand.retry} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">{t('cmpRetry', 'Réessayer')}</button>
        </div>
      )}

      <div role="tablist" aria-label={t('cmpSections', 'Parties de la campagne')} className="-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
        {TABS.map((k) => {
          const state = k === 'brief' || k === 'publish' ? null : tabState(k);
          return (
            <button
              key={k}
              type="button"
              role="tab"
              id={`tab-${k}`}
              ref={(el) => { tabRefs.current[k] = el; }}
              aria-selected={tab === k}
              aria-controls={tab === k ? `panel-${k}` : undefined}
              tabIndex={tab === k ? 0 : -1}
              onClick={() => setTab(k)}
              onKeyDown={(e) => onTabKey(e, k)}
              className={cn(
                '-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
                tab === k ? 'border-primary text-fg' : 'border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {tabLabels[k]}
              {state && (
                <span
                  aria-hidden="true"
                  className={cn('size-1.5 rounded-full', state === 'ready' && 'bg-success', state === 'running' && 'animate-pulse bg-primary', state === 'failed' && 'bg-danger', state === 'none' && 'bg-fg/20')}
                />
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'brief' && <BriefPanel project={project} gen={gen} onOpen={setTab} />}
        {tab === 'landing' && <LandingPanel project={project} gen={gen} />}
        {tab === 'video' && <VideoPanel project={project} gen={gen} />}
        {tab === 'ads' && <AdsPanel project={project} gen={gen} kit={kit} />}
        {tab === 'publish' && <PublishPanel project={project} />}
      </div>
    </div>
  );
}
