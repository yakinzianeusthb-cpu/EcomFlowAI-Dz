import { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, ExternalLink, KeyRound, Loader2, Save, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { settingsApi } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import PageHeader from './PageHeader';
import MetaConnection, { useMetaReturnNotice, useMetaStatus } from './meta/MetaConnection';
import { StatusChip } from './ui/primitives';
import '../i18n/settings';
import '../i18n/campaigns';

/**
 * Workspace name, the Gemini key and the Meta connection. Secrets are never sent back to the browser: the page
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
  const meta = useMetaStatus();
  useMetaReturnNotice(meta.reload);

  useEffect(() => {
    let cancelled = false;
    settingsApi
      .get()
      .then((saved) => {
        if (cancelled || !saved) return;
        setWorkspaceName(saved.workspaceName ?? '');
        setHasGeminiKey(Boolean(saved.geminiApiKey));
      })
      .catch(() => toast.error(t('stgErreurLorsSauvegarde', 'Erreur lors de la sauvegarde')))
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []); // once, on first render

  const save = async () => {
    setSaving('saving');
    try {
      await settingsApi.update({ workspaceName, geminiApiKey: geminiKey.trim() });
      if (geminiKey.trim()) setHasGeminiKey(true);
      setGeminiKey('');
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
      <PageHeader icon={SettingsIcon} title={t('menuSettings', 'Paramètres')} subtitle={t('stgSubtitleNew', 'Ton espace, ta clé d’IA et tes connexions publicitaires.')} />

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
          <p>{t('stgCetteCleAlimenteToute', 'Cette clé alimente toute la génération IA (images, vidéos, copy, analyses…). Elle est chiffrée et ne quitte jamais le serveur.')}</p>
          <p>{t('stgBillingNote', 'Une clé gratuite suffit pour les textes, les landing pages, les scripts et les publicités. Les images et les clips vidéo IA demandent une clé avec facturation activée.')}</p>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary-ink hover:underline">
            {t('stgGetKey', 'Créer une clé dans Google AI Studio')} <ExternalLink size={12} />
          </a>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving === 'saving' || !loaded} className="btn-dz-primary disabled:opacity-60">
          {saving === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saving === 'saved' ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saving === 'saved' ? t('stgEnregistre', 'Enregistré') : t('stgSauvegarderParametres', 'Sauvegarder les Paramètres')}
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="eyebrow">{t('stgIntegrations', 'Intégrations')}</h2>
        <MetaConnection status={meta.status} failed={meta.failed} reload={meta.reload} />
      </div>
    </div>
  );
}
