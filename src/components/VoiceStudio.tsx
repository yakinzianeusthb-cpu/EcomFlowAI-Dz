import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Loader2, Mic, Settings2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from './PageHeader';
import { AiLogo } from './ui/AiLogo';
import { generateVoice, listVoices, type VoiceList } from '../services/voiceService';
import { VOICE_PROVIDER_NAMES, VOICE_TEXT_MAX } from '../lib/voiceProviders';
import '../i18n/video';

/** One voice made in this visit: what was said, by which voice, and the MP3. */
interface Take {
  id: number;
  text: string;
  voice: string;
  url: string;
}

const MAX_TAKES = 8;
const SCRIPT_KEY = 'dzads_last_generated_script';

/** The voice-over lines of the last video script made in the video studio, one scene per paragraph. */
function lastScriptLines(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(SCRIPT_KEY) ?? 'null');
    const scenes = (saved?.result ?? saved?.payload ?? saved)?.scenes;
    if (!Array.isArray(scenes)) return '';
    return scenes.map((s: { audio?: unknown }) => (typeof s?.audio === 'string' ? s.audio.trim() : '')).filter(Boolean).join('\n\n');
  } catch {
    return '';
  }
}

/**
 * The voice studio: any text read aloud by the voice service chosen in Paramètres (ElevenLabs or Pollinations), with
 * the voice of your choice, to listen to and download as MP3 (for a TikTok, a story, a WhatsApp message to buyers…).
 */
export default function VoiceStudio() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [service, setService] = useState<VoiceList | null>(null);
  const [voiceId, setVoiceId] = useState('');
  const [setupError, setSetupError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [takes, setTakes] = useState<Take[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    listVoices()
      .then((list) => {
        if (cancelled) return;
        setService(list);
        setVoiceId(list.selected ?? list.voices[0]?.id ?? '');
      })
      .catch((err) => { if (!cancelled) setSetupError((err as Error).message); });
    return () => { cancelled = true; };
  }, []);

  const voiceName = service?.voices.find((v) => v.id === voiceId)?.name ?? voiceId;
  const tooLong = text.length > VOICE_TEXT_MAX;

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const url = await generateVoice(text.trim(), voiceId || null);
      setTakes((prev) => [{ id: Date.now(), text: text.trim(), voice: voiceName, url }, ...prev].slice(0, MAX_TAKES));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const importScript = () => {
    const lines = lastScriptLines();
    if (lines) { setText(lines.slice(0, VOICE_TEXT_MAX)); setNote(''); }
    else setNote(t('vsNoScript', 'Aucun script vidéo trouvé : crée d’abord une pub dans Pubs vidéo, ou écris ton texte ici.'));
  };

  return (
    <div className="space-y-8">
      <PageHeader section="voice" title={t('menuVoice', 'Voix off')} subtitle={t('vsSubtitle', 'Ton texte lu par une voix IA, en darija, en arabe ou en français. Écoute-le, puis télécharge-le en MP3.')} />

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <section className="ui-card space-y-4 p-5 sm:p-6" aria-labelledby="vs-write">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="vs-write" className="text-base font-semibold text-fg">{t('vsTextTitle', 'Le texte à lire')}</h2>
            <button type="button" onClick={importScript} className="btn-dz-secondary !py-1.5 !text-xs">
              <FileText size={14} /> {t('vsImport', 'Reprendre ma dernière pub vidéo')}
            </button>
          </div>
          <textarea
            dir="auto"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            placeholder={t('vsPlaceholder', 'Ex : شعرك ديما منفوخ؟ جربي الفرشاة لي تمشط و تملس في 10 دقايق…')}
            className="input-dz min-h-[200px] resize-y leading-relaxed"
            aria-describedby="vs-count"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span id="vs-count" dir="ltr" className={tooLong ? 'font-semibold text-danger-ink' : 'text-fg-faint'}>{text.length} / {VOICE_TEXT_MAX}</span>
            <span className="text-fg-faint">{t('vsTip', 'Écris la darija en lettres arabes ; une virgule ou un point fait une petite pause.')}</span>
          </div>
          {note && <p className="text-sm text-fg-muted" role="status">{note}</p>}

          <div className="rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
            {setupError ? (
              <div className="space-y-2">
                <p className="text-sm text-warning-ink" role="alert">{setupError}</p>
                <Link to="/settings" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink hover:underline"><Settings2 size={14} /> {t('vsOpenSettings', 'Choisir le service de voix dans Paramètres')}</Link>
              </div>
            ) : !service ? (
              <p className="flex items-center gap-2 text-sm text-fg-muted"><Loader2 size={14} className="animate-spin" /> {t('vsLoadingVoices', 'Chargement des voix…')}</p>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <AiLogo brand={service.provider} size={40} />
                <div className="min-w-0 flex-1">
                  <label htmlFor="vs-voice" className="block text-[13px] font-medium text-fg">{t('vsVoice', 'Voix ({service})', { service: VOICE_PROVIDER_NAMES[service.provider] })}</label>
                  <select id="vs-voice" dir="auto" className="input-dz mt-1.5" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                    {service.voices.map((v) => <option key={v.id} value={v.id}>{v.detail ? `${v.name} — ${v.detail}` : v.name}</option>)}
                  </select>
                </div>
                <Link to="/settings" className="pb-2.5 text-xs font-medium text-primary-ink hover:underline">{t('vsChangeService', 'Changer de service')}</Link>
              </div>
            )}
          </div>

          {error && <p className="rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-2.5 text-sm text-warning-ink" role="alert">{error}</p>}
          <button type="button" onClick={generate} disabled={busy || !service || !text.trim() || tooLong} className="btn-dz-primary w-full disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
            {busy ? t('voMaking', 'Création de la voix…') : t('vsGenerate', 'Créer la voix')}
          </button>
        </section>

        <section className="ui-card p-5 sm:p-6" aria-labelledby="vs-takes">
          <h2 id="vs-takes" className="mb-4 text-base font-semibold text-fg">{t('vsTakesTitle', 'Tes voix')}</h2>
          {takes.length === 0 ? (
            <p className="text-sm leading-relaxed text-fg-muted">{t('vsEmpty', 'Les voix que tu crées apparaissent ici. Elles restent jusqu’à ce que tu quittes la page : télécharge celles que tu gardes.')}</p>
          ) : (
            <ul className="space-y-3">
              {takes.map((take, i) => (
                <li key={take.id} className="rounded-[var(--radius-md)] border border-line p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p dir="auto" className="line-clamp-2 min-w-0 flex-1 text-sm text-fg">{take.text}</p>
                    <span className="shrink-0 text-xs text-fg-faint">{take.voice}</span>
                  </div>
                  <audio src={take.url} controls preload="metadata" className="h-9 w-full" />
                  <a href={take.url} download={`voix-off-${takes.length - i}.mp3`} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-ink hover:underline">
                    <Download size={13} /> {t('vsDownload', 'Télécharger le MP3')}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
