import { Suspense, lazy, useEffect, useState } from 'react';
import { Clapperboard, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatRelative } from '../../i18n/dates';
import { VIDEO_STYLES } from '../../lib/campaignContext';
import { Segmented, Skeleton, StatusChip } from '../ui/primitives';
import type { ProjectHandle } from './useProject';
import { DEFAULT_VIDEO_OPTIONS, type Generators, type VideoOptions, type VideoOutput } from './useGenerators';
import { GenerateState, VersionPicker } from './OutputControls';
import '../../i18n/campaigns';

const VideoMaker = lazy(() => import('../VideoMaker'));

function OptionsForm({ value, onChange }: { value: VideoOptions; onChange: (v: VideoOptions) => void }) {
  const { t, tf } = useLanguage();
  return (
    <div className="ui-card grid gap-5 p-5 md:grid-cols-3">
      <label className="block text-[13px] font-medium text-fg">
        {t('cmpVideoStyle', 'Style de vidéo')}
        <select className="input-dz mt-1.5" value={value.style} onChange={(e) => onChange({ ...value, style: e.target.value })}>
          {VIDEO_STYLES.map((s) => <option key={s} value={s}>{tf(s)}</option>)}
        </select>
      </label>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpVideoFormat', 'Format')}</p>
        <Segmented
          label={t('cmpVideoFormat', 'Format')}
          value={value.format}
          onChange={(format) => onChange({ ...value, format })}
          options={[
            { value: '9:16', label: t('cmpFormatVertical', 'Vertical 9:16') },
            { value: '1:1', label: t('cmpFormatSquare', 'Carré 1:1') },
            { value: '16:9', label: t('cmpFormatWide', 'Large 16:9') },
          ]}
        />
      </div>
      <div>
        <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpVideoDuration', 'Durée visée')}</p>
        <Segmented
          label={t('cmpVideoDuration', 'Durée visée')}
          value={value.duration}
          onChange={(duration) => onChange({ ...value, duration })}
          options={['15 secondes', '30 secondes', '45 secondes'].map((d) => ({ value: d, label: tf(d) }))}
        />
      </div>
    </div>
  );
}

export default function VideoPanel({ project, gen }: { project: ProjectHandle; gen: Generators }) {
  const { t, language } = useLanguage();
  const p = project.detail!.project;
  const output = project.detail!.outputs.video as { version: number; createdAt: string; data: VideoOutput } | undefined;
  const [options, setOptions] = useState<VideoOptions>(() => output?.data.options ?? DEFAULT_VIDEO_OPTIONS);
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const running = gen.status.video === 'running';

  const photoKey = project.detail!.assets.filter((a) => a.kind === 'product').map((a) => a.id).join(',');
  useEffect(() => {
    let alive = true;
    gen.productPhotos(6).then((list) => alive && setPhotos(list)).catch(() => alive && setPhotos([]));
    return () => { alive = false; };
  }, [photoKey]); // reload only when the photos change

  if (!output || running) {
    return (
      <div className="space-y-5">
        {!running && <OptionsForm value={options} onChange={setOptions} />}
        <GenerateState
          icon={Clapperboard}
          title={t('cmpVideoTitle', 'Ta vidéo publicitaire')}
          intro={t('cmpVideoIntro', 'L’IA écrit le script scène par scène (accroche, démonstration, appel à l’action). Ensuite, l’app monte une vraie vidéo à partir de tes photos, sans quota IA.')}
          running={running}
          runningText={t('cmpVideoRunning', 'L’IA écrit le script… environ 30 secondes.')}
          error={gen.status.video === 'failed' ? gen.errors.video ?? '' : undefined}
          onGenerate={() => void gen.generateVideo(options)}
          label={t('cmpGenerateVideo', 'Écrire le script vidéo')}
        />
      </div>
    );
  }

  const script = output.data.script;
  const coreHook = (script.marketingStrategy as { coreHook?: unknown } | undefined)?.coreHook;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip state="ready" label={`v${output.version} · ${formatRelative(output.createdAt, language)}`} />
        <VersionPicker project={project} kind="video" />
        <button type="button" onClick={() => setShowOptions((o) => !o)} aria-expanded={showOptions} className="btn-dz-secondary ms-auto !min-h-9 !py-1.5 !text-[13px]">
          <SlidersHorizontal size={15} /> {t('cmpVideoOptions', 'Style et format')}
        </button>
        <button type="button" onClick={() => void gen.generateVideo(options)} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">
          <RefreshCw size={15} /> {t('cmpRewriteScript', 'Réécrire le script')}
        </button>
      </div>
      {showOptions && <OptionsForm value={options} onChange={setOptions} />}
      {gen.status.video === 'failed' && <p role="alert" className="text-[13px] text-danger-ink">{gen.errors.video || t('cmpGenFailed', 'La génération a échoué. Réessaie dans un instant.')}</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="script-title" className="ui-card p-5">
          <h2 id="script-title" className="text-[15px] font-semibold text-fg">{t('cmpScript', 'Le script')}</h2>
          {Boolean(coreHook) && (
            <p className="mt-2 text-[13px] text-fg-muted" dir="auto"><span className="font-medium text-fg">{t('cmpHook', 'Accroche')} : </span>{String(coreHook)}</p>
          )}
          <ol className="mt-4 space-y-3">
            {script.scenes.map((s: any, i: number) => (
              <li key={i} className="rounded-[var(--radius-sm)] border border-line bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2 text-xs text-fg-faint">
                  <span className="font-medium text-primary-ink">{t('cmpScene', 'Scène {n}', { n: i + 1 })}</span>
                  <span dir="ltr">{s.time}</span>
                </div>
                {s.overlay && <p className="mt-1.5 text-sm font-semibold text-fg" dir="auto">{s.overlay}</p>}
                {s.audio && <p className="mt-1 text-[13px] leading-relaxed text-fg-muted" dir="auto">{s.audio}</p>}
                {s.visual && <p className="mt-1.5 text-xs leading-relaxed text-fg-faint" dir="auto">{s.visual}</p>}
              </li>
            ))}
          </ol>
        </section>

        <div className="min-w-0">
          {photos === null ? (
            <Skeleton className="h-[520px] w-full" />
          ) : (
            <Suspense fallback={<Skeleton className="h-[520px] w-full" />}>
              <VideoMaker key={output.version} script={script} format={output.data.options.format} photos={photos} price={p.price} productName={p.productName || p.name} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}
