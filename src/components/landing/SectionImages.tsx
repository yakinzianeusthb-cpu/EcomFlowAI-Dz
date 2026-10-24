import { useState } from 'react';
import { Check, Copy, Download, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { IMAGE_PROVIDER_NAMES, type ImageProvider } from '../../lib/imageProviders';
import { cn } from '../../lib/utils';
import '../../i18n/funnels';

interface Props {
  /** posters with their words drawn in (long-image template), or pictures without text (the other templates) */
  isPoster: boolean;
  /** the sections the page shows, by index in the generated copy */
  shownIndices: number[];
  /** the images of the current kind, by section index */
  images: (string | null)[];
  running: number | null;
  error: string;
  hasPhoto: boolean;
  onGenerate: (indices: number[]) => void;
  onRemove: (index: number) => void;
  /** the words the AI receives for a section, to copy into another image tool */
  promptOf: (index: number) => string;
  /** the image service chosen in Paramètres, null while it is read */
  service: ImageProvider | null;
  /** what `count` images cost on that service, or null when it bills at its own rate */
  costOf: (count: number) => string | null;
  /** offered once every shown section has its poster */
  onLongImage: (() => void) | null;
  longImageBusy: boolean;
}

/** The AI images of the page, section by section: make one here (its cost shown), copy its prompt for another tool, redo or remove it. */
export default function SectionImages({ isPoster, shownIndices, images, running, error, hasPhoto, onGenerate, onRemove, promptOf, service, costOf, onLongImage, longImageBusy }: Props) {
  const { t } = useLanguage();
  const toast = useToast();
  const [copied, setCopied] = useState<number | null>(null);
  const missing = shownIndices.filter((i) => !images[i]);
  const ready = shownIndices.length - missing.length;
  const busy = running !== null;
  const each = costOf(1);
  // the amount reads left to right inside Arabic text
  const price = (amount: string) => <bdi dir="ltr">{amount}</bdi>;

  const copyPrompt = async (index: number) => {
    try {
      await navigator.clipboard.writeText(promptOf(index));
      setCopied(index);
      setTimeout(() => setCopied((c) => (c === index ? null : c)), 2000);
      toast.success(t('lppPromptCopied', 'Prompt copié. Colle-le dans ton outil d’images avec la photo de ton produit.'));
    } catch {
      toast.error(t('lppPromptCopyFailed', 'Copie impossible : ton navigateur a bloqué le presse-papiers.'));
    }
  };

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Sparkles size={16} className="text-accent-ink" />
        <p className="text-sm font-semibold text-fg">{isPoster ? t('lppPosterTitle', "Affiches IA (le texte dans l'image)") : t('lppAiTitle', 'Images IA des sections')}</p>
        {busy ? (
          <span className="ms-auto flex items-center gap-2 text-xs font-semibold text-fg-muted" role="status"><Loader2 size={14} className="animate-spin" /> {t('lppAiRunning', 'Image de la section {n} en cours…', { n: shownIndices.indexOf(running) + 1 })}</span>
        ) : missing.length > 0 && (
          <button type="button" onClick={() => onGenerate(missing)} disabled={!hasPhoto} className="btn-dz-secondary ms-auto !py-1.5 !text-xs disabled:opacity-50">
            <Sparkles size={13} /> {isPoster ? t('lppPosterGenerate', 'Créer les affiches IA ({count})', { count: missing.length }) : t('lppAiGenerate', 'Générer les images IA ({count} sections)', { count: missing.length })}
            {costOf(missing.length) && <span className="opacity-75">· ≈ {price(costOf(missing.length) as string)}</span>}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-fg-muted">
        {!hasPhoto
          ? t('lppAiNeedPhoto', "Ajoute d'abord une photo du produit dans le formulaire : l'IA en a besoin pour garder ton vrai produit.")
          : isPoster
            ? t('lppPosterIntro', "L'IA dessine chaque section comme une affiche à partir de ta photo, avec son titre, ses avantages et un bouton de commande, comme les longues images des boutiques. Il faut une clé Gemini avec facturation, ou le service choisi dans Paramètres.")
            : t('lppAiIntro', "L'IA crée une image pour chaque section à partir de ta photo produit. Il faut une clé Gemini avec facturation, ou le service choisi dans Paramètres.")}
      </p>
      <p className="mt-1 text-xs text-fg-muted">{t('lppPromptChoice', 'Pour chaque section : génère l’image ici, ou copie son prompt pour la créer dans un autre outil (ChatGPT, Midjourney…).')}</p>
      {service && (
        <p className="mt-1 text-xs font-semibold text-fg">
          {each
            ? <>{t('lppCostEach', 'Coût : environ')} {price(each)} {t('lppCostEachTail', 'par image, payé sur ta clé {service}.', { service: IMAGE_PROVIDER_NAMES[service] })}</>
            : t('lppCostService', 'Coût : selon le tarif de ton service {service}, payé sur ton compte.', { service: IMAGE_PROVIDER_NAMES[service] })}
        </p>
      )}

      {shownIndices.length > 0 && (
        <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shownIndices.map((index, k) => {
            const image = images[index];
            const label = t('lppSectionN', 'Section {n}', { n: k + 1 });
            return (
              <li key={index} className="min-w-0">
                <div className={cn('relative overflow-hidden rounded-lg border border-line bg-surface', isPoster ? 'aspect-[4/5]' : 'aspect-square')}>
                  {image ? (
                    <img src={image} alt={label} className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center p-1 text-center text-[11px] text-fg-faint">{running === index ? <Loader2 size={16} className="animate-spin" /> : label}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onGenerate([index])}
                  disabled={busy || !hasPhoto}
                  aria-label={image ? t('lppRedoLabel', "Refaire l'image de la section {n}", { n: k + 1 }) : t('lppGenerateLabel', "Générer l'image de la section {n}", { n: k + 1 })}
                  className="mt-1.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-2 text-xs font-semibold text-primary-ink hover:bg-primary/15 disabled:opacity-40"
                >
                  {image ? <RefreshCw size={13} /> : <Sparkles size={13} />}
                  {image ? t('lppRedo', 'Refaire') : t('lppGenerateOne', 'Générer')}
                  {each && <span className="font-normal opacity-80">· {price(each)}</span>}
                </button>
                <div className="mt-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => void copyPrompt(index)}
                    aria-label={t('lppCopyPromptLabel', 'Copier le prompt de la section {n}', { n: k + 1 })}
                    className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-2 text-xs text-fg-muted hover:bg-surface hover:text-fg"
                  >
                    {copied === index ? <Check size={13} className="text-success-ink" /> : <Copy size={13} />}
                    {copied === index ? t('lppPromptCopiedShort', 'Copié') : t('lppCopyPrompt', 'Copier le prompt')}
                  </button>
                  {image && (
                    <button type="button" onClick={() => onRemove(index)} disabled={busy} aria-label={t('lppRemoveLabel', "Retirer l'image de la section {n}", { n: k + 1 })} title={t('lppRemove', 'Retirer')} className="grid size-11 shrink-0 place-items-center rounded-lg text-fg-muted hover:bg-danger/10 hover:text-danger-ink disabled:opacity-40">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {ready > 0 && <p className="mt-2 text-xs text-success-ink">{t('lppAiDone', '{done}/{total} images prêtes, déjà placées dans la page.', { done: ready, total: shownIndices.length })}</p>}
      {isPoster && ready > 0 && <p className="mt-1 text-xs text-fg-muted">{t('lppPosterCheck', "Vérifie le texte de chaque affiche : si un mot est mal écrit, refais-la.")}</p>}
      {error && <p className="mt-2 text-xs text-warning-ink" role="alert">{error}</p>}
      {onLongImage && (
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <button type="button" onClick={onLongImage} disabled={longImageBusy} className="btn-dz-secondary !py-1.5 !text-xs disabled:opacity-60">
            {longImageBusy ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} {t('lppLongImage', "Télécharger l'image longue (JPG)")}
          </button>
          <span className="text-xs text-fg-muted">{t('lppLongImageHint', 'Toutes les affiches en une seule image, à mettre dans ta boutique (YouCan, Shopify…).')}</span>
        </div>
      )}
    </div>
  );
}
