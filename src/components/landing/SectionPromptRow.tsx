import { Copy, Download, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../i18n/funnels';

interface Props {
  /** position of the section, from 0 */
  index: number;
  onCopy: () => void;
  /** the AI picture made for this section, if any */
  picture: string | null;
  /** this section's picture is being made */
  busy: boolean;
  /** another section's picture is being made (one at a time) */
  locked: boolean;
  hasPhoto: boolean;
  /** what one picture costs on the chosen service, or null when it bills at its own rate (or is not known yet) */
  cost: string | null;
  onGenerate: () => void;
  onRemove: () => void;
}

/** "data:image/jpeg;base64,…" → "jpg": small pictures keep the format the AI sent. */
const fileExtension = (dataUrl: string) => (/^data:image\/(\w+)/.exec(dataUrl)?.[1] ?? 'jpg').replace('jpeg', 'jpg');

/** The two ways to get a section's picture: make it here with AI from the section's prompt, or copy the prompt for another tool. */
export default function SectionPromptRow({ index, onCopy, picture, busy, locked, hasPhoto, cost, onGenerate, onRemove }: Props) {
  const { t } = useLanguage();
  const n = index + 1;

  return (
    <div className="rounded-lg border border-fg/5 bg-fg/[0.04] p-2.5 sm:rounded-xl sm:p-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <p className="text-xs font-semibold text-fg-muted">{t('lpgPromptIaSection', 'Prompt IA de la Section')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={busy || locked || !hasPhoto}
            aria-label={picture ? t('lppRedoLabel', "Refaire l'image de la section {n}", { n }) : t('lppGenerateLabel', "Générer l'image de la section {n}", { n })}
            className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : picture ? <RefreshCw size={13} /> : <Sparkles size={13} />}
            {busy ? t('lpgImageRunning', 'Création de l’image…') : picture ? t('lpgRedoImage', "Refaire l'image") : t('lpgGenerateImage', "Générer l'image")}
            {cost && !busy && <span className="font-normal opacity-80">· <bdi dir="ltr">{cost}</bdi></span>}
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-fg transition-all hover:bg-surface-2 active:scale-95"
          >
            <Copy size={12} /> {t('lpgCopierPrompt', 'Copier le Prompt')}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-fg-faint">
        {hasPhoto
          ? t('lpgImageChoice', 'Génère une photo pro de ton produit ici avec ce prompt, ou copie-le pour la créer dans un autre outil.')
          : t('lpgImageNeedPhoto', 'Ajoute une photo de ton produit dans le formulaire pour générer l’image ici : l’IA garde ton vrai produit.')}
      </p>

      {picture && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <img src={picture} alt={t('lpgImageAlt', 'Image IA de la section {n}', { n })} className="max-h-72 w-auto max-w-full rounded-lg border border-line object-contain" />
          <div className="flex flex-wrap gap-2">
            <a href={picture} download={`section-${n}.${fileExtension(picture)}`} className="btn-dz-secondary !min-h-9 !px-3 !py-1.5 !text-xs !text-fg !no-underline">
              <Download size={13} /> {t('lpgDownloadImage', "Télécharger l'image")}
            </a>
            <button type="button" onClick={onRemove} disabled={busy} className="btn-dz-secondary !min-h-9 !px-3 !py-1.5 !text-xs hover:!text-danger-ink disabled:opacity-50">
              <X size={13} /> {t('lpgRemoveImage', "Retirer l'image")}
            </button>
          </div>
          <p className="text-xs text-success-ink sm:ms-auto sm:max-w-[14rem]">{t('lpgImageInPage', 'Déjà placée dans ta page (onglet « Page prête »).')}</p>
        </div>
      )}
    </div>
  );
}
