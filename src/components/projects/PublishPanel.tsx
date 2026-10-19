import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, ExternalLink, Loader2, Megaphone, Pause, Play, RefreshCw, Rocket } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../i18n/dates';
import { AD_FORMATS, type AdFormat } from '../../lib/adCreative';
import { blobToDataUrl, renderCreativeBlob } from '../../lib/adCreativeRender';
import { ApiError, metaApi, type MetaAccounts, type MetaCampaignLive, type MetaCampaignRecord } from '../../services/campaigns';
import MetaConnection, { useMetaReturnNotice, useMetaStatus } from '../meta/MetaConnection';
import { creativeInput, type CreativeAssets } from '../ads/CreativeCard';
import { useCreativeImages } from '../ads/useCreativeImages';
import { EmptyState, Field, Segmented, Skeleton, StatusChip, type StatusState } from '../ui/primitives';
import { useBrandKit, type ProjectHandle } from './useProject';
import type { AdsOutput } from './useGenerators';
import '../../i18n/campaigns';

type Objective = 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS' | 'OUTCOME_SALES';

const tomorrowAt9 = () => {
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
};

/** How Meta describes a campaign, in plain words. */
function useStatusLabel() {
  const { t } = useLanguage();
  return (effective?: string): { state: StatusState; label: string } => {
    switch (effective) {
      case 'ACTIVE': return { state: 'ready', label: t('metaStActive', 'Active chez Meta') };
      case 'PENDING_REVIEW':
      case 'IN_PROCESS': return { state: 'running', label: t('metaStReview', 'En cours d’examen par Meta') };
      case 'DISAPPROVED':
      case 'WITH_ISSUES': return { state: 'failed', label: t('metaStRejected', 'Refusée ou bloquée par Meta') };
      case 'PAUSED':
      case 'CAMPAIGN_PAUSED':
      case 'ADSET_PAUSED': return { state: 'none', label: t('metaStPaused', 'En pause : rien n’est dépensé') };
      default: return { state: 'none', label: effective || t('metaStUnknown', 'Statut inconnu') };
    }
  };
}

