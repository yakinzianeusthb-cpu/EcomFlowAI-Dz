import { Clapperboard, ExternalLink } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { VIDEO_MODELS, VIDEO_PROVIDERS, VIDEO_PROVIDER_NAMES, videoModelFor, type VideoModel, type VideoProvider } from '../../lib/videoProviders';
import { cn } from '../../lib/utils';
import { StatusChip } from '../ui/primitives';
import { AiLogo, type AiBrand } from '../ui/AiLogo';
import { KeyField } from './ImageServiceSettings';
import '../../i18n/settings';
import '../../i18n/campaigns';

/** The service and model chosen, and the keys typed in this visit (blank = keep the saved one). */
export interface VideoServiceDraft {
  provider: VideoProvider;
  model: string;
  /** shared with the images and the voice-over */
  pollinationsApiKey: string;
  /** shared with the images */
  falApiKey: string;
  /** "key id:secret" from the Higgsfield console */
  higgsfieldApiKey: string;
  /** a Hugging Face access token (read), for the free Spaces */
  huggingfaceApiKey: string;
}
export interface SavedVideoKeys {
  pollinations: boolean;
  fal: boolean;
  higgsfield: boolean;
  huggingface: boolean;
}

const BRAND: Record<VideoProvider, AiBrand> = { gemini: 'gemini', huggingface: 'huggingface', pollinations: 'pollinations', fal: 'fal', higgsfield: 'higgsfield' };
const KEY_LINKS: Record<Exclude<VideoProvider, 'gemini'>, string> = {
  huggingface: 'https://huggingface.co/settings/tokens',
  pollinations: 'https://enter.pollinations.ai/keys',
  fal: 'https://fal.ai/dashboard/keys',
  higgsfield: 'https://console.higgsfield.ai',
};

/** "1,25 Pollen" / "2,02 $": an amount in a model's currency (`decimals` 3 for a per-second price like 0,126 $). */
export function formatVideoPrice(amount: number, currency: VideoModel['currency'], locale: string, decimals = 2): string {
  const text = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: decimals }).format(amount);
  return currency === 'usd' ? `${text} $` : `${text} Pollen`;
}

/** "0,07 Pollen" / "0,126 $": a model's price for one filmed second; null for a free model or an unpublished price. */
export const formatSecondPrice = (model: VideoModel, locale: string) =>
  model.perSecond ? formatVideoPrice(model.perSecond, model.currency, locale, 3) : null;

/**
 * Which AI service films the scenes of the videos (Google Gemini by default), its model and its key. Pollinations
 * and fal.ai use the same keys as their images.
 */
