import { useEffect, useRef, useState } from 'react';
import { Check, Clapperboard, Loader2, Lock, Megaphone, Sparkles, Wand2, X, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasActivePlan } from '../../lib/access';
import { MAX_PRODUCT_PHOTOS, type ProjectLanguage, type ProjectObjective, type ProjectPlatform } from '../../lib/projectRules';
import { cn } from '../../lib/utils';
import { assetsApi, assetUrl, type AssetMeta, type ProjectInput } from '../../services/campaigns';
import { ChipToggles, Field, ImageDrop, Segmented, StatusChip, type StatusState } from '../ui/primitives';
import { languageOptions, objectiveOptions, outputLabel, platformOptions } from './labels';
import type { ProjectHandle } from './useProject';
import { DEFAULT_VIDEO_OPTIONS, type GenKind, type Generators, type VideoOutput } from './useGenerators';
import '../../i18n/campaigns';

type TextKey = 'productName' | 'description' | 'price' | 'audience' | 'tone';

function GenerateCard({ project, gen, onOpen }: { project: ProjectHandle; gen: Generators; onOpen: (tab: GenKind) => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const outputs = project.detail!.outputs;
  const locked = !hasActivePlan(user);
  const rows: { kind: GenKind; icon: LucideIcon; run: () => Promise<boolean> }[] = [
    { kind: 'landing', icon: Wand2, run: gen.generateLanding },
    // a new script keeps the style, format and length chosen for the current one
    { kind: 'video', icon: Clapperboard, run: () => gen.generateVideo((outputs.video?.data as VideoOutput | undefined)?.options ?? DEFAULT_VIDEO_OPTIONS) },
    { kind: 'ads', icon: Megaphone, run: gen.generateAds },
  ];
  const state = (k: GenKind): StatusState => (gen.status[k] === 'running' ? 'running' : gen.status[k] === 'failed' ? 'failed' : outputs[k] ? 'ready' : 'none');
  const stateLabel = (k: GenKind) =>
    ({ running: t('cmpGenerating', 'En cours…'), failed: t('cmpFailed', 'Échec'), ready: `v${outputs[k]?.version ?? 1}`, none: t('cmpNotYet', 'Pas encore') })[state(k)];
  const anyRunning = rows.some((r) => gen.status[r.kind] === 'running');
  const missing = rows.filter((r) => !outputs[r.kind]);
  const runAll = () => Promise.all((missing.length ? missing : rows).map((r) => r.run()));

  return (
    <section aria-labelledby="gen-title" className="ui-card overflow-hidden">
      <div className="border-b border-line bg-surface-2/60 p-5">
        <h2 id="gen-title" className="text-[15px] font-semibold text-fg">{t('cmpGenerateTitle', 'Générer la campagne')}</h2>
        <p className="mt-1 text-[13px] text-fg-muted">{t('cmpGenerateIntro', 'Les trois contenus partent du même brief et de la même identité de marque. Chacun peut être relancé seul.')}</p>
      </div>
      <ul className="divide-y divide-line">
        {rows.map(({ kind, icon: Icon, run }) => (
          <li key={kind} className="flex items-center gap-3 px-5 py-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-primary/10 text-primary-ink"><Icon size={17} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-fg">{outputLabel(kind, t)}</span>
              {gen.errors[kind] && <span className="mt-0.5 block text-xs text-danger-ink">{gen.errors[kind]}</span>}
            </span>
            <StatusChip state={state(kind)} label={stateLabel(kind)} />
            {outputs[kind] ? (
              <button type="button" onClick={() => onOpen(kind)} className="text-[13px] font-medium text-primary-ink hover:underline">{t('cmpOpen', 'Ouvrir')}</button>
            ) : (
              <button type="button" disabled={locked || gen.status[kind] === 'running'} onClick={() => void run()} className="text-[13px] font-medium text-primary-ink hover:underline disabled:opacity-40">
                {t('cmpGenerate', 'Générer')}
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3 border-t border-line p-5">
        {locked ? (
          <>
            <p className="flex flex-1 items-center gap-2 text-[13px] text-fg-muted"><Lock size={14} /> {t('cmpNeedsPlan', 'La génération IA demande un abonnement actif.')}</p>
            <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('dz_open_checkout'))} className="btn-dz-primary">{t('sidebarSubUpgrade', 'Voir les plans')}</button>
          </>
        ) : (
          <>
            <p className="flex-1 text-xs text-fg-faint">{t('cmpGenerateCost', 'Utilise environ une requête de ta clé Gemini par contenu.')}</p>
            <button type="button" onClick={() => void runAll()} disabled={anyRunning || !project.detail!.project.productName} className="btn-dz-primary disabled:opacity-60">
              {anyRunning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {missing.length && missing.length < rows.length ? t('cmpGenerateMissing', 'Générer ce qui manque') : missing.length ? t('cmpGenerateAll', 'Tout générer') : t('cmpRegenerateAll', 'Tout régénérer')}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/** Reuses product photos already stored for other campaigns (each campaign gets its own copy). */
function LibraryPicker({ project }: { project: ProjectHandle }) {
  const { t } = useLanguage();
  const toast = useToast();
  const projectId = project.detail!.project.id;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AssetMeta[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);

  const fetchItems = () => {
    setFailed(false);
    assetsApi.list({ kind: 'product' }).then((page) => setItems(page.items.filter((a) => a.projectId !== projectId))).catch(() => setFailed(true));
  };
  const show = () => {
    setOpen((o) => !o);
    if (items === null) fetchItems();
  };
  const take = async (id: string) => {
    setCopying(id);
    try {
      project.addAsset(await assetsApi.copyToProject(id, projectId));
      setItems((list) => (list ?? []).filter((a) => a.id !== id));
    } catch (err) {
      toast.error((err as Error).message || t('cmpUploadFailed', 'Une photo n’a pas pu être envoyée.'));
    } finally {
      setCopying(null);
    }
  };

  return (
    <div>
      <button type="button" onClick={show} aria-expanded={open} className="text-[13px] font-medium text-primary-ink hover:underline">
        {t('cmpFromLibrary', 'Réutiliser une photo de mes fichiers')}
      </button>
      {open && (
        <div className="mt-3">
          {failed ? (
            <p role="alert" className="flex flex-wrap items-center gap-2 text-xs text-danger-ink">
              {t('libLoadFailed', 'Impossible de charger tes fichiers.')}
              <button type="button" onClick={fetchItems} className="font-medium text-primary-ink hover:underline">{t('cmpRetry', 'Réessayer')}</button>
            </p>
          ) : items === null ? (
            <Loader2 size={16} className="animate-spin text-fg-faint" aria-label={t('coChargement', 'Chargement')} />
          ) : items.length === 0 ? (
            <p className="text-xs text-fg-faint">{t('cmpLibraryEmpty', 'Aucune autre photo produit dans tes fichiers.')}</p>
          ) : (
            <ul className="flex gap-2 overflow-x-auto pb-1">
              {items.map((a) => (
                <li key={a.id} className="shrink-0">
                  <button type="button" onClick={() => take(a.id)} disabled={copying !== null} aria-label={t('cmpUsePhoto', 'Utiliser {name}', { name: a.name })} className="relative block size-20 overflow-hidden rounded-[var(--radius-sm)] border border-line hover:border-primary disabled:opacity-50">
                    <img src={assetUrl(a.id)} alt="" loading="lazy" className="size-full object-cover" />
                    {copying === a.id && <span className="absolute inset-0 grid place-items-center bg-black/50"><Loader2 size={16} className="animate-spin text-white" /></span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function BriefPanel({ project, gen, onOpen }: { project: ProjectHandle; gen: Generators; onOpen: (tab: GenKind) => void }) {
  const { t } = useLanguage();
  const toast = useToast();
  const p = project.detail!.project;
  const photos = project.detail!.assets.filter((a) => a.kind === 'product');
  const [draft, setDraft] = useState(() => ({ productName: p.productName, description: p.description, price: p.price, audience: p.audience, tone: p.tone }));
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [uploading, setUploading] = useState(0);
  const savedTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const save = async (input: ProjectInput) => {
    setSaving('saving');
    try {
      await project.updateBrief(input);
      setSaving('saved');
      window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setSaving('idle'), 2000);
    } catch (err) {
      setSaving('idle');
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
    }
  };
  const blurSave = (key: TextKey) => {
    const value = draft[key].trim();
    if (value === p[key]) return;
    void save({ [key]: value });
  };
  const text = (key: TextKey) => ({
    value: draft[key],
    onChange: (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [key]: e.target.value })),
    onBlur: () => blurSave(key),
  });

  const upload = async (files: File[]) => {
    const room = MAX_PRODUCT_PHOTOS - photos.length;
    const list = files.slice(0, Math.max(0, room));
    setUploading(list.length);
    for (const file of list) {
      try {
        await project.addPhoto(file);
      } catch (err) {
        toast.error((err as Error).message || t('cmpUploadFailed', 'Une photo n’a pas pu être envoyée.'));
      }
      setUploading((n) => n - 1);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="space-y-6">
        <section aria-labelledby="brief-photos" className="ui-card space-y-4 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="brief-photos" className="text-[15px] font-semibold text-fg">{t('cmpPhotosTitle', 'Photos du produit')}</h2>
            <span className="text-xs tabular-nums text-fg-faint">{photos.length}/{MAX_PRODUCT_PHOTOS}</span>
          </div>
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {photos.map((a, i) => (
              <li key={a.id} className="group relative aspect-square overflow-hidden rounded-[var(--radius-sm)] border border-line bg-surface-2">
                <img src={assetUrl(a.id)} alt={a.name} loading="lazy" className="size-full object-cover" />
                {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-[var(--radius-xs)] bg-black/65 px-1.5 py-0.5 text-[11px] font-medium text-white">{t('cmpCover', 'Couverture')}</span>}
                <button
                  type="button"
                  onClick={() => project.removeAsset(a.id).catch((err) => toast.error((err as Error).message || t('cmpDeleteFailed', 'Suppression impossible. Réessaie.')))}
                  aria-label={t('cmpRemovePhoto', 'Retirer la photo {n}', { n: i + 1 })}
                  className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/65 text-white opacity-90 transition-opacity hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
            {Array.from({ length: uploading }, (_, i) => (
              <li key={`up-${i}`} className="grid aspect-square place-items-center rounded-[var(--radius-sm)] border border-line bg-surface-2">
                <Loader2 size={18} className="animate-spin text-primary-ink" aria-label={t('cmpUploadingOne', 'Envoi de la photo…')} />
              </li>
            ))}
            {photos.length + uploading < MAX_PRODUCT_PHOTOS && (
              <li>
                <ImageDrop compact onFiles={upload} label={t('cmpAdd', 'Ajouter')} />
              </li>
            )}
          </ul>
          {photos.length < MAX_PRODUCT_PHOTOS && <LibraryPicker project={project} />}
        </section>

        <section aria-labelledby="brief-form" className="ui-card space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="brief-form" className="text-[15px] font-semibold text-fg">{t('cmpBriefTitle', 'Le brief')}</h2>
            <span className={cn('inline-flex items-center gap-1 text-xs', saving === 'saved' ? 'text-success-ink' : 'text-fg-faint')} role="status">
              {saving === 'saving' && <><Loader2 size={12} className="animate-spin" /> {t('cmpSaving', 'Enregistrement…')}</>}
              {saving === 'saved' && <><Check size={12} /> {t('cmpSaved', 'Enregistré')}</>}
              {saving === 'idle' && t('cmpAutosave', 'Enregistré automatiquement')}
            </span>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('cmpProductName', 'Nom du produit')}>{(id) => <input id={id} className="input-dz" maxLength={160} {...text('productName')} />}</Field>
            <Field label={t('cmpPrice', 'Prix de vente')}>{(id) => <input id={id} className="input-dz" maxLength={60} dir="ltr" placeholder="2 900 DA" {...text('price')} />}</Field>
          </div>
          <Field label={t('cmpDescription', 'Ce qui le rend unique')} hint={t('cmpDescriptionHint', 'Avantages, matière, taille, garantie… une idée par ligne.')}>
            {(id) => <textarea id={id} className="input-dz min-h-32 resize-y" maxLength={4000} {...text('description')} />}
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('cmpAudience', 'Public cible')}>{(id) => <input id={id} className="input-dz" maxLength={1000} {...text('audience')} />}</Field>
            <Field label={t('cmpTone', 'Ton')}>{(id) => <input id={id} className="input-dz" maxLength={200} {...text('tone')} />}</Field>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpObjective', 'Objectif')}</p>
            <Segmented label={t('cmpObjective', 'Objectif')} value={p.objective} onChange={(v: ProjectObjective) => void save({ objective: v })} options={objectiveOptions(t)} />
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpPlatforms', 'Plateformes')}</p>
            <ChipToggles label={t('cmpPlatforms', 'Plateformes')} values={p.platforms} onChange={(v: ProjectPlatform[]) => void save({ platforms: v })} options={platformOptions(t)} />
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-fg">{t('cmpCopyLanguage', 'Langue des textes générés')}</p>
            <Segmented label={t('cmpCopyLanguage', 'Langue des textes générés')} value={p.language} onChange={(v: ProjectLanguage) => void save({ language: v })} options={languageOptions(t)} />
          </div>
        </section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-0">
        <GenerateCard project={project} gen={gen} onOpen={onOpen} />
      </div>
    </div>
  );
}
