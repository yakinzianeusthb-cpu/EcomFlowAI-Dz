import { useEffect, useState } from 'react';
import { Check, Download, Loader2, PencilLine, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { AD_FORMATS, ctaLabel, templateFor, type AdFormat } from '../../lib/adCreative';
import { renderCreativeBlob } from '../../lib/adCreativeRender';
import { AD_CTAS, AD_LIMITS, type AdConcept, type AdCta } from '../../lib/adPack';
import { creativeFileName } from '../../lib/adExport';
import type { ProjectLanguage } from '../../lib/projectRules';
import { cn } from '../../lib/utils';
import '../../i18n/campaigns';

export interface CreativeAssets {
  photos: HTMLImageElement[];
  logo: HTMLImageElement | null;
  brandColor?: string;
  price?: string;
  language: ProjectLanguage;
  productName: string;
}

function Counter({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit;
  return <span className={cn('text-xs tabular-nums', over ? 'text-warning-ink' : 'text-fg-faint')}>{value.length}/{limit}</span>;
}

export function creativeInput(concept: AdConcept, index: number, format: AdFormat, assets: CreativeAssets) {
  return {
    format,
    template: templateFor(index),
    concept,
    language: assets.language,
    price: assets.price,
    photo: assets.photos.length ? assets.photos[index % assets.photos.length] : null,
    logo: assets.logo,
    brandColor: assets.brandColor,
  };
}

export default function CreativeCard({ concept, index, format, assets, selected, onToggle, onSave }: {
  concept: AdConcept;
  index: number;
  format: AdFormat;
  assets: CreativeAssets;
  selected: boolean;
  onToggle: () => void;
  onSave: (next: AdConcept) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [preview, setPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(concept);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    setPreview(null);
    renderCreativeBlob(creativeInput(concept, index, format, assets))
      .then((blob) => {
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
      })
      .catch(() => alive && setPreview(''));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [concept, index, format, assets]);

  const { width, height } = AD_FORMATS[format];
  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      // the panel has already said why; the editor stays open with the text
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className={cn('ui-card flex flex-col overflow-hidden transition-shadow', selected && 'ring-2 ring-primary')}>
      <div className="relative bg-surface-2" style={{ aspectRatio: `${width} / ${height}` }}>
        {preview ? (
          <img src={preview} alt={t('cmpCreativeAlt', 'Visuel publicitaire : {headline}', { headline: concept.headline })} className="absolute inset-0 size-full object-cover" />
        ) : preview === '' ? (
          <p className="absolute inset-0 grid place-items-center p-4 text-center text-xs text-fg-muted">{t('cmpRenderFailed', 'Ce visuel n’a pas pu être dessiné.')}</p>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Loader2 size={20} className="animate-spin text-fg-faint" aria-label={t('cmpRendering', 'Création du visuel…')} />
          </div>
        )}
        <label className="absolute start-2.5 top-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-xs)] bg-black/60 px-2 py-1 text-xs font-medium text-white">
          <input type="checkbox" checked={selected} onChange={onToggle} className="size-3.5 accent-[var(--primary)]" />
          {t('cmpSelect', 'Choisir')}
        </label>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="eyebrow">{concept.angle || t('cmpConcept', 'Concept {n}', { n: index + 1 })}</p>
        {editing ? (
          <div className="mt-3 space-y-3">
            {([['overlay', t('cmpOverlay', 'Texte sur l’image')], ['headline', t('cmpAdHeadline', 'Titre de la pub')], ['description', t('cmpAdDescription', 'Description')]] as const).map(([key, label]) => (
              <label key={key} className="block text-[13px] font-medium text-fg">
                <span className="flex justify-between gap-2">{label}<Counter value={draft[key]} limit={AD_LIMITS[key].recommended} /></span>
                <input dir="auto" className="input-dz mt-1" value={draft[key]} maxLength={AD_LIMITS[key].max} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />
              </label>
            ))}
            <label className="block text-[13px] font-medium text-fg">
              <span className="flex justify-between gap-2">{t('cmpPrimaryText', 'Texte principal')}<Counter value={draft.primaryText} limit={AD_LIMITS.primaryText.recommended} /></span>
              <textarea dir="auto" className="input-dz mt-1 min-h-24 resize-y" value={draft.primaryText} maxLength={AD_LIMITS.primaryText.max} onChange={(e) => setDraft({ ...draft, primaryText: e.target.value })} />
            </label>
            <label className="block text-[13px] font-medium text-fg">
              {t('cmpCtaButton', 'Bouton')}
              <select className="input-dz mt-1" value={draft.callToAction} onChange={(e) => setDraft({ ...draft, callToAction: e.target.value as AdCta })}>
                {AD_CTAS.map((c) => <option key={c} value={c}>{ctaLabel(c, assets.language)}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setDraft(concept); setEditing(false); }} className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] text-fg-muted hover:text-fg"><X size={14} /> {t('cmpCancel', 'Annuler')}</button>
              <button type="button" onClick={save} disabled={saving} className="btn-dz-primary !min-h-8 !py-1 !text-[13px]">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {t('cmpSave', 'Enregistrer')}</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-fg" dir="auto">{concept.headline}</h3>
            <p className="mt-1.5 line-clamp-4 text-[13px] leading-relaxed text-fg-muted" dir="auto">{concept.primaryText}</p>
            {concept.audience && <p className="mt-2 text-xs text-fg-faint" dir="auto">{t('cmpForAudience', 'Pour : {audience}', { audience: concept.audience })}</p>}
            <div className="mt-auto flex items-center gap-1 pt-4">
              <span className="me-auto rounded-[var(--radius-xs)] border border-line px-2 py-0.5 text-xs text-fg-muted">{ctaLabel(concept.callToAction, assets.language)}</span>
              <button type="button" onClick={() => { setDraft(concept); setEditing(true); }} aria-label={t('cmpEditConcept', 'Modifier le concept {n}', { n: index + 1 })} className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-surface-2 hover:text-fg"><PencilLine size={16} /></button>
              {preview && (
                <a href={preview} download={creativeFileName(assets.productName, index + 1, format)} aria-label={t('cmpDownloadCreative', 'Télécharger le visuel {n}', { n: index + 1 })} className="grid size-9 place-items-center rounded-[var(--radius-sm)] text-fg-muted hover:bg-surface-2 hover:text-fg"><Download size={16} /></a>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
