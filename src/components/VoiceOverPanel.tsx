import { useState } from 'react';
import { Download, Loader2, Mic, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import '../i18n/video';
import { generateVoice } from '../services/voiceService';
import { encodeWav, renderVoiceTrack } from '../lib/voiceTrack';
import type { ScriptScene, Timeline } from '../lib/videoTimeline';

/** One scene's voice: the MP3 to listen to, and the decoded sound mixed into the video. */
export interface VoiceClip {
  url: string;
  buffer: AudioBuffer;
}

let decoder: AudioContext | null = null;
/** An MP3 data URL decoded into sound (the browser's own decoder). */
async function decode(url: string): Promise<AudioBuffer> {
  decoder ??= new AudioContext();
  const bytes = await (await fetch(url)).arrayBuffer();
  return decoder.decodeAudioData(bytes);
}

interface Props {
  scenes: ScriptScene[];
  voices: (VoiceClip | null)[];
  onVoice: (index: number, clip: VoiceClip | null) => void;
  /** whether the voices go into the video */
  enabled: boolean;
  onEnabled: (on: boolean) => void;
  timeline: Timeline;
  disabled: boolean;
  fileName: string;
}

/**
 * The AI voice-over of the video: each scene's line read by the voice service chosen in Paramètres, to listen to,
 * redo, put into the video (each scene then lasts as long as its line) or download as one WAV file.
 */
export default function VoiceOverPanel({ scenes, voices, onVoice, enabled, onEnabled, timeline, disabled, fileName }: Props) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState('');
  const spoken = scenes.map((s, i) => ({ i, text: (s.audio ?? '').trim() })).filter((s) => s.text);
  const made = voices.filter(Boolean).length;

  const voiceScene = async (i: number, text: string) => {
    setBusy(i);
    const clip = await generateVoice(text).then(async (url) => ({ url, buffer: await decode(url) }));
    onVoice(i, clip);
  };

  /** every scene that has words and no voice yet (or all of them again with `again`), one after the other */
  const voiceAll = async (again = false) => {
    setError('');
    try {
      for (const { i, text } of spoken) if (again || !voices[i]) await voiceScene(i, text);
      onEnabled(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const redo = async (i: number, text: string) => {
    setError('');
    try {
      await voiceScene(i, text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const download = async () => {
    const sound = await renderVoiceTrack(timeline, voices.map((v) => v?.buffer ?? null));
    const url = URL.createObjectURL(new Blob([encodeWav(sound)], { type: 'audio/wav' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: `${fileName}-voix-off.wav` });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  if (!spoken.length) return null;
  return (
    <section className="ui-card p-5 sm:p-6" aria-labelledby="voice-over-title">
      <div className="mb-1 flex items-center gap-2">
        <Mic size={18} className="text-primary-ink" />
        <h4 id="voice-over-title" className="text-base font-semibold text-fg">{t('voTitle', 'Voix off IA')}</h4>
        {made > 0 && <span className="ms-auto text-xs text-fg-faint">{t('voCount', '{made} / {total} scènes', { made, total: spoken.length })}</span>}
      </div>
      <p className="mb-4 text-sm text-fg-muted">
        {t('voIntro', 'Le texte de chaque scène lu par une voix IA (ElevenLabs ou Pollinations, choisi dans')}{' '}
        <Link to="/settings" className="font-medium text-primary-ink hover:underline">{t('menuSettings', 'Paramètres')}</Link>
        {t('voIntroEnd', '). Chaque scène dure le temps de sa phrase.')}
      </p>

      <ul className="space-y-2">
        {spoken.map(({ i, text }) => (
          <li key={i} className="rounded-[var(--radius-md)] border border-line p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-xs font-semibold text-fg-faint">{t('vidSceneN', undefined, { n: i + 1 })}</span>
              <p dir="auto" className="min-w-0 flex-1 text-sm leading-relaxed text-fg">{text}</p>
              {voices[i] && (
                <button type="button" onClick={() => redo(i, text)} disabled={disabled || busy !== null} className="shrink-0 rounded-lg p-1.5 text-fg-faint transition-colors hover:bg-fg/5 hover:text-fg disabled:opacity-40" aria-label={t('voRedo', 'Refaire cette voix')} title={t('voRedo', 'Refaire cette voix')}>
                  {busy === i ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                </button>
              )}
            </div>
            {voices[i] ? (
              <audio src={voices[i]!.url} controls preload="none" className="mt-2 h-9 w-full" />
            ) : busy === i ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-fg-muted"><Loader2 size={12} className="animate-spin" /> {t('voMaking', 'Création de la voix…')}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {error && <p className="mt-3 text-sm text-danger-ink" role="alert">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => voiceAll(made > 0 && made === spoken.length)} disabled={disabled || busy !== null} className="btn-dz-primary disabled:opacity-50">
          {busy !== null ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
          {made === 0 ? t('voCreate', 'Créer la voix off') : made < spoken.length ? t('voFinish', 'Finir la voix off') : t('voRedoAll', 'Refaire toute la voix off')}
        </button>
        {made > 0 && (
          <button type="button" onClick={download} disabled={disabled || busy !== null} className="btn-dz-secondary disabled:opacity-50">
            <Download size={15} /> {t('voDownload', 'Télécharger la voix off (WAV)')}
          </button>
        )}
      </div>
      {made > 0 && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
          <input type="checkbox" checked={enabled} disabled={disabled} onChange={(e) => onEnabled(e.target.checked)} className="size-4 accent-[var(--color-primary,#2563eb)]" />
          {t('voInVideo', 'Mettre la voix off dans la vidéo (la musique passe en dessous)')}
        </label>
      )}
    </section>
  );
}