function CampaignCard({ record, projectReload, onReconnect }: { record: MetaCampaignRecord; projectReload: () => Promise<boolean>; onReconnect: () => void }) {
  const { t, language } = useLanguage();
  const toast = useToast();
  const statusLabel = useStatusLabel();
  const [live, setLive] = useState<MetaCampaignLive | null>(null);
  const [liveError, setLiveError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = record.settings;

  const refresh = () => {
    setLiveError('');
    metaApi.campaign(record.campaignId).then(setLive).catch((err) => {
      if (err instanceof ApiError && err.reconnect) onReconnect();
      setLiveError((err as Error).message || t('metaLiveFailed', 'Impossible de lire le statut chez Meta.'));
    });
  };
  useEffect(refresh, [record.campaignId]); // read Meta again when the campaign changes

  const change = async (action: 'activate' | 'pause') => {
    setBusy(true);
    try {
      await (action === 'activate' ? metaApi.activate(record.campaignId) : metaApi.pause(record.campaignId));
      setConfirming(false);
      setUnderstood(false);
      void projectReload();
      refresh();
      toast.success(action === 'activate' ? t('metaActivated', 'Campagne envoyée à Meta pour diffusion.') : t('metaPausedToast', 'Campagne mise en pause.'));
    } catch (err) {
      if (err instanceof ApiError && err.reconnect) onReconnect();
      toast.error((err as Error).message || t('metaLiveFailed', 'Impossible de lire le statut chez Meta.'));
    } finally {
      setBusy(false);
    }
  };

  // the ad is what Meta delivers, and its status already includes the campaign's and the ad set's (CAMPAIGN_PAUSED…)
  const effective = live?.ad.effectiveStatus ?? live?.campaign.effectiveStatus ?? record.effectiveStatus ?? record.status;
  const st = statusLabel(effective);
  const isActive = (live?.campaign.status ?? record.status) === 'ACTIVE';
  const budget = `${Number(s.dailyBudget).toLocaleString(language === 'ar' ? 'ar-DZ' : language)} ${s.currency}`;
  const accountDigits = record.adAccountId.replace(/^act_/, '');
  const feedback = live?.ad.reviewFeedback;
  const feedbackText = typeof feedback === 'string' ? feedback : feedback && typeof feedback === 'object' ? Object.values(feedback).filter((v): v is string => typeof v === 'string').join(' · ') : '';
  const metrics: [string, string][] = live?.insights
    ? ([
        [t('metaImpressions', 'Impressions'), live.insights.impressions],
        [t('metaReach', 'Personnes touchées'), live.insights.reach],
        [t('metaClicks', 'Clics'), live.insights.clicks],
        [t('metaSpend', 'Dépensé'), live.insights.spend && `${live.insights.spend} ${s.currency}`],
        [t('metaCtr', 'Taux de clic'), live.insights.ctr && `${Number(live.insights.ctr).toFixed(2)} %`],
        [t('metaCpc', 'Coût par clic'), live.insights.cpc && `${Number(live.insights.cpc).toFixed(2)} ${s.currency}`],
      ].filter(([, v]) => Boolean(v)) as [string, string][])
    : [];

  return (
    <section aria-labelledby="meta-campaign" className="ui-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-5">
        <div className="min-w-0 flex-1">
          <h2 id="meta-campaign" className="text-[15px] font-semibold text-fg" dir="auto">{s.name}</h2>
          <p className="mt-0.5 text-xs text-fg-faint" dir="ltr">ID {record.campaignId}</p>
        </div>
        <StatusChip state={st.state} label={st.label} />
        <button type="button" onClick={refresh} aria-label={t('metaRefresh', 'Actualiser le statut')} className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-surface-2 hover:text-fg"><RefreshCw size={15} /></button>
      </div>
      <dl className="grid gap-x-6 gap-y-3 p-5 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-fg-faint">{t('metaDailyBudget', 'Budget quotidien')}</dt><dd className="font-medium text-fg"><bdi dir="ltr">{budget}</bdi></dd></div>
        <div><dt className="text-fg-faint">{t('metaStart', 'Début')}</dt><dd className="font-medium text-fg">{formatDateTime(s.startTime, language)}</dd></div>
        <div><dt className="text-fg-faint">{t('metaEnd', 'Fin')}</dt><dd className="font-medium text-fg">{s.endTime ? formatDateTime(s.endTime, language) : t('metaNoEnd', 'Pas de date de fin')}</dd></div>
        <div><dt className="text-fg-faint">{t('metaAudience', 'Audience')}</dt><dd className="font-medium text-fg" dir="ltr">{(s.countries ?? []).join(', ')} · {s.ageMin}–{s.ageMax}</dd></div>
        <div className="sm:col-span-2"><dt className="text-fg-faint">{t('metaLink', 'Lien de destination')}</dt><dd className="truncate font-medium text-fg" dir="ltr">{s.link}</dd></div>
      </dl>
      {liveError && <p role="alert" className="mx-5 mb-4 flex items-center gap-2 text-[13px] text-danger-ink"><CircleAlert size={14} /> {liveError}</p>}
      {feedbackText && (
        <p className="mx-5 mb-4 rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger-ink" dir="auto">
          {t('metaReviewFeedback', 'Retour de Meta :')} {feedbackText}
        </p>
      )}
      {metrics.length > 0 && (
        <div className="border-t border-line p-5">
          <p className="eyebrow mb-3">{t('metaRealResults', 'Résultats réels, lus chez Meta')}</p>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {metrics.map(([label, value]) => (
              <div key={label}><dt className="text-xs text-fg-faint">{label}</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg"><bdi dir="ltr">{value}</bdi></dd></div>
            ))}
          </dl>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line p-5">
        <a href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${accountDigits}&selected_campaign_ids=${record.campaignId}`} target="_blank" rel="noopener noreferrer" className="me-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-ink hover:underline">
          {t('metaOpenAdsManager', 'Ouvrir dans le Gestionnaire de publicités')} <ExternalLink size={13} />
        </a>
        {isActive ? (
          <button type="button" onClick={() => change('pause')} disabled={busy} className="btn-dz-secondary">{busy ? <Loader2 size={15} className="animate-spin" /> : <Pause size={15} />} {t('metaPause', 'Mettre en pause')}</button>
        ) : !confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="btn-dz-primary"><Play size={15} /> {t('metaActivate', 'Activer la campagne')}</button>
        ) : null}
      </div>

      {confirming && !isActive && (
        <div className="border-t border-line bg-surface-2 p-5" role="group" aria-labelledby="meta-confirm-title">
          <h3 id="meta-confirm-title" className="text-sm font-semibold text-fg">{t('metaConfirmTitle', 'Vérifie avant de lancer')}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
            {t('metaConfirmText', 'Meta va diffuser cette publicité et dépenser jusqu’à {budget} par jour à partir du {start}, après validation de la publicité par Meta.', { budget, start: formatDateTime(s.startTime, language) })}
          </p>
          <label className="mt-3 flex items-start gap-2 text-[13px] text-fg">
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
            {t('metaConfirmCheck', 'Je confirme les réglages et j’accepte que Meta facture ce budget sur mon compte publicitaire.')}
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => { setConfirming(false); setUnderstood(false); }} className="btn-dz-secondary">{t('cmpCancel', 'Annuler')}</button>
            <button type="button" onClick={() => change('activate')} disabled={!understood || busy} className="btn-dz-primary disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} {t('metaActivateNow', 'Lancer la diffusion')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CampaignForm({ project, ads, onCreated, onReconnect }: { project: ProjectHandle; ads: AdsOutput; onCreated: () => Promise<boolean>; onReconnect: () => void }) {
  const { t } = useLanguage();
  const { kit } = useBrandKit();
  const p = project.detail!.project;
  const [accounts, setAccounts] = useState<MetaAccounts | null>(null);
  const [accountsError, setAccountsError] = useState('');
  const firstChosen = ads.pack.concepts.find((c) => ads.selected.includes(c.id)) ?? ads.pack.concepts[0];
  const [form, setForm] = useState({
    adAccountId: '',
    pageId: '',
    objective: 'OUTCOME_TRAFFIC' as Objective,
    pixelId: '',
    conceptId: firstChosen?.id ?? '',
    format: 'square' as AdFormat,
    link: '',
    dailyBudget: '',
    start: tomorrowAt9(),
    end: '',
    countries: 'DZ',
    ageMin: '18',
    ageMax: '65',
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    metaApi.accounts()
      .then((a) => {
        setAccounts(a);
        setForm((f) => ({
          ...f,
          adAccountId: a.defaults.adAccountId && a.adAccounts.some((x) => x.id === a.defaults.adAccountId) ? a.defaults.adAccountId : a.adAccounts[0]?.id ?? '',
          pageId: a.defaults.pageId && a.pages.some((x) => x.id === a.defaults.pageId) ? a.defaults.pageId : a.pages[0]?.id ?? '',
        }));
      })
      .catch((err) => {
        if (err instanceof ApiError && err.reconnect) onReconnect();
        setAccountsError((err as Error).message || t('metaLiveFailed', 'Impossible de lire le statut chez Meta.'));
      });
  }, []); // once, when the form opens

  const loaded = useCreativeImages(project.detail!.assets.filter((a) => a.kind === 'product').map((a) => a.id), kit?.logoAssetId);
  const images = useMemo<CreativeAssets | null>(
    () => (loaded ? { ...loaded, brandColor: kit?.colors?.[0], price: p.price || undefined, language: p.language, productName: p.productName || p.name } : null),
    [loaded, kit?.colors, p.price, p.language, p.productName, p.name],
  );

  const concept = ads.pack.concepts.find((c) => c.id === form.conceptId) ?? firstChosen;
  const conceptIndex = Math.max(0, ads.pack.concepts.indexOf(concept));
  const creative = useMemo(() => (images && concept ? creativeInput(concept, conceptIndex, form.format, images) : null), [images, concept, conceptIndex, form.format]);
  useEffect(() => {
    if (!creative) return;
    let url: string | null = null;
    let alive = true;
    renderCreativeBlob(creative).then((blob) => {
      if (!alive) return;
      url = URL.createObjectURL(blob);
      setPreview(url);
    }).catch(() => setPreview(null));
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [creative]);

  const account = accounts?.adAccounts.find((a) => a.id === form.adAccountId);

  const create = async () => {
    if (!creative || !concept) return;
    if (!form.start || Number.isNaN(new Date(form.start).getTime())) {
      setError(t('metaStartRequired', 'Indique la date et l’heure de début.'));
      return;
    }
    setError('');
    setCreating(true);
    try {
      const dataUrl = await blobToDataUrl(await renderCreativeBlob(creative));
      await metaApi.saveDefaults({ adAccountId: form.adAccountId || null, pageId: form.pageId || null }).catch(() => null);
      await metaApi.createCampaign(p.id, {
        adAccountId: form.adAccountId,
        pageId: form.pageId,
        objective: form.objective,
        pixelId: form.pixelId.trim() || undefined,
        dailyBudget: Number(form.dailyBudget.replace(',', '.')),
        currency: account?.currency || 'USD',
        startTime: new Date(form.start).toISOString(),
        endTime: form.end ? new Date(form.end).toISOString() : null,
        countries: form.countries.split(/[\s,]+/).map((c) => c.trim().toUpperCase()).filter(Boolean),
        ageMin: Number(form.ageMin),
        ageMax: Number(form.ageMax),
        link: form.link.trim(),
        name: `${p.name} — ${concept.angle || concept.headline}`.slice(0, 200),
        primaryText: concept.primaryText,
        headline: concept.headline,
        description: concept.description,
        callToAction: concept.callToAction,
        imageBase64: dataUrl.split(',')[1],
      });
      // created at Meta: if the page cannot refresh, say so rather than leaving the form as if nothing happened
      if (!(await onCreated())) setError(t('metaCreatedReloadFailed', 'La campagne a été créée chez Meta, en pause. Recharge la page pour la voir ici.'));
    } catch (err) {
      if (err instanceof ApiError && err.reconnect) onReconnect();
      setError(err instanceof ApiError && err.message ? err.message : t('metaCreateFailed', 'La campagne n’a pas pu être créée chez Meta.'));
    } finally {
      setCreating(false);
    }
  };

  if (accountsError) return <p role="alert" className="ui-card p-5 text-[13px] text-danger-ink">{accountsError}</p>;
  if (!accounts) return <Skeleton className="h-96 w-full" />;
  if (!accounts.adAccounts.length || !accounts.pages.length) {
    return (
      <EmptyState
        icon={CircleAlert}
        title={!accounts.adAccounts.length ? t('metaNoAccounts', 'Aucun compte publicitaire accessible avec cette connexion.') : t('metaNoPages', 'Aucune Page Facebook accessible avec cette connexion.')}
        body={t('metaAccessHint', 'Vérifie dans Meta Business que ton profil a accès au compte publicitaire et à la Page, puis reconnecte Meta en acceptant toutes les autorisations.')}
      />
    );
  }

  return (
    <section aria-labelledby="meta-new" className="ui-card overflow-hidden">
      <div className="border-b border-line p-5">
        <h2 id="meta-new" className="text-[15px] font-semibold text-fg">{t('metaNewTitle', 'Préparer la campagne Meta')}</h2>
        <p className="mt-1 text-[13px] text-fg-muted">{t('metaNewIntro', 'La campagne est créée en pause : rien n’est diffusé ni dépensé avant que tu l’actives.')}</p>
      </div>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('metaAdAccount', 'Compte publicitaire')}>
              {(id) => (
                <select id={id} className="input-dz" value={form.adAccountId} onChange={(e) => set('adAccountId', e.target.value)}>
                  {accounts.adAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency}){a.active ? '' : ` · ${t('metaInactive', 'inactif')}`}</option>)}
                </select>
              )}
            </Field>
            <Field label={t('metaPage', 'Page Facebook')}>
              {(id) => (
                <select id={id} className="input-dz" value={form.pageId} onChange={(e) => set('pageId', e.target.value)}>
                  {accounts.pages.map((pg) => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                </select>
              )}
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">{t('metaObjective', 'Objectif chez Meta')}</p>
            <Segmented
              label={t('metaObjective', 'Objectif chez Meta')}
              value={form.objective}
              onChange={(v) => set('objective', v)}
              options={[
                { value: 'OUTCOME_TRAFFIC', label: t('metaObjTraffic', 'Visites de ta page') },
                { value: 'OUTCOME_SALES', label: t('metaObjSales', 'Ventes (pixel)') },
                { value: 'OUTCOME_AWARENESS', label: t('metaObjAwareness', 'Notoriété') },
              ]}
            />
          </div>
          {form.objective === 'OUTCOME_SALES' && (
            <Field label={t('metaPixel', 'Identifiant du pixel Meta')} hint={t('metaPixelHint', 'Ton pixel doit être installé sur ta page de vente et suivre l’événement Purchase.')}>
              {(id) => <input id={id} className="input-dz" dir="ltr" inputMode="numeric" value={form.pixelId} onChange={(e) => set('pixelId', e.target.value)} />}
            </Field>
          )}
          <Field label={t('metaLink', 'Lien de destination')} hint={t('metaLinkHint', 'L’adresse https publique de ta landing page (le fichier HTML téléchargé, mis en ligne chez ton hébergeur).')}>
            {(id) => <input id={id} className="input-dz" dir="ltr" type="url" placeholder="https://" value={form.link} onChange={(e) => set('link', e.target.value)} />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t('metaDailyBudgetIn', 'Budget par jour ({currency})', { currency: account?.currency || '—' })}>
              {(id) => <input id={id} className="input-dz" dir="ltr" inputMode="decimal" value={form.dailyBudget} onChange={(e) => set('dailyBudget', e.target.value)} />}
            </Field>
            <Field label={t('metaStart', 'Début')}>{(id) => <input id={id} type="datetime-local" className="input-dz" dir="ltr" value={form.start} onChange={(e) => set('start', e.target.value)} />}</Field>
            <Field label={t('metaEndOptional', 'Fin (facultatif)')}>{(id) => <input id={id} type="datetime-local" className="input-dz" dir="ltr" value={form.end} onChange={(e) => set('end', e.target.value)} />}</Field>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t('metaCountries', 'Pays')} hint={t('metaCountriesHint', 'Codes à 2 lettres séparés par des virgules.')}>
              {(id) => <input id={id} className="input-dz" dir="ltr" value={form.countries} onChange={(e) => set('countries', e.target.value)} />}
            </Field>
            <Field label={t('metaAgeMin', 'Âge minimum')}>{(id) => <input id={id} type="number" min={13} max={65} className="input-dz" value={form.ageMin} onChange={(e) => set('ageMin', e.target.value)} />}</Field>
            <Field label={t('metaAgeMax', 'Âge maximum')}>{(id) => <input id={id} type="number" min={13} max={65} className="input-dz" value={form.ageMax} onChange={(e) => set('ageMax', e.target.value)} />}</Field>
          </div>
        </div>

        <div className="space-y-4">
          <Field label={t('metaConcept', 'Publicité à utiliser')}>
            {(id) => (
              <select id={id} className="input-dz" value={form.conceptId} onChange={(e) => set('conceptId', e.target.value)}>
                {ads.pack.concepts.map((c, i) => <option key={c.id} value={c.id}>{`${i + 1}. ${c.angle || c.headline}`}</option>)}
              </select>
            )}
          </Field>
          <Segmented
            label={t('cmpAdFormat', 'Format des visuels')}
            value={form.format}
            onChange={(v) => set('format', v)}
            options={(Object.keys(AD_FORMATS) as AdFormat[]).map((f) => ({ value: f, label: AD_FORMATS[f].ratio }))}
          />
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface-2" style={{ aspectRatio: `${AD_FORMATS[form.format].width} / ${AD_FORMATS[form.format].height}` }}>
            {preview ? <img src={preview} alt={t('cmpCreativeAlt', 'Visuel publicitaire : {headline}', { headline: concept?.headline ?? '' })} className="size-full object-cover" /> : <Skeleton className="size-full rounded-none" />}
          </div>
          {concept && (
            <div className="space-y-1 text-[13px]">
              <p className="font-semibold text-fg" dir="auto">{concept.headline}</p>
              <p className="text-fg-muted" dir="auto">{concept.primaryText}</p>
            </div>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mx-5 mb-4 rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger-ink" dir="auto">{error}</p>}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line p-5">
        <p className="me-auto text-xs text-fg-faint">{t('metaPausedNote', 'Créée en pause. Tu pourras vérifier puis activer.')}</p>
        <button type="button" onClick={create} disabled={creating || !preview} className="btn-dz-primary disabled:opacity-60">
          {creating ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />} {t('metaCreatePaused', 'Créer la campagne en pause')}
        </button>
      </div>
    </section>
  );
}

export default function PublishPanel({ project }: { project: ProjectHandle }) {
  const { t } = useLanguage();
  const meta = useMetaStatus();
  useMetaReturnNotice(meta.reload);
  const outputs = project.detail!.outputs;
  const ads = outputs.ads?.data as AdsOutput | undefined;
  const record = outputs.meta_campaign?.data as MetaCampaignRecord | undefined;
  const ready = meta.status?.configured && meta.status.connected && !meta.status.expired;

  return (
    <div className="space-y-6">
      <MetaConnection status={meta.status} failed={meta.failed} reload={meta.reload} compact />
      {ready && record && <CampaignCard record={record} projectReload={project.reload} onReconnect={meta.reload} />}
      {ready && !record && (ads ? (
        <CampaignForm project={project} ads={ads} onCreated={project.reload} onReconnect={meta.reload} />
      ) : (
        <EmptyState icon={Megaphone} title={t('metaNeedAds', 'Génère d’abord tes publicités')} body={t('metaNeedAdsText', 'La campagne Meta utilise un des concepts et un des visuels de l’onglet Publicités.')} />
      ))}
      {!ready && meta.status && (
        <section aria-labelledby="manual-publish" className="ui-card p-5">
          <h2 id="manual-publish" className="text-[15px] font-semibold text-fg">{t('metaManualTitle', 'Publier à la main en attendant')}</h2>
          <ol className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-fg-muted">
            <li>1. {t('metaManual1', 'Dans l’onglet Publicités, choisis tes concepts, télécharge les visuels et exporte les textes.')}</li>
            <li>2. {t('metaManual2', 'Mets ta landing page en ligne (fichier HTML de l’onglet Landing page) et copie son adresse.')}</li>
            <li>3. {t('metaManual3', 'Dans le Gestionnaire de publicités Meta, crée une campagne Trafic ou Ventes avec ces visuels, ces textes et ce lien.')}</li>
          </ol>
        </section>
      )}
    </div>
  );
}
