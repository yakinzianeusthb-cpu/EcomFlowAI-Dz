import { useState } from 'react';
import { ExternalLink, Loader2, Mic, Play } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { VOICE_PROVIDERS, VOICE_PROVIDER_NAMES, type VoiceOption, type VoiceProvider } from '../../lib/voiceProviders';
import { listVoices } from '../../services/voiceService';
import { cn } from '../../lib/utils';
import { StatusChip } from '../ui/primitives';
import { AiLogo } from '../ui/AiLogo';
import { KeyField } from './ImageServiceSettings';
import '../../i18n/settings';
import '../../i18n/campaigns';

/** The keys typed in this visit (blank = keep the saved one), the voice chosen, and which keys are already saved. */
export interface VoiceServiceDraft {
  provider: VoiceProvider;
  voiceId: string;
  elevenlabsApiKey: string;
  /** shared with the images (one Pollinations key for both) */
  pollinationsApiKey: string;
}
export interface SavedVoiceKeys {
  elevenlabs: boolean;
  pollinations: boolean;
}

const KEY_LINKS: Record<VoiceProvider, string> = {
  elevenlabs: 'https://elevenlabs.io/app/settings/api-keys',
  pollinations: 'https://enter.pollinations.ai/keys',
};

/**
 * Which AI voice reads the videos' voice-over, its key and the voice. The voices are read from the service with the
 * saved key, so a new key or service is saved first.
 */
export default function VoiceServiceSettings({ draft, onChange, saved, savedProvider, loaded }: {
  draft: VoiceServiceDraft;
  onChange: (next: VoiceServiceDraft) => void;
  saved: SavedVoiceKeys;
  /** the service as saved on the server: the voices can only be read for that one */
  savedProvider: VoiceProvider;
  loaded: boolean;
}) {
  const { t } = useLanguage();
  const set = (patch: Partial<VoiceServiceDraft>) => onChange({ ...draft, ...patch });
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const about: Record<VoiceProvider, string> = {
    elevenlabs: t('stgVoiceEleven', 'Les voix les plus naturelles, en arabe aussi. 10 000 caractères gratuits par mois (environ 10 minutes) pour essayer ; un abonnement pour publier.'),
    pollinations: t('stgVoicePollinations', 'La même clé que les images Pollinations. Voix ElevenLabs avec du crédit Pollen, sinon une voix OpenAI ouverte aux comptes gratuits.'),
  };
  const canLoad = loaded && draft.provider === savedProvider && saved[draft.provider];

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listVoices();
      setVoices(list.voices);
      if (!draft.voiceId && list.voices[0]) set({ voiceId: list.selected ?? list.voices[0].id });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const chosen = voices?.find((v) => v.id === draft.voiceId);

  return (
    <section aria-labelledby="stg-voice" className="ui-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><Mic size={18} /></span>
        <div>
          <h2 id="stg-voice" className="text-[15px] font-semibold text-fg">{t('stgVoiceTitle', 'Voix off')}</h2>
          <p className="text-xs text-fg-muted">{t('stgVoiceSubtitle', 'La voix IA qui lit le texte de tes vidéos, ajoutée dans la vidéo créée.')}</p>
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">{t('stgVoiceTitle', 'Voix off')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {VOICE_PROVIDERS.map((id) => {
            const selected = draft.provider === id;
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3 transition-[border-color,background-color] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50',
                  selected ? 'border-primary bg-primary/[0.05]' : 'border-line hover:border-fg/30',
                )}
              >
                <input type="radio" name="voice-provider" value={id} checked={selected} disabled={!loaded} onChange={() => { set({ provider: id, voiceId: '' }); setVoices(null); setError(''); }} className="sr-only" />
                <AiLogo brand={id} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-fg">{VOICE_PROVIDER_NAMES[id]}</span>
                    {loaded && saved[id] && <StatusChip state="ready" label={t('stgKeySaved', 'Clé enregistrée')} />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{about[id]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
        {draft.provider === 'elevenlabs' ? (
          <KeyField id="setting-elevenlabsApiKey" label={t('stgVoiceElevenKey', 'Clé API ElevenLabs')} value={draft.elevenlabsApiKey} onChange={(v) => set({ elevenlabsApiKey: v })} saved={saved.elevenlabs} placeholder="sk_…" />
        ) : (
          <KeyField id="setting-pollinationsApiKey-voice" label={t('stgImgPollinationsKey', 'Clé secrète Pollinations (sk_…)')} value={draft.pollinationsApiKey} onChange={(v) => set({ pollinationsApiKey: v })} saved={saved.pollinations} placeholder="sk_…" />
        )}

        <div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <label className="block text-[13px] font-medium text-fg" htmlFor="setting-voiceId">{t('stgVoiceVoice', 'Voix')}</label>
              <select id="setting-voiceId" className="input-dz mt-1.5" value={draft.voiceId} onChange={(e) => set({ voiceId: e.target.value })} disabled={!voices?.length}>
                {!voices?.length && <option value={draft.voiceId}>{draft.voiceId || t('stgVoiceFirst', 'La première voix du service')}</option>}
                {voices?.map((v) => (
                  <option key={v.id} value={v.id}>{v.detail ? `${v.name} — ${v.detail}` : v.name}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={load} disabled={!canLoad || loading} className="btn-dz-secondary disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Mic size={15} />}
              {t('stgVoiceLoad', 'Charger les voix')}
            </button>
          </div>
          {chosen?.preview && (
            <a href={chosen.preview} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-ink hover:underline">
              <Play size={12} /> {t('stgVoicePreview', 'Écouter un extrait')}
            </a>
          )}
          {!canLoad && loaded && <p className="mt-2 text-xs text-fg-muted">{t('stgVoiceSaveFirst', 'Enregistre la clé de ce service pour charger ses voix.')}</p>}
          {error && <p className="mt-2 text-xs text-danger-ink" role="alert">{error}</p>}
        </div>

        <p className="text-xs leading-relaxed text-fg-muted">{t('stgImgKeyNote', 'La clé est chiffrée et ne quitte jamais le serveur. Laisse le champ vide pour garder celle déjà enregistrée.')}</p>
        <a href={KEY_LINKS[draft.provider]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-ink hover:underline">
          {t('stgImgGetKey', 'Créer une clé chez {service}', { service: VOICE_PROVIDER_NAMES[draft.provider] })} <ExternalLink size={12} />
        </a>
      </div>
    </section>
  );
}
