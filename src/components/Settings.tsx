import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, ExternalLink, KeyRound, Loader2, Save } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { settingsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from './PageHeader';
import ImageServiceSettings, { type ImageServiceDraft, type SavedImageKeys } from './settings/ImageServiceSettings';
import { DEFAULT_IMAGE_PROVIDER, isImageProvider } from '../lib/imageProviders';
import { StatusChip } from './ui/primitives';
import '../i18n/settings';
import '../i18n/campaigns';

/**
 * Workspace name, the Gemini key and the image service. Secrets are never sent back to the browser: the page
 * only knows whether one is set, and a blank field keeps the stored value.
 */
export default function Settings() {
  const { t } = useLanguage();
  const toast = useToast();
  const [workspaceName, setWorkspaceName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [images, setImages] = useState<ImageServiceDraft>({ provider: DEFAULT_IMAGE_PROVIDER, openaiApiKey: '', falApiKey: '', cloudflareAccountId: '', cloudflareApiToken: '' });
  const [savedImageKeys, setSavedImageKeys] = useState<SavedImageKeys>({ openai: false, fal: false, cloudflare: false });

  useEffect(() => {
    let cancelled = false;
    settingsApi
      .get()
      .then((saved) => {
        if (cancelled || !saved) return;
        setWorkspaceName(saved.workspaceName ?? '');
        setHasGeminiKey(Boolean(saved.geminiApiKey));
        setImages((d) => ({ ...d, provider: isImageProvider(saved.imageProvider) ? saved.imageProvider : DEFAULT_IMAGE_PROVIDER, cloudflareAccountId: saved.cloudflareAccountId ?? '' }));
        setSavedImageKeys({ openai: Boolean(saved.openaiApiKey), fal: Boolean(saved.falApiKey), cloudflare: Boolean(saved.cloudflareApiToken) && Boolean(saved.cloudflareAccountId) });
      })
      .catch(() => toast.error(t('stgErreurLorsSauvegarde', 'Erreur lors de la sauvegarde')))
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []); // once, on first render

  const save = async () => {
    setSaving('saving');
    try {
      const typed = { openaiApiKey: images.openaiApiKey.trim(), falApiKey: images.falApiKey.trim(), cloudflareApiToken: images.cloudflareApiToken.trim() };
      await settingsApi.update({ workspaceName, geminiApiKey: geminiKey.trim(), imageProvider: images.provider, cloudflareAccountId: images.cloudflareAccountId.trim(), ...typed });
      if (geminiKey.trim()) setHasGeminiKey(true);
      setGeminiKey('');
      setSavedImageKeys((s) => ({
        openai: s.openai || Boolean(typed.openaiApiKey),
        fal: s.fal || Boolean(typed.falApiKey),
        cloudflare: Boolean(images.cloudflareAccountId.trim()) && (s.cloudflare || Boolean(typed.cloudflareApiToken)),
      }));
      setImages((d) => ({ ...d, openaiApiKey: '', falApiKey: '', cloudflareApiToken: '' }));
      setSaving('saved');
      toast.success(t('stgParametresEnregistresAvecSucce', 'Paramètres enregistrés avec succès !'));
      setTimeout(() => setSaving('idle'), 2500);
    } catch (err) {
      setSaving('idle');
      toast.error((err as Error).message || t('stgErreurLorsSauvegarde', 'Erreur lors de la sauvegarde'));
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader section="settings" title={t('menuSettings', 'Paramètres')} subtitle={t('stgSubtitleNew', 'Ton espace, ta clé d’IA et tes connexions publicitaires.')} />

      <section aria-labelledby="stg-workspace" className="ui-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><Briefcase size={18} /></span>
          <div>
            <h2 id="stg-workspace" className="text-[15px] font-semibold text-fg">{t('stgInformationsGenerales', 'Informations Générales')}</h2>
            <p className="text-xs text-fg-muted">{t('stgPersonnalisezEspaceTravail', 'Personnalisez votre espace de travail')}</p>
          </div>
        </div>
        <label className="block text-[13px] font-medium text-fg" htmlFor="setting-workspaceName">{t('stgNomWorkspace', 'Nom du Workspace')}</label>
        <input id="setting-workspaceName" className="input-dz mt-1.5" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder={t('stgExMonAgenceE', 'Ex : Mon agence e-commerce...')} maxLength={80} />
      </section>

      <section aria-labelledby="stg-gemini" className="ui-card p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="grid size-10 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><KeyRound size={18} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="stg-gemini" className="text-[15px] font-semibold text-fg">Google Gemini</h2>
            <p className="text-xs text-fg-muted">{t('stgCleApiGenerationContenu', 'Clé API pour la génération de contenu et analyses stratégiques')}</p>
          </div>
          {loaded && <StatusChip state={hasGeminiKey ? 'ready' : 'none'} label={hasGeminiKey ? t('stgKeySaved', 'Clé enregistrée') : t('stgNoKey', 'Aucune clé')} />}
        </div>
        <label className="block text-[13px] font-medium text-fg" htmlFor="setting-geminiApiKey">{t('stgCleApiGeminiV1', 'Clé API Gemini')}</label>
        <input
          id="setting-geminiApiKey"
          type="password"
          autoComplete="off"
          className="input-dz mt-1.5"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          placeholder={hasGeminiKey ? t('stgConfigureLaisserVideConserver', '•••••••• (configuré — laisser vide pour conserver)') : t('stgIntroduisezCleApiAi', 'Introduisez votre clé API AI Studio...')}
          dir="ltr"
        />
        <div className="mt-3 space-y-1.5 text-xs leading-relaxed text-fg-muted">
          <p>{t('stgCetteCleAlimenteToute', 'Cette clé alimente la génération IA (textes, vidéos, analyses, et les images sauf si tu choisis un autre service plus bas). Elle est chiffrée et ne quitte jamais le serveur.')}</p>
          <p>{t('stgBillingNote', 'Une clé gratuite suffit pour les textes, les landing pages, les scripts et les publicités. Les images et les clips vidéo IA demandent une clé avec facturation activée.')}</p>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-ink hover:underline">
            {t('stgGetKey', 'Créer une clé dans Google AI Studio')} <ExternalLink size={12} />
          </a>
        </div>
      </section>

      <ImageServiceSettings draft={images} onChange={setImages} saved={savedImageKeys} loaded={loaded} />

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving === 'saving' || !loaded} className="btn-dz-primary disabled:opacity-60">
          {saving === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saving === 'saved' ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving === 'saved' ? t('stgEnregistre', 'Enregistré') : t('stgSauvegarderParametres', 'Sauvegarder les Paramètres')}
        </button>
      </div>
    </div>
  );
}
