import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, FolderKanban, ImageIcon, Plus, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatRelative } from '../../i18n/dates';
import { projectPath } from '../../lib/nav';
import { OUTPUT_KINDS } from '../../lib/projectRules';
import { cn } from '../../lib/utils';
import { assetUrl, projectsApi, type ProjectSummary } from '../../services/campaigns';
import PageHeader from '../PageHeader';
import { EmptyState, Segmented, Skeleton, StatusChip } from '../ui/primitives';
import { outputLabel } from './labels';
import '../../i18n/campaigns';

/** `headingLevel`: 3 under a section heading (the dashboard), 2 when the cards are the page's own list. */
export function ProjectCard({ project, headingLevel = 3 }: { project: ProjectSummary; headingLevel?: 2 | 3 }) {
  const { t, language } = useLanguage();
  const kinds = OUTPUT_KINDS.filter((k) => k !== 'meta_campaign');
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <Link
      to={projectPath(project.id)}
      className="group ui-card ui-card-hover flex flex-col overflow-hidden text-start focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        {project.coverAssetId ? (
          <img src={assetUrl(project.coverAssetId)} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid size-full place-items-center text-fg-faint">
            <ImageIcon size={28} aria-hidden="true" />
          </div>
        )}
        {project.status === 'archived' && (
          <span className="absolute start-3 top-3 rounded-[var(--radius-xs)] bg-black/60 px-2 py-0.5 text-xs font-medium text-white">{t('cmpArchived', 'Archivée')}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Heading className="truncate text-[15px] font-semibold text-fg">{project.name}</Heading>
        {project.productName && project.productName !== project.name && <p className="mt-0.5 truncate text-[13px] text-fg-muted">{project.productName}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {kinds.map((kind) => (
            <StatusChip key={kind} state={project.outputs[kind] ? 'ready' : 'none'} label={outputLabel(kind, t)} />
          ))}
        </div>
        <p className="mt-auto pt-3 text-xs text-fg-faint">{t('cmpUpdated', 'Modifiée {when}', { when: formatRelative(project.updatedAt, language) })}</p>
      </div>
    </Link>
  );
}

export default function ProjectList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<'active' | 'archived'>('active');

  const load = () => {
    setFailed(false);
    projectsApi.list().then(setProjects).catch(() => setFailed(true));
  };
  useEffect(load, []);

  const shown = useMemo(() => (projects ?? []).filter((p) => (view === 'archived' ? p.status === 'archived' : p.status !== 'archived')), [projects, view]);
  const archivedCount = (projects ?? []).filter((p) => p.status === 'archived').length;
  const newCampaign = () => navigate(projectPath('new'));

  return (
    <div className="space-y-8">
      <PageHeader
        icon={FolderKanban}
        title={t('menuProjects', 'Campagnes')}
        subtitle={t('cmpListSubtitle', 'Une campagne réunit un produit, ses photos et tout ce que l’IA crée pour le vendre : landing page, vidéo et publicités.')}
        actions={
          <button type="button" onClick={newCampaign} className="btn-dz-primary">
            <Plus size={16} /> {t('navNewCampaign', 'Nouvelle campagne')}
          </button>
        }
      />

      {archivedCount > 0 && (
        <Segmented<'active' | 'archived'>
          label={t('cmpFilterLabel', 'Afficher')}
          value={view}
          onChange={setView}
          options={[
            { value: 'active', label: t('cmpFilterActive', 'En cours') },
            { value: 'archived', label: t('cmpFilterArchived', 'Archivées ({count})', { count: archivedCount }) },
          ]}
        />
      )}

      {failed ? (
        <EmptyState
          icon={RefreshCw}
          title={t('cmpLoadFailed', 'Impossible de charger tes campagnes.')}
          body={t('cmpCheckConnection', 'Vérifie ta connexion puis réessaie.')}
          action={<button type="button" onClick={load} className="btn-dz-secondary">{t('cmpRetry', 'Réessayer')}</button>}
        />
      ) : projects === null ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="ui-card overflow-hidden">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        view === 'archived' ? (
          <EmptyState icon={Archive} title={t('cmpNoArchived', 'Aucune campagne archivée.')} />
        ) : (
          <EmptyState
            icon={FolderKanban}
            title={t('cmpEmptyTitle', 'Lance ta première campagne')}
            body={
              <ol className="mx-auto mt-2 max-w-sm space-y-1.5 text-start">
                <li>1. {t('cmpEmptyStep1', 'Ajoute les photos de ton produit et quelques infos.')}</li>
                <li>2. {t('cmpEmptyStep2', 'L’IA écrit la landing page, le script vidéo et les publicités.')}</li>
                <li>3. {t('cmpEmptyStep3', 'Tu relis, tu ajustes, tu télécharges ou tu publies.')}</li>
              </ol>
            }
            action={
              <button type="button" onClick={newCampaign} className="btn-dz-primary">
                <Plus size={16} /> {t('navNewCampaign', 'Nouvelle campagne')}
              </button>
            }
          />
        )
      ) : (
        <div className={cn('grid gap-5 sm:grid-cols-2 xl:grid-cols-3')}>
          {shown.map((p) => <ProjectCard key={p.id} project={p} headingLevel={2} />)}
        </div>
      )}
    </div>
  );
}
