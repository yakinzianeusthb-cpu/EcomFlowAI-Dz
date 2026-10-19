import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderKanban, Megaphone, Plus, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { projectPath } from '../../lib/nav';
import { projectsApi, type ProjectSummary } from '../../services/campaigns';
import PageHeader from '../PageHeader';
import { EmptyState, Skeleton } from '../ui/primitives';
import { useBrandKit, useProject } from '../projects/useProject';
import { useGenerators } from '../projects/useGenerators';
import AdsPanel from './AdsPanel';
import '../../i18n/campaigns';

function ProjectAds({ projectId }: { projectId: string }) {
  const { t } = useLanguage();
  const project = useProject(projectId);
  const { kit } = useBrandKit();
  const gen = useGenerators(project.detail, kit, project.saveOutput);
  if (project.state === 'loading') return <Skeleton className="h-96 w-full" />;
  if (!project.detail) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={t('cmpLoadOneFailed', 'Impossible de charger cette campagne.')}
        action={<button type="button" onClick={() => void project.reload()} className="btn-dz-secondary">{t('cmpRetry', 'Réessayer')}</button>}
      />
    );
  }
  return <AdsPanel project={project} gen={gen} kit={kit} />;
}

/** The ads of one campaign, picked from a list, without leaving the studio. */
export default function AdsStudioPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    projectsApi.list().then((list) => setProjects(list.filter((p) => p.status !== 'archived'))).catch(() => setFailed(true));
  };
  useEffect(load, []);

  const selected = params.get('project') && projects?.some((p) => p.id === params.get('project')) ? params.get('project')! : projects?.[0]?.id ?? '';

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Megaphone}
        title={t('menuAds', 'Publicités')}
        subtitle={t('adsStudioSubtitle', 'Concepts, textes et visuels prêts pour Facebook et Instagram, à partir d’une de tes campagnes.')}
        actions={
          projects && projects.length > 0 ? (
            <label className="flex items-center gap-2 text-[13px] text-fg-muted">
              <FolderKanban size={15} aria-hidden="true" />
              <span className="sr-only">{t('adsPickCampaign', 'Campagne')}</span>
              <select className="input-dz !w-auto min-w-56" value={selected} onChange={(e) => setParams({ project: e.target.value }, { replace: true })}>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          ) : null
        }
      />
      {failed ? (
        <EmptyState
          icon={RefreshCw}
          title={t('cmpLoadFailed', 'Impossible de charger tes campagnes.')}
          action={<button type="button" onClick={load} className="btn-dz-secondary">{t('cmpRetry', 'Réessayer')}</button>}
        />
      ) : projects === null ? (
        <Skeleton className="h-96 w-full" />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={t('adsNoCampaign', 'Les publicités partent d’une campagne')}
          body={t('adsNoCampaignText', 'Crée une campagne avec les photos et les infos de ton produit : l’IA pourra ensuite écrire et mettre en image tes publicités.')}
          action={<button type="button" onClick={() => navigate(projectPath('new'))} className="btn-dz-primary"><Plus size={16} /> {t('navNewCampaign', 'Nouvelle campagne')}</button>}
        />
      ) : (
        <ProjectAds key={selected} projectId={selected} />
      )}
    </div>
  );
}
