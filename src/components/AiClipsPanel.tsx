import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, RotateCcw, Sparkles, Square } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/video';
import '../i18n/credits';
import { useCredits } from '../services/credits';
import { settingsApi } from '../services/api';
import { buildScenePrompt, type PromptScene } from '../lib/aiVideoPrompt';
import { DEFAULT_VIDEO_PROVIDER, VIDEO_PROVIDER_NAMES, isVideoProvider, pickDuration, videoModelFor, type VideoProvider } from '../lib/videoProviders';
import { formatVideoPrice } from './settings/VideoServiceSettings';
import { AiVideoError, startAiClip, waitForAiClip } from '../services/aiVideo';

/** the length asked for each scene; each model films its nearest length */
const SCENE_SECONDS = 8;

/** The video service and model chosen in Paramètres (Gemini until the settings are read). */
function useVideoService() {
  const [service, setService] = useState<{ provider: VideoProvider; model: string | null }>({ provider: DEFAULT_VIDEO_PROVIDER, model: null });
  useEffect(() => {
    let cancelled = false;
    settingsApi.get()
      .then((s) => { if (!cancelled && isVideoProvider(s?.videoProvider)) setService({ provider: s.videoProvider, model: s.videoModel || null }); })
      .catch(() => { /* Gemini, the default */ });
    return () => { cancelled = true; };
  }, []);
  return { provider: service.provider, model: videoModelFor(service.provider, service.model) };
}

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

/** Films each scene of the script with the video service chosen in Paramètres (Google Gemini by default). */
export default function AiClipsPanel({ scenes, format, photo, productName, clips, onClip }: Props) {
  const { t, language } = useLanguage();
  const credits = useCredits();
  const { provider, model } = useVideoService();
  const locale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';
  const sceneSeconds = pickDuration(model.durations, SCENE_SECONDS);
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
      const prompt = buildScenePrompt(scenes[i], { productName, format, index: i, total: scenes.length, durationSeconds: sceneSeconds });
      const job = await startAiClip({ prompt, aspectRatio: format, image: photo, signal });
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
  const left = scenes.length - ready;
  const missingPhoto = Boolean(model.needsPhoto) && !photo;
  // the price of the scenes still to film, in the model's currency
  const remainingCost = formatVideoPrice(left * sceneSeconds * model.perSecond, model.currency, locale);

  const intro = provider === 'gemini' && credits?.mode === 'points'
    ? t('crdVideoIntro', "L'IA filme une vraie vidéo avec musique pour chaque scène (environ 8 s), à partir de ta photo ; tes textes sont ajoutés par-dessus. Avec tes points : {perScene} points par scène, soit {total} points pour les scènes restantes (solde : {balance}).", { perScene: SCENE_SECONDS * credits.settings.videoSecondCost, total: left * SCENE_SECONDS * credits.settings.videoSecondCost, balance: credits.balance })
    : provider === 'gemini'
      ? t('vmAiIntroGemini', "L'IA filme une vraie vidéo avec son pour chaque scène (environ {seconds} s), à partir de ta photo ; tes textes sont ajoutés par-dessus. Avec ta clé Gemini (facturation activée) : environ {cost} pour les scènes restantes.", { seconds: sceneSeconds, cost: remainingCost })
      : t('vmAiIntroService', "L'IA filme chaque scène (environ {seconds} s) à partir de ta photo avec {model}, sur ton compte {service} ; tes textes sont ajoutés par-dessus. Environ {cost} pour les scènes restantes.", { seconds: sceneSeconds, model: model.name, service: VIDEO_PROVIDER_NAMES[provider], cost: remainingCost });

  return (
    <section className="ui-card p-5 sm:p-6" aria-labelledby="ai-clips-title">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-accent-ink" />
        <h4 id="ai-clips-title" className="text-base font-semibold text-fg">{t('vmAiTitleService', "Vidéo filmée par l'IA ({model})", { model: model.name })}</h4>
        {ready > 0 && <span className="ms-auto text-xs text-fg-faint">{t('vmAiReady', '{done}/{total} clips prêts', { done: ready, total: scenes.length })}</span>}
      </div>
      <p className="text-sm text-fg-muted mb-1">{intro}</p>
      <p className="text-xs text-fg-faint mb-4">
        {t('vmAiChange', 'Le service et le modèle se choisissent dans')}{' '}
        <Link to="/settings" className="font-medium text-primary-ink hover:underline">{t('menuSettings', 'Paramètres')}</Link>.
      </p>

      {missingPhoto && <p className="mb-4 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm text-warning-ink" role="alert">{t('vmAiNeedsPhoto', 'Ce modèle filme à partir de la photo du produit : ajoute une photo dans la vidéo ci-dessus.')}</p>}
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
            <button type="button" onClick={() => filmAll()} disabled={missingPhoto} className="btn-dz-primary disabled:opacity-50">
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