export default function VideoServiceSettings({ draft, onChange, saved, loaded }: { draft: VideoServiceDraft; onChange: (next: VideoServiceDraft) => void; saved: SavedVideoKeys; loaded: boolean }) {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';
  const set = (patch: Partial<VideoServiceDraft>) => onChange({ ...draft, ...patch });
  const about: Record<VideoProvider, string> = {
    gemini: t('stgVideoGemini', 'Avec la clé Gemini ci-dessus (facturation activée) ou tes points. Environ 0,10 $ la seconde filmée.'),
    pollinations: t('stgVideoPollinations', 'Seedance, Veo ou Wan avec la clé Pollinations : de 0,01 à 0,10 Pollen la seconde. La photo du produit est envoyée sur le stockage de Pollinations pour être filmée.'),
    fal: t('stgVideoFal', 'Kling, Seedance ou Wan avec ta clé fal.ai : de 0,05 à 0,16 $ la seconde. Filme à partir de la photo du produit.'),
    huggingface: t('stgVideoHf', 'Wan 2.2 sur les GPU gratuits de Hugging Face, avec ton compte gratuit : quelques clips par jour (le temps de GPU revient chaque jour). Plus lent, sans son.'),
    higgsfield: t('stgVideoHiggsfield', 'Kling, Seedance ou Wan avec ta clé Higgsfield, payé avec tes crédits Higgsfield. Filme à partir de la photo du produit.'),
  };
  const hasKey: Record<VideoProvider, boolean> = { gemini: true, huggingface: saved.huggingface, pollinations: saved.pollinations, fal: saved.fal, higgsfield: saved.higgsfield };
  const models = VIDEO_MODELS[draft.provider];
  const chosen = videoModelFor(draft.provider, draft.model);
  /** a model's price as shown in the list: per second, free, or on the seller's account */
  const priceOf = (m: VideoModel) => {
    const price = formatSecondPrice(m, locale);
    if (price) return t('stgVideoPerSecond', '{price} / seconde', { price });
    return m.perSecond === 0 ? t('stgVideoFree', 'gratuit') : t('stgVideoOwnPrice', 'prix sur ton compte {service}', { service: VIDEO_PROVIDER_NAMES[draft.provider] });
  };

  return (
    <section aria-labelledby="stg-video" className="ui-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><Clapperboard size={18} /></span>
        <div>
          <h2 id="stg-video" className="text-[15px] font-semibold text-fg">{t('stgVideoTitle', 'Vidéo IA')}</h2>
          <p className="text-xs text-fg-muted">{t('stgVideoSubtitle', 'L’IA qui filme les scènes de tes vidéos à partir de la photo du produit.')}</p>
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">{t('stgVideoTitle', 'Vidéo IA')}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {VIDEO_PROVIDERS.map((id) => {
            const selected = draft.provider === id;
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3 transition-[border-color,background-color] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50',
                  selected ? 'border-primary bg-primary/[0.05]' : 'border-line hover:border-fg/30',
                )}
              >
                <input type="radio" name="video-provider" value={id} checked={selected} disabled={!loaded} onChange={() => set({ provider: id, model: '' })} className="sr-only" />
                <AiLogo brand={BRAND[id]} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-fg">{VIDEO_PROVIDER_NAMES[id]}</span>
                    {id === 'gemini' && <span className="text-xs font-medium text-primary-ink">{t('stgImgDefault', 'par défaut')}</span>}
                    {id === 'huggingface' && <span className="text-xs font-medium text-success-ink">{t('stgImgFree', 'gratuit')}</span>}
                    {loaded && id !== 'gemini' && hasKey[id] && <StatusChip state="ready" label={t('stgKeySaved', 'Clé enregistrée')} />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{about[id]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
        {models.length > 1 && (
          <div>
            <label className="block text-[13px] font-medium text-fg" htmlFor="setting-videoModel">{t('stgVideoModel', 'Modèle')}</label>
            <select id="setting-videoModel" className="input-dz mt-1.5" value={chosen.id} onChange={(e) => set({ model: e.target.value })}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {`${m.name} — ${priceOf(m)}${m.audio ? '' : ` · ${t('stgVideoSilent', 'sans son')}`}`}
                </option>
              ))}
            </select>
          </div>
        )}
        {draft.provider === 'pollinations' && (
          <KeyField id="setting-pollinationsApiKey-video" label={t('stgImgPollinationsKey', 'Clé secrète Pollinations (sk_…)')} value={draft.pollinationsApiKey} onChange={(v) => set({ pollinationsApiKey: v })} saved={saved.pollinations} placeholder="sk_…" />
        )}
        {draft.provider === 'fal' && (
          <KeyField id="setting-falApiKey-video" label={t('stgImgFalKey', 'Clé API fal.ai')} value={draft.falApiKey} onChange={(v) => set({ falApiKey: v })} saved={saved.fal} placeholder="xxxxxxxx-xxxx-…:…" />
        )}
        {draft.provider === 'huggingface' && (
          <>
            <KeyField id="setting-huggingfaceApiKey" label={t('stgVideoHfKey', 'Jeton d’accès Hugging Face (hf_…)')} value={draft.huggingfaceApiKey} onChange={(v) => set({ huggingfaceApiKey: v })} saved={saved.huggingface} placeholder="hf_…" />
            <p className="text-xs leading-relaxed text-fg-muted">{t('stgVideoHfHelp', 'Crée un compte gratuit sur Hugging Face, puis un jeton de type « Read ». Chaque clip prend environ 1 à 3 minutes ; si ton temps de GPU gratuit du jour est épuisé, réessaie le lendemain.')}</p>
          </>
        )}
        {draft.provider === 'higgsfield' && (
          <>
            <KeyField id="setting-higgsfieldApiKey" label={t('stgVideoHiggsfieldKey', 'Clé API Higgsfield (identifiant:secret)')} value={draft.higgsfieldApiKey} onChange={(v) => set({ higgsfieldApiKey: v })} saved={saved.higgsfield} placeholder="KEY_ID:KEY_SECRET" />
            <p className="text-xs leading-relaxed text-fg-muted">{t('stgVideoHiggsfieldHelp', 'Dans la console Higgsfield, crée une clé API : colle l’identifiant et le secret séparés par « : ». Les prix de chaque modèle sont affichés dans ta console.')}</p>
          </>
        )}
        <p className="text-xs leading-relaxed text-fg-muted">
          {draft.provider === 'gemini'
            ? t('stgVideoGeminiNote', 'Les clips sont filmés avec la clé Gemini enregistrée plus haut, ou avec tes points si tu n’as pas de clé.')
            : t('stgImgKeyNote', 'La clé est chiffrée et ne quitte jamais le serveur. Laisse le champ vide pour garder celle déjà enregistrée.')}
        </p>
        {draft.provider !== 'gemini' && (
          <a href={KEY_LINKS[draft.provider]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-ink hover:underline">
            {t('stgImgGetKey', 'Créer une clé chez {service}', { service: VIDEO_PROVIDER_NAMES[draft.provider] })} <ExternalLink size={12} />
          </a>
        )}
      </div>
    </section>
  );
}
