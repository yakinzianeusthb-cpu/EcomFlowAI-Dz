import { Suspense, lazy, useEffect, useState } from 'react';
import { PencilLine, RefreshCw, Wand2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { LANDING_LANGUAGE } from '../../lib/campaignContext';
import { formatRelative } from '../../i18n/dates';
import { Skeleton, StatusChip } from '../ui/primitives';
import type { ProjectHandle } from './useProject';
import type { Generators, LandingOutput } from './useGenerators';
import { GenerateState, VersionPicker } from './OutputControls';
import SectionEditor from './SectionEditor';
import '../../i18n/campaigns';

const LandingPublisher = lazy(() => import('../LandingPublisher'));

export default function LandingPanel({ project, gen }: { project: ProjectHandle; gen: Generators }) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const p = project.detail!.project;
  const output = project.detail!.outputs.landing as { version: number; createdAt: string; data: LandingOutput } | undefined;
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [editing, setEditing] = useState(false);
  const running = gen.status.landing === 'running';

  const photoKey = project.detail!.assets.filter((a) => a.kind === 'product').map((a) => a.id).join(',');
  useEffect(() => {
    let alive = true;
    gen.productPhotos(4).then((list) => alive && setPhotos(list)).catch(() => alive && setPhotos([]));
    return () => { alive = false; };
    // reload only when the photo list changes
  }, [photoKey]);

  if (!output || running) {
    return (
      <GenerateState
        icon={Wand2}
        title={t('cmpLandingTitle', 'Ta landing page')}
        intro={t('cmpLandingIntro', 'L’IA écrit une page de vente complète à partir du brief et des photos : sections, arguments et bouton de commande. Tu pourras modifier les textes avant de la télécharger.')}
        running={running}
        runningText={t('cmpLandingRunning', 'L’IA écrit ta page… cela prend environ une minute.')}
        error={gen.status.landing === 'failed' ? gen.errors.landing ?? '' : undefined}
        onGenerate={() => void gen.generateLanding()}
        label={t('cmpGenerateLanding', 'Générer la landing page')}
      />
    );
  }

  const saveEdit = async (lpData: LandingOutput['lpData']) => {
    try {
      await project.saveOutput('landing', { lpData });
      setEditing(false);
      toast.success(t('cmpVersionSaved', 'Nouvelle version enregistrée.'));
    } catch (err) {
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip state="ready" label={`v${output.version} · ${formatRelative(output.createdAt, language)}`} />
        <VersionPicker project={project} kind="landing" />
        <div className="ms-auto flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing((e) => !e)} aria-pressed={editing} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">
            <PencilLine size={15} /> {editing ? t('cmpCloseEditor', 'Fermer l’éditeur') : t('cmpEditTexts', 'Modifier les textes')}
          </button>
          <button type="button" onClick={() => void gen.generateLanding()} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">
            <RefreshCw size={15} /> {t('cmpRegenerate', 'Régénérer')}
          </button>
        </div>
      </div>
      {gen.status.landing === 'failed' && <p role="alert" className="text-[13px] text-danger-ink">{gen.errors.landing || t('cmpGenFailed', 'La génération a échoué. Réessaie dans un instant.')}</p>}

      {editing ? (
        <SectionEditor key={output.version} lpData={output.data.lpData} onSave={saveEdit} onCancel={() => setEditing(false)} />
      ) : photos === null ? (
        <Skeleton className="h-[480px] w-full" />
      ) : (
        <Suspense fallback={<Skeleton className="h-[480px] w-full" />}>
          <LandingPublisher
            key={output.version}
            lpData={output.data.lpData}
            productName={p.productName || p.name}
            photos={photos}
            language={LANDING_LANGUAGE[p.language]}
            defaultPrice={p.price}
          />
        </Suspense>
      )}
    </div>
  );
}
