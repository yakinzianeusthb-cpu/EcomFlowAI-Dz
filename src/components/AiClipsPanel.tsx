import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, RotateCcw, Sparkles, Square } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/video';
import { buildScenePrompt, type PromptScene } from '../lib/veoPrompt';
import { AiVideoError, startAiClip, waitForAiClip } from '../services/aiVideo';

type Status = 'idle' | 'running' | 'done' | 'error';

interface Props {
  scenes: PromptScene[];
  format: string;
  /** The product photo the clips start from (data URL), if any. */
  photo?: string | null;
  productName: string;
  /** Clip address per scene (null while missing), owned by the video maker. */
  clips: (string | null)[];
  onClip: (index: number, url: string) => void;
}

/** Films each scene of the script with Google Veo (needs a Gemini key with billing). */
export default function AiClipsPanel({ scenes, format, photo, productName, clips, onClip }: Props) {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status[]>(() => scenes.map((_, i) => (clips[i] ? 'done' : 'idle')));
  const [current, setCurrent] = useState<number | null>(null);
  const [banner, setBanner] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const setOne = (i: number, value: Status) => setStatus((prev) => prev.map((s, j) => (j === i ? value : s)));

  /** Films one scene; returns false when continuing makes no sense (no allowance on this key, or stopped). */
  const film = async (i: number, signal: AbortSignal): Promise<boolean> => {
    setCurrent(i);
    setOne(i, 'running');
    try {
      const job = await startAiClip({ prompt: buildScenePrompt(scenes[i], { productName, format }), aspectRatio: format, image: photo, signal });
      const url = await waitForAiClip(job, { signal });
      onClip(i, url);
      setOne(i, 'done');
      return true;
    } catch (err) {
      if (signal.aborted) { setOne(i, 'idle'); return false; }
      setOne(i, 'error');
      if (err instanceof AiVideoError) {
        setBanner(err.message);
        // no allowance, no key, no plan: every other scene would fail the same way
        if ([400, 402, 403].includes(err.status)) return false;
      }
      return true;
    }
  };

  const filmAll = async (only?: number) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setBanner('');
    const order = only !== undefined ? [only] : scenes.map((_, i) => i).filter((i) => !clips[i]);
    for (const i of order) {
      if (!(await film(i, controller.signal))) break;
    }
    setCurrent(null);
    abortRef.current = null;
  };

  const ready = clips.filter(Boolean).length;
  const busy = current !== null;

  return (
    <section className="ui-card p-5 sm:p-6" aria-labelledby="ai-clips-title">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-accent-ink" />
        <h4 id="ai-clips-title" className="text-base font-semibold text-fg">{t('vmAiTitle', 'Clips vidéo IA (Google Veo)')}</h4>
        {ready > 0 && <span className="ms-auto text-xs text-fg-faint">{t('vmAiReady', '{done}/{total} clips prêts', { done: ready, total: scenes.length })}</span>}
      </div>
      <p className="text-sm text-fg-muted mb-4">{t('vmAiIntro', "L'IA filme une vraie vidéo pour chaque scène (8 s), à partir de ta photo. Il faut une clé Gemini avec facturation : Google facture chaque seconde générée sur ton compte.")}</p>

      {banner && <p className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm text-warning-ink" role="alert">{banner}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {busy ? (
          <>
            <span className="flex items-center gap-2 text-sm font-semibold text-fg" role="status">
              <Loader2 size={16} className="animate-spin" /> {t('vmAiRunning', 'Scène {n} en cours… (1 à 3 min par scène)', { n: (current ?? 0) + 1 })}
            </span>
            <button type="button" onClick={() => abortRef.current?.abort()} className="btn-dz-secondary ms-auto">
              <Square size={14} /> {t('vmAiStop', 'Arrêter')}
            </button>
          </>
        ) : (
          ready < scenes.length && (
            <button type="button" onClick={() => filmAll()} className="btn-dz-primary">
              <Sparkles size={16} /> {t('vmAiGenerate', 'Générer les clips IA ({count} scènes)', { count: scenes.length - ready })}
            </button>
          )
        )}
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {scenes.map((_, i) => (
          <li key={i} className="rounded-xl border border-line bg-surface-2 p-3">
            <p className="text-xs font-semibold text-fg-muted mb-2">{t('vidSceneN', 'Scène {n}', { n: i + 1 })}</p>
            {clips[i] ? (
              <>
                <video src={clips[i]!} muted loop playsInline autoPlay className="w-full rounded-lg bg-black" />
                <a href={clips[i]!} download={`scene-${i + 1}.mp4`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-ink hover:underline">
                  <Download size={13} /> {t('vmAiDownloadClip', 'Télécharger le clip')}
                </a>
              </>
            ) : status[i] === 'running' ? (
              <div className="grid aspect-[9/16] max-h-48 w-full place-items-center rounded-lg bg-fg/5"><Loader2 size={18} className="animate-spin text-fg-faint" /></div>
            ) : status[i] === 'error' ? (
              <div className="space-y-2">
                <p className="text-xs text-danger-ink">{t('vmAiSceneFailed', 'Échec pour cette scène')}</p>
                {!busy && (
                  <button type="button" onClick={() => filmAll(i)} className="btn-dz-secondary !py-1.5 !text-xs">
                    <RotateCcw size={12} /> {t('vmAiRetry', 'Réessayer')}
                  </button>
                )}
              </div>
            ) : (
              <div className="aspect-[9/16] max-h-48 w-full rounded-lg border border-dashed border-line" />
            )}
          </li>
        ))}
      </ol>
      {ready > 0 && <p className="mt-4 text-xs text-fg-faint">{t('vmAiUsed', 'Les clips prêts remplacent la photo dans ta vidéo ci-dessus. Recrée la vidéo pour les inclure.')}</p>}
    </section>
  );
}
