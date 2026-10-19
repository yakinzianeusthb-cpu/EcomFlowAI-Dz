import { useEffect, useState } from 'react';
import { Check, Loader2, Palette, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { BRAND_STYLES } from '../../lib/brandRules';
import { readableTextOn } from '../../lib/adCreative';
import { assetsApi, assetUrl, type BrandKit } from '../../services/campaigns';
import PageHeader from '../PageHeader';
import { ChipToggles, EmptyState, Field, ImageDrop, Skeleton } from '../ui/primitives';
import { useBrandKit } from '../projects/useProject';
import '../../i18n/campaigns';

const HEX6 = /^#[0-9a-f]{6}$/i;

/** One brand profile reused by every landing page, script and ad. */
export default function BrandKitPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const { kit, failed, retry, save } = useBrandKit();
  const [draft, setDraft] = useState<BrandKit | null>(null);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (kit && !draft) setDraft(kit);
  }, [kit, draft]);

  if (!draft && failed) {
    return (
      <EmptyState
        icon={RefreshCw}
        title={t('brkLoadFailed', 'Impossible de charger ton identité de marque.')}
        action={<button type="button" onClick={retry} className="btn-dz-secondary">{t('cmpRetry', 'Réessayer')}</button>}
      />
    );
  }
  if (!draft) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const set = <K extends keyof BrandKit>(key: K, value: BrandKit[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));
  const styleLabels: Record<string, string> = {
    minimal: t('brkStyleMinimal', 'Minimaliste'),
    luxury: t('brkStyleLuxury', 'Luxe'),
    bold: t('brkStyleBold', 'Audacieux'),
    playful: t('brkStylePlayful', 'Ludique'),
    natural: t('brkStyleNatural', 'Naturel'),
    tech: t('brkStyleTech', 'Tech'),
    classic: t('brkStyleClassic', 'Classique'),
  };

  const uploadLogo = async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    try {
      const asset = await assetsApi.uploadFile(files[0], { kind: 'logo' });
      set('logoAssetId', asset.id);
    } catch (err) {
      toast.error((err as Error).message || t('cmpUploadFailed', 'Une photo n’a pas pu être envoyée.'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setSaving('saving');
    try {
      const { brandName, logoAssetId, colors, headingFont, bodyFont, tone, audience, instructions, styles } = draft;
      setDraft(await save({ brandName, logoAssetId, colors: colors.filter((c) => HEX6.test(c)), headingFont, bodyFont, tone, audience, instructions, styles }));
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 2500);
    } catch (err) {
      setSaving('idle');
      toast.error((err as Error).message || t('cmpSaveFailed', 'Modification non enregistrée. Réessaie.'));
    }
  };

  const main = draft.colors.find((c) => HEX6.test(c)) ?? '#5b3df5';

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Palette}
        title={t('menuBrand', 'Identité de marque')}
        subtitle={t('brkSubtitle', 'Ton logo, tes couleurs et ta façon de parler. Chaque landing page, script et publicité les reprend.')}
        actions={
          <button type="button" onClick={submit} disabled={saving === 'saving'} className="btn-dz-primary disabled:opacity-60">
            {saving === 'saving' ? <Loader2 size={16} className="animate-spin" /> : saving === 'saved' ? <Check size={16} /> : <Save size={16} />}
            {saving === 'saved' ? t('cmpSaved', 'Enregistré') : t('cmpSave', 'Enregistrer')}
          </button>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-6">
          <section aria-labelledby="brk-identity" className="ui-card space-y-5 p-5">
            <h2 id="brk-identity" className="text-[15px] font-semibold text-fg">{t('brkIdentity', 'Identité')}</h2>
            <Field label={t('brkName', 'Nom de la marque')}>{(id) => <input id={id} className="input-dz" maxLength={80} value={draft.brandName} onChange={(e) => set('brandName', e.target.value)} />}</Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-fg">{t('brkLogo', 'Logo')}</p>
              <div className="flex items-center gap-4">
                <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-line bg-white">
                  {uploading ? <Loader2 size={18} className="animate-spin text-fg-faint" /> : draft.logoAssetId ? <img src={assetUrl(draft.logoAssetId)} alt={t('brkLogo', 'Logo')} className="size-full object-contain p-2" /> : <Palette size={22} className="text-neutral-400" aria-hidden="true" />}
                </span>
                <div className="flex flex-col gap-2">
                  <ImageDrop multiple={false} onFiles={uploadLogo} label={draft.logoAssetId ? t('brkReplaceLogo', 'Remplacer le logo') : t('brkAddLogo', 'Ajouter un logo')} hint={t('brkLogoHint', 'PNG transparent de préférence')} className="!py-3" />
                  {draft.logoAssetId && (
                    <button type="button" onClick={() => set('logoAssetId', null)} className="inline-flex items-center gap-1 self-start text-xs font-medium text-fg-muted hover:text-danger-ink"><X size={13} /> {t('brkRemoveLogo', 'Ne plus utiliser ce logo')}</button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-fg">{t('brkColors', 'Couleurs')}</p>
              <ul className="flex flex-wrap gap-3">
                {draft.colors.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-line bg-surface-2 p-1.5 pe-2">
                    <input type="color" aria-label={t('brkColorN', 'Couleur {n}', { n: i + 1 })} value={HEX6.test(c) ? c : '#000000'} onChange={(e) => set('colors', draft.colors.map((x, j) => (j === i ? e.target.value : x)))} className="size-8 cursor-pointer rounded-[var(--radius-xs)] border-0 bg-transparent p-0" />
                    <code className="text-xs text-fg-muted" dir="ltr">{c}</code>
                    <button type="button" onClick={() => set('colors', draft.colors.filter((_, j) => j !== i))} aria-label={t('brkRemoveColor', 'Retirer la couleur {n}', { n: i + 1 })} className="grid size-6 place-items-center rounded text-fg-faint hover:text-danger-ink"><Trash2 size={13} /></button>
                  </li>
                ))}
                {draft.colors.length < 6 && (
                  <li>
                    <button type="button" onClick={() => set('colors', [...draft.colors, '#5b3df5'])} className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-line-strong px-3 text-[13px] text-fg-muted hover:border-primary hover:text-fg">
                      <Plus size={14} /> {t('brkAddColor', 'Ajouter')}
                    </button>
                  </li>
                )}
              </ul>
              <p className="mt-1.5 text-xs text-fg-faint">{t('brkColorsHint', 'La première couleur sert de couleur principale sur les publicités.')}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t('brkHeadingFont', 'Police des titres')} hint={t('brkFontHint', 'Le nom d’une police Google Fonts, pour tes futures pages.')}>{(id) => <input id={id} className="input-dz" maxLength={60} value={draft.headingFont} onChange={(e) => set('headingFont', e.target.value)} placeholder="Playfair Display" dir="ltr" />}</Field>
              <Field label={t('brkBodyFont', 'Police du texte')}>{(id) => <input id={id} className="input-dz" maxLength={60} value={draft.bodyFont} onChange={(e) => set('bodyFont', e.target.value)} placeholder="Inter" dir="ltr" />}</Field>
            </div>
          </section>

          <section aria-labelledby="brk-voice" className="ui-card space-y-5 p-5">
            <h2 id="brk-voice" className="text-[15px] font-semibold text-fg">{t('brkVoice', 'Ton et public')}</h2>
            <Field label={t('brkTone', 'Ton de la marque')}>{(id) => <input id={id} className="input-dz" maxLength={200} value={draft.tone} onChange={(e) => set('tone', e.target.value)} placeholder={t('cmpTonePh', 'Ex. chaleureux, premium, énergique')} />}</Field>
            <Field label={t('brkAudience', 'Public habituel')}>{(id) => <input id={id} className="input-dz" maxLength={1000} value={draft.audience} onChange={(e) => set('audience', e.target.value)} placeholder={t('cmpAudiencePh', 'Ex. mamans actives, 25-45 ans, grandes villes')} />}</Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-fg">{t('brkStyles', 'Style visuel')}</p>
              <ChipToggles label={t('brkStyles', 'Style visuel')} values={draft.styles} onChange={(v) => set('styles', v.slice(0, 5))} options={BRAND_STYLES.map((s) => ({ value: s, label: styleLabels[s] }))} />
            </div>
            <Field label={t('brkInstructions', 'Règles pour l’IA')} hint={t('brkInstructionsHint', 'Ce que l’IA doit toujours faire ou éviter : mots interdits, promesses à ne pas faire, détails à montrer.')}>
              {(id) => <textarea id={id} className="input-dz min-h-28 resize-y" maxLength={2000} value={draft.instructions} onChange={(e) => set('instructions', e.target.value)} />}
            </Field>
          </section>
        </div>

        <aside aria-labelledby="brk-preview" className="ui-card overflow-hidden xl:sticky xl:top-0">
          <h2 id="brk-preview" className="sr-only">{t('brkPreview', 'Aperçu')}</h2>
          <div className="relative p-6" style={{ background: main, color: readableTextOn(main) }}>
            <div className="flex items-center gap-3">
              {draft.logoAssetId && <img src={assetUrl(draft.logoAssetId)} alt="" className="size-10 rounded-[var(--radius-sm)] bg-white object-contain p-1" />}
              <span className="text-lg font-semibold" dir="auto">{draft.brandName || t('brkYourBrand', 'Ta marque')}</span>
            </div>
            <p className="display-title mt-8 text-4xl" dir="auto">{t('brkSampleHeadline', 'Ce que tes clients verront en premier.')}</p>
            <span className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900">{t('brkSampleCta', 'Commander')}</span>
          </div>
          <div className="space-y-3 p-5 text-[13px]">
            <div className="flex flex-wrap gap-2">{draft.colors.map((c, i) => <span key={i} className="size-7 rounded-full border border-line" style={{ background: c }} title={c} />)}</div>
            {draft.tone && <p className="text-fg-muted"><span className="font-medium text-fg">{t('brkTone', 'Ton de la marque')} : </span>{draft.tone}</p>}
            {draft.styles.length > 0 && <p className="text-fg-muted"><span className="font-medium text-fg">{t('brkStyles', 'Style visuel')} : </span>{draft.styles.map((s) => styleLabels[s]).join(', ')}</p>}
            {!draft.colors.length && !draft.tone && !draft.styles.length && <p className="text-fg-faint">{t('brkPreviewEmpty', 'Ajoute des couleurs, un ton et un style : ils apparaîtront ici.')}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
