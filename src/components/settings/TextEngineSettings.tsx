import { useState } from 'react';
import { ExternalLink, Loader2, PenLine, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { TEXT_ENGINES, TEXT_PROVIDERS, type TextProvider } from '../../lib/textEngines';
import { aiModelsApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { StatusChip } from '../ui/primitives';
import { AiLogo } from '../ui/AiLogo';
import '../../i18n/settings';
import '../../i18n/campaigns';

type KeyedProvider = Exclude<TextProvider, 'gemini'>;

/** The engine picked in this visit, its model, and the keys typed (blank = keep the saved one). */
export interface TextEngineDraft {
  provider: TextProvider;
  model: string;
  keys: Record<KeyedProvider, string>;
}
export type SavedEngineKeys = Record<KeyedProvider, boolean>;

export const EMPTY_ENGINE_KEYS: Record<KeyedProvider, string> = { openai: '', anthropic: '', mistral: '', deepseek: '', xai: '', openrouter: '' };

/**
 * Which AI writes the texts (landing pages, scripts, analyses): Gemini by default, or another service on the seller's
 * own key. The keys are sent once, stored encrypted and never shown again; AI video always uses Gemini.
 */
export default function TextEngineSettings({ draft, onChange, saved, loaded }: { draft: TextEngineDraft; onChange: (next: TextEngineDraft) => void; saved: SavedEngineKeys; loaded: boolean }) {
  const { t } = useLanguage();
  const [models, setModels] = useState<Partial<Record<KeyedProvider, string[]>>>({});
  const [loading, setLoading] = useState(false);
  const [modelsError, setModelsError] = useState('');
  const set = (patch: Partial<TextEngineDraft>) => onChange({ ...draft, ...patch });

  const about: Record<TextProvider, string> = {
    gemini: t('stgTxtGemini', 'Par défaut. Gratuit pour les textes avec une clé Google AI Studio, ou avec tes points.'),
    openai: t('stgTxtOpenai', 'GPT : très bon rédacteur, lit tes photos. Payant sur ton compte OpenAI.'),
    anthropic: t('stgTxtAnthropic', 'Claude : excellent pour les textes de vente, lit tes photos. Payant sur ton compte Anthropic.'),
    mistral: t('stgTxtMistral', 'Modèles européens, à l’aise en français. Payant sur ton compte Mistral.'),
    deepseek: t('stgTxtDeepseek', 'Très économique, mais ne lit pas les photos : les textes seulement.'),
    xai: t('stgTxtXai', 'Grok, de xAI : lit tes photos. Payant sur ton compte xAI.'),
    openrouter: t('stgTxtOpenrouter', 'Des centaines de modèles (Llama, Qwen, Claude, GPT…) avec une seule clé.'),
  };

  const provider = draft.provider;
  const keyed = provider === 'gemini' ? null : provider;
  const loadModels = async () => {
    if (!keyed) return;
    setLoading(true);
    setModelsError('');
    try {
      const list = await aiModelsApi.list(keyed);
      setModels((m) => ({ ...m, [keyed]: list }));
      if (!list.length) setModelsError(t('stgTxtNoModels', 'Aucun modèle trouvé pour cette clé.'));
    } catch (err) {
      setModelsError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="stg-text-engine" className="ui-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><PenLine size={18} /></span>
        <div>
          <h2 id="stg-text-engine" className="text-[15px] font-semibold text-fg">{t('stgTxtTitle', 'Moteur IA des textes')}</h2>
          <p className="text-xs text-fg-muted">{t('stgTxtSubtitle', 'L’IA qui écrit tes landing pages, tes scripts vidéo et tes analyses. Choisis celle avec qui tu travailles.')}</p>
        </div>
      </div>

      <fieldset>
        <legend className="sr-only">{t('stgTxtTitle', 'Moteur IA des textes')}</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TEXT_PROVIDERS.map((id) => {
            const selected = provider === id;
            return (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-[var(--radius-md)] border p-3 transition-[border-color,background-color] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50',
                  selected ? 'border-primary bg-primary/[0.05]' : 'border-line hover:border-fg/30',
                )}
              >
                {/* until the saved choice is known, a click here would be overwritten by it */}
                <input type="radio" name="text-engine" value={id} checked={selected} disabled={!loaded} onChange={() => set({ provider: id, model: '' })} className="sr-only" />
                <AiLogo brand={id} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-fg">{TEXT_ENGINES[id].name}</span>
                    {id === 'gemini' && <span className="text-xs font-medium text-primary-ink">{t('stgImgDefault', 'par défaut')}</span>}
                    {loaded && id !== 'gemini' && saved[id] && <StatusChip state="ready" label={t('stgKeySaved', 'Clé enregistrée')} />}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-fg-muted">{about[id]}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {keyed ? (
        <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
          <div>
            <label className="block text-[13px] font-medium text-fg" htmlFor="setting-engine-key">{t('stgTxtKey', 'Clé API {service}', { service: TEXT_ENGINES[keyed].name })}</label>
            <input
              id="setting-engine-key"
              type="password"
              autoComplete="off"
              className="input-dz mt-1.5"
              value={draft.keys[keyed]}
              onChange={(e) => set({ keys: { ...draft.keys, [keyed]: e.target.value } })}
              placeholder={saved[keyed] ? t('stgConfigureLaisserVideConserver', '•••••••• (configuré — laisser vide pour conserver)') : TEXT_ENGINES[keyed].keyPlaceholder}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-fg" htmlFor="setting-engine-model">{t('stgTxtModel', 'Modèle')}</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <input
                id="setting-engine-model"
                list="engine-models"
                className="input-dz min-w-[12rem] flex-1"
                value={draft.model}
                onChange={(e) => set({ model: e.target.value.trim() })}
                placeholder={TEXT_ENGINES[keyed].defaultModel}
                maxLength={120}
                dir="ltr"
              />
              <datalist id="engine-models">{(models[keyed] ?? []).map((m) => <option key={m} value={m} />)}</datalist>
              <button type="button" onClick={() => void loadModels()} disabled={loading || !saved[keyed]} className="btn-dz-secondary disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} {t('stgTxtLoadModels', 'Charger les modèles')}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-fg-muted">
              {saved[keyed]
                ? models[keyed]?.length
                  ? t('stgTxtModelsLoaded', '{count} modèles disponibles avec ta clé : tape pour chercher dans la liste.', { count: models[keyed]!.length })
                  : t('stgTxtModelHint', 'Vide = {model}, le modèle conseillé. « Charger les modèles » liste ceux de ta clé.', { model: TEXT_ENGINES[keyed].defaultModel })
                : t('stgTxtSaveFirst', 'Enregistre d’abord ta clé pour voir la liste de ses modèles. Vide = {model}.', { model: TEXT_ENGINES[keyed].defaultModel })}
            </p>
            {modelsError && <p className="mt-1 text-xs text-warning-ink" role="alert">{modelsError}</p>}
          </div>
          {!TEXT_ENGINES[keyed].vision && <p className="text-xs text-warning-ink">{t('stgTxtNoVision', 'Ce moteur ne lit pas les photos : l’analyse de tes photos produit se fera sans elles.')}</p>}
          <p className="text-xs leading-relaxed text-fg-muted">{t('stgTxtKeyNote', 'La clé est chiffrée et ne quitte jamais le serveur. Les images, la voix off et les vidéos se choisissent plus bas.')}</p>
          <a href={TEXT_ENGINES[keyed].keyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary-ink hover:underline">
            {t('stgImgGetKey', 'Créer une clé chez {service}', { service: TEXT_ENGINES[keyed].name })} <ExternalLink size={12} />
          </a>
        </div>
      ) : (
        <p className="mt-4 text-xs leading-relaxed text-fg-muted">{t('stgTxtGeminiNote', 'Les textes utilisent ta clé Gemini ci-dessous, ou tes points si tu n’as pas de clé.')}</p>
      )}
    </section>
  );
}
