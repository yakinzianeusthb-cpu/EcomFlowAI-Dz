import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { TAB_PATHS, projectPath } from '../../lib/nav';
import { MAX_PRODUCT_PHOTOS, type ProjectLanguage, type ProjectObjective, type ProjectPlatform } from '../../lib/projectRules';
import { fileToUploadDataUrl } from '../../lib/imageCompress';
import { cn } from '../../lib/utils';
import { analyzeProductFromImage } from '../../services/gemini';
import { ApiError, assetsApi, projectsApi } from '../../services/campaigns';
import PageHeader from '../PageHeader';
import { ChipToggles, Field, ImageDrop, Segmented } from '../ui/primitives';
import { languageOptions, objectiveOptions, platformOptions } from './labels';
import { takePendingPhotos } from './pendingPhotos';
import '../../i18n/campaigns';

interface Draft {
  productName: string;
  name: string;
  description: string;
  price: string;
  objective: ProjectObjective;
  audience: string;
  tone: string;
  platforms: ProjectPlatform[];
  language: ProjectLanguage;
}

const EMPTY: Draft = { productName: '', name: '', description: '', price: '', objective: 'sales', audience: '', tone: '', platforms: ['facebook', 'instagram'], language: 'ar' };

export default function NewProject() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [photos, setPhotos] = useState<File[]>(takePendingPhotos);
  const [advanced, setAdvanced] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [saving, setSaving] = useState<null | { done: number; total: number }>(null);
  const [error, setError] = useState('');

  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const addPhotos = (files: File[]) => setPhotos((p) => [...p, ...files].slice(0, MAX_PRODUCT_PHOTOS));

  const fillWithAi = async () => {
    if (!photos[0]) return;
    setError('');
    setAnalysing(true);
    try {
      const dataUrl = await fileToUploadDataUrl(photos[0]);
      const [head, data] = dataUrl.split(',');
      const mimeType = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg';
      const a = await analyzeProductFromImage({ data, mimeType });
      const points = Array.isArray(a?.sellingPoints) ? a.sellingPoints.filter(Boolean).map((p: string) => `- ${p}`).join('\n') : '';
      setDraft((d) => ({
        ...d,
        productName: d.productName || (d.language === 'ar' ? a?.nameAr || a?.name : a?.name) || '',
        description: d.description || [a?.briefDescription, points].filter(Boolean).join('\n'),
        audience: d.audience || a?.targetAudience || '',
        tone: d.tone || a?.tone || '',
      }));
      setAdvanced(true);
    } catch (err) {
      setError((err as Error)?.message || t('cmpAiFailed', 'L’IA n’a pas pu analyser la photo. Remplis les champs à la main.'));
    } finally {
      setAnalysing(false);
    }
  };

  const create = async () => {
    if (!draft.productName.trim()) {
      setError(t('cmpNeedProduct', 'Indique au moins le nom du produit.'));
      return;
    }
    setError('');
    setSaving({ done: 0, total: photos.length });
    let projectId: string;
    try {
      projectId = (await projectsApi.create({ ...draft, name: draft.name.trim() || draft.productName.trim() })).id;
    } catch (err) {
      setSaving(null);
      setError(err instanceof ApiError && err.message ? err.message : t('cmpCreateFailed', 'La campagne n’a pas pu être créée. Réessaie.'));
      return;
    }
    // the campaign exists from here on: a photo that fails is reported, never a reason to create it again
    let failedUploads = 0;
    for (let i = 0; i < photos.length; i++) {
      await assetsApi.uploadFile(photos[i], { kind: 'product', projectId }).catch(() => { failedUploads++; });
      setSaving({ done: i + 1, total: photos.length });
    }
    if (failedUploads) toast.error(t('cmpSomePhotosFailed', 'Certaines photos n’ont pas pu être envoyées. Ajoute-les depuis l’onglet Brief et photos.'));
    navigate(projectPath(projectId), { replace: true });
  };

  return (
    <div className="space-y-8">
      <button type="button" onClick={() => navigate(TAB_PATHS.projects)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} className="rtl:rotate-180" /> {t('menuProjects', 'Campagnes')}
      </button>
      <PageHeader icon={Plus} title={t('navNewCampaign', 'Nouvelle campagne')} subtitle={t('cmpNewSubtitle', 'Commence par les photos du produit : l’IA peut remplir le reste à ta place.')} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-labelledby="new-photos" className="ui-card space-y-4 p-5">
          <div>
            <h2 id="new-photos" className="text-[15px] font-semibold text-fg">{t('cmpPhotosTitle', 'Photos du produit')}</h2>
            <p className="mt-1 text-[13px] text-fg-muted">{t('cmpPhotosHint', 'Jusqu’à 8 photos nettes, sur fond simple de préférence. La première sert de couverture.')}</p>
          </div>
          {photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2.5">
              {previews.map((src, i) => (
                <li key={src} className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-line bg-surface-2">
                  <img src={src} alt="" className="size-full object-cover" />
                  {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-[var(--radius-xs)] bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">{t('cmpCover', 'Couverture')}</span>}
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                    aria-label={t('cmpRemovePhoto', 'Retirer la photo {n}', { n: i + 1 })}
                    className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/65 text-white opacity-90 transition-opacity hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photos.length < MAX_PRODUCT_PHOTOS && (
            <ImageDrop onFiles={addPhotos} label={t('cmpAddPhotos', 'Ajouter des photos')} hint={t('cmpPhotoFormats', 'JPG, PNG ou WebP · glisse-les ici ou clique')} />
          )}
          <button type="button" onClick={fillWithAi} disabled={!photos.length || analysing} className="btn-dz-secondary w-full disabled:opacity-50">
            {analysing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {analysing ? t('cmpAnalysing', 'Analyse de la photo…') : t('cmpFillWithAi', 'Remplir le brief avec l’IA')}
          </button>
          <p className="text-xs text-fg-faint">{t('cmpFillWithAiCost', 'Utilise 1 requête de ta clé Gemini.')}</p>
        </section>

        <section aria-labelledby="new-brief" className="ui-card space-y-5 p-5">
          <h2 id="new-brief" className="text-[15px] font-semibold text-fg">{t('cmpBriefTitle', 'Le brief')}</h2>
          <Field label={t('cmpProductName', 'Nom du produit')}>
            {(id) => <input id={id} className="input-dz" value={draft.productName} onChange={(e) => set('productName', e.target.value)} maxLength={160} placeholder={t('cmpProductNamePh', 'Ex. Lampe LED rechargeable')} required />}
          </Field>
          <Field label={t('cmpDescription', 'Ce qui le rend unique')} hint={t('cmpDescriptionHint', 'Avantages, matière, taille, garantie… une idée par ligne.')}>
            {(id) => <textarea id={id} className="input-dz min-h-28 resize-y" value={draft.description} onChange={(e) => set('description', e.target.value)} maxLength={4000} />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('cmpPrice', 'Prix de vente')}>
              {(id) => <input id={id} className="input-dz" value={draft.price} onChange={(e) => set('price', e.target.value)} maxLength={60} placeholder="2 900 DA" dir="ltr" />}
            </Field>
            <Field label={t('cmpCampaignName', 'Nom de la campagne')} hint={t('cmpCampaignNameHint', 'Facultatif : le nom du produit par défaut.')}>
              {(id) => <input id={id} className="input-dz" value={draft.name} onChange={(e) => set('name', e.target.value)} maxLength={120} />}
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpObjective', 'Objectif')}</p>
            <Segmented label={t('cmpObjective', 'Objectif')} value={draft.objective} onChange={(v) => set('objective', v)} options={objectiveOptions(t)} />
          </div>

          <div className="border-t border-line pt-4">
            <button type="button" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced} className="flex w-full items-center justify-between text-[13px] font-medium text-fg-muted hover:text-fg">
              {t('cmpMoreOptions', 'Public, ton, plateformes et langue')}
              <ChevronDown size={16} className={cn('transition-transform', advanced && 'rotate-180')} />
            </button>
            {advanced && (
              <div className="mt-4 space-y-5">
                <Field label={t('cmpAudience', 'Public cible')}>
                  {(id) => <input id={id} className="input-dz" value={draft.audience} onChange={(e) => set('audience', e.target.value)} maxLength={1000} placeholder={t('cmpAudiencePh', 'Ex. mamans actives, 25-45 ans, grandes villes')} />}
                </Field>
                <Field label={t('cmpTone', 'Ton')}>
                  {(id) => <input id={id} className="input-dz" value={draft.tone} onChange={(e) => set('tone', e.target.value)} maxLength={200} placeholder={t('cmpTonePh', 'Ex. chaleureux, premium, énergique')} />}
                </Field>
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpPlatforms', 'Plateformes')}</p>
                  <ChipToggles label={t('cmpPlatforms', 'Plateformes')} values={draft.platforms} onChange={(v) => set('platforms', v)} options={platformOptions(t)} />
                </div>
                <div>
                  <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpCopyLanguage', 'Langue des textes générés')}</p>
                  <Segmented label={t('cmpCopyLanguage', 'Langue des textes générés')} value={draft.language} onChange={(v) => set('language', v)} options={languageOptions(t)} />
                </div>
              </div>
            )}
          </div>

          {error && <p role="alert" className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger-ink">{error}</p>}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
            {saving && saving.total > 0 && (
              <span className="text-[13px] text-fg-muted" role="status">{t('cmpUploading', 'Envoi des photos {done}/{total}…', saving)}</span>
            )}
            <button type="button" onClick={create} disabled={Boolean(saving)} className="btn-dz-primary disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {t('cmpCreate', 'Créer la campagne')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
