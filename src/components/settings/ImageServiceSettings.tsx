import { ExternalLink, ImageIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { IMAGE_PROVIDERS, IMAGE_PROVIDER_NAMES, type ImageProvider } from '../../lib/imageProviders';
import { cn } from '../../lib/utils';
import { StatusChip } from '../ui/primitives';
import { AiLogo, type AiBrand } from '../ui/AiLogo';
import '../../i18n/settings';
import '../../i18n/campaigns';

/** The keys typed in this visit (blank = keep the saved one) and which ones are already saved. */
export interface ImageServiceDraft {
  provider: ImageProvider;
  openaiApiKey: string;
  falApiKey: string;
  cloudflareAccountId: string;
  cloudflareApiToken: string;
}
export interface SavedImageKeys {
  openai: boolean;
  fal: boolean;
  cloudflare: boolean;
}

const BRAND: Record<ImageProvider, AiBrand> = { gemini: 'gemini', openai: 'openai', fal: 'flux', cloudflare: 'cloudflare' };

const KEY_LINKS: Record<Exclude<ImageProvider, 'gemini'>, string> = {
  openai: 'https://platform.openai.com/api-keys',
  fal: 'https://fal.ai/dashboard/keys',
  cloudflare: 'https://dash.cloudflare.com/profile/api-tokens',
};

function KeyField({ id, label, value, onChange, saved, placeholder }: { id: string; label: string; value: string; onChange: (v: string) => void; saved: boolean; placeholder: string }) {
  const { t } = useLanguage();
  return (
    <div>
      <label className="block text-[13px] font-medium text-fg" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="password"
        autoComplete="off"
        className="input-dz mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={saved ? t('stgConfigureLaisserVideConserver', '•••••••• (configuré — laisser vide pour conserver)') : placeholder}
        dir="ltr"
      />
    </div>
  );
}

/**
 * Which AI service makes the images (Gemini by default) and the keys of the others. The keys are sent once, stored
 * encrypted and never shown again; the texts follow the engine chosen above, AI video always uses Gemini.
 */
export default function ImageServiceSettings({ draft, onChange, saved, loaded }: { draft: ImageServiceDraft; onChange: (next: ImageServiceDraft) => void; saved: SavedImageKeys; loaded: boolean }) {
  const { t } = useLanguage();
  const set = (patch: Partial<ImageServiceDraft>) => onChange({ ...draft, ...patch });
  const about: Record<ImageProvider, string> = {
    gemini: t('stgImgGemini', 'Recommandé. Garde ton produit tel qu’il est, avec la clé Gemini ci-dessus (facturation activée).'),
    openai: t('stgImgOpenai', 'Garde ton produit. Payant : il faut du crédit sur ton compte OpenAI, et OpenAI peut demander de vérifier ton organisation.'),
    fal: t('stgImgFal', 'FLUX Kontext : garde ton produit. Payant à l’image, sur ton compte fal.ai.'),
    cloudflare: t('stgImgCloudflare', 'Gratuit chaque jour dans une limite, mais il dessine seulement d’après les mots : il ne garde pas ton produit (pas pour les images de ta page).'),
  };
  const hasKey: Record<ImageProvider, boolean> = { gemini: true, openai: saved.openai, fal: saved.fal, cloudflare: saved.cloudflare };

  return (
    <section aria-labelledby="stg-images" className="ui-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><ImageIcon size={18} /></span>
        <div>
          <h2 id="stg-images" className="text-[15px] font-semibold text-fg">{t('stgImgTitle', 'Service d’images')}</h2>
          <p className="text-xs text-fg-muted">{t('stgImgSubtitleEngines', 'L’IA qui crée tes photos, tes images et tes affiches. Les vidéos IA utilisent toujours Gemini.')}</p>
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">{t('stgImgTitle', 'Service d’images')}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {IMAGE_PROVIDERS.map((id) => {
            const selected = draft.provider === id;
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3 transition-[border-color,background-color] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50',
                  selected ? 'border-primary bg-primary/[0.05]' : 'border-line hover:border-fg/30',
                )}
              >
                {/* until the saved choice is known, a click here would be overwritten by it */}
                <input type="radio" name="image-provider" value={id} checked={selected} disabled={!loaded} onChange={() => set({ provider: id })} className="sr-only" />
                <AiLogo brand={BRAND[id]} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-fg">{IMAGE_PROVIDER_NAMES[id]}</span>
                    {id === 'gemini' && <span className="text-xs font-medium text-primary-ink">{t('stgImgDefault', 'par défaut')}</span>}
                    {id === 'cloudflare' && <span className="text-xs font-medium text-success-ink">{t('stgImgFree', 'gratuit')}</span>}
                    {loaded && id !== 'gemini' && hasKey[id] && <StatusChip state="ready" label={t('stgKeySaved', 'Clé enregistrée')} />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{about[id]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {draft.provider !== 'gemini' && (
        <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
          {draft.provider === 'openai' && (
            <KeyField id="setting-openaiApiKey" label={t('stgImgOpenaiKey', 'Clé API OpenAI')} value={draft.openaiApiKey} onChange={(v) => set({ openaiApiKey: v })} saved={saved.openai} placeholder="sk-…" />
          )}
          {draft.provider === 'fal' && (
            <KeyField id="setting-falApiKey" label={t('stgImgFalKey', 'Clé API fal.ai')} value={draft.falApiKey} onChange={(v) => set({ falApiKey: v })} saved={saved.fal} placeholder="xxxxxxxx-xxxx-…:…" />
          )}
          {draft.provider === 'cloudflare' && (
            <>
              <div>
                <label className="block text-[13px] font-medium text-fg" htmlFor="setting-cloudflareAccountId">{t('stgImgCfAccount', 'Identifiant du compte Cloudflare')}</label>
                <input
                  id="setting-cloudflareAccountId"
                  className="input-dz mt-1.5"
                  value={draft.cloudflareAccountId}
                  onChange={(e) => set({ cloudflareAccountId: e.target.value.trim() })}
                  placeholder="0123456789abcdef0123456789abcdef"
                  maxLength={32}
                  dir="ltr"
                />
              </div>
              <KeyField id="setting-cloudflareApiToken" label={t('stgImgCfToken', 'Jeton API Cloudflare (Workers AI)')} value={draft.cloudflareApiToken} onChange={(v) => set({ cloudflareApiToken: v })} saved={saved.cloudflare} placeholder="…" />
            </>
          )}
          <p className="text-xs leading-relaxed text-fg-muted">{t('stgImgKeyNote', 'La clé est chiffrée et ne quitte jamais le serveur. Laisse le champ vide pour garder celle déjà enregistrée.')}</p>
          <a href={KEY_LINKS[draft.provider]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-ink hover:underline">
            {t('stgImgGetKey', 'Créer une clé chez {service}', { service: IMAGE_PROVIDER_NAMES[draft.provider] })} <ExternalLink size={12} />
          </a>
        </div>
      )}
    </section>
  );
}
