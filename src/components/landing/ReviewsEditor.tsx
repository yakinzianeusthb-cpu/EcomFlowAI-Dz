import { useRef, useState } from 'react';
import { ImagePlus, MessageSquareQuote, Plus, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { fileToUploadDataUrl } from '../../lib/imageCompress';
import type { SellerReview } from '../../lib/landingHtml';
import { cn } from '../../lib/utils';
import { FIELD } from './styles';
import '../../i18n/funnels';

const MAX_REVIEWS = 6;
const MAX_SHOTS = 6;
// what the page accepts as an image (see safeImageSrc)
const PAGE_IMAGE = /^data:image\/(?:png|jpe?g|webp|gif);base64,/;

interface Props {
  reviews: SellerReview[];
  onReviews: (next: SellerReview[]) => void;
  shots: string[];
  onShots: (next: string[]) => void;
}

/**
 * The reviews of the seller's real customers, typed in or as screenshots. The reviews the AI wrote for the copy are
 * invented and never published; these replace them.
 */
export default function ReviewsEditor({ reviews, onReviews, shots, onShots }: Props) {
  const { t } = useLanguage();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const edit = (i: number, patch: Partial<SellerReview>) => onReviews(reviews.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const addShots = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setAdding(true);
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, MAX_SHOTS - shots.length)) {
      try {
        // screenshots stay readable at 900 px and light enough for a phone
        const url = await fileToUploadDataUrl(file, { maxDimension: 900, quality: 0.8 });
        if (PAGE_IMAGE.test(url)) added.push(url);
        else setError(t('lppShotsError', "Cette image n'a pas pu être ajoutée (formats acceptés : JPG, PNG, WebP)."));
      } catch {
        setError(t('lppShotsError', "Cette image n'a pas pu être ajoutée (formats acceptés : JPG, PNG, WebP)."));
      }
    }
    onShots([...shots, ...added]);
    setAdding(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <fieldset className="rounded-2xl border border-line bg-surface-2 p-4">
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-fg">
        <MessageSquareQuote size={16} className="text-primary-ink" aria-hidden="true" /> {t('lppReviews', 'Avis de vrais clients (optionnel)')}
      </legend>
      <p className="text-xs text-fg-muted">{t('lppReviewsIntro', "Les avis écrits par l'IA sont inventés : ils ne sont jamais publiés. Ajoute ceux de tes vrais clients, en texte ou en captures d'écran (WhatsApp, Messenger…).")}</p>

      {reviews.length > 0 && (
        <ol className="mt-3 space-y-3">
          {reviews.map((review, i) => (
            <li key={i} className="grid gap-2 rounded-xl border border-line bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-start">
              <label className="block text-xs font-semibold text-fg-muted">
                {t('lppReviewName', 'Nom du client (et ville)')}
                <input className={cn(FIELD, 'mt-1')} value={review.name ?? ''} maxLength={60} onChange={(e) => edit(i, { name: e.target.value })} dir="auto" />
              </label>
              <label className="block text-xs font-semibold text-fg-muted">
                {t('lppReviewText', 'Ce qu’il a dit')}
                <textarea className={cn(FIELD, 'mt-1 min-h-[42px] resize-y')} rows={2} value={review.text ?? ''} maxLength={400} onChange={(e) => edit(i, { text: e.target.value })} dir="auto" />
              </label>
              <button type="button" onClick={() => onReviews(reviews.filter((_, j) => j !== i))} aria-label={t('lppReviewRemove', 'Retirer cet avis')} className="grid size-11 place-items-center self-end rounded-xl text-fg-muted hover:bg-danger/10 hover:text-danger-ink sm:mt-5">
                <X size={16} />
              </button>
            </li>
          ))}
        </ol>
      )}

      {shots.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {shots.map((src, i) => (
            <li key={i} className="relative">
              <img src={src} alt={t('lppShotAlt', 'Capture d’avis {n}', { n: i + 1 })} className="h-24 w-auto rounded-lg border border-line object-cover" />
              <button type="button" onClick={() => onShots(shots.filter((_, j) => j !== i))} aria-label={t('lppShotRemove', 'Retirer cette capture')} className="absolute -end-2 -top-2 grid size-7 place-items-center rounded-full bg-fg text-bg shadow">
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {reviews.length < MAX_REVIEWS && (
          <button type="button" onClick={() => onReviews([...reviews, { name: '', text: '' }])} className="btn-dz-secondary !py-1.5 !text-xs">
            <Plus size={14} /> {t('lppReviewAdd', 'Ajouter un avis')}
          </button>
        )}
        {shots.length < MAX_SHOTS && (
          <>
            <button type="button" onClick={() => fileInput.current?.click()} disabled={adding} className="btn-dz-secondary !py-1.5 !text-xs disabled:opacity-60">
              <ImagePlus size={14} /> {t('lppShotsAdd', 'Ajouter des captures d’écran')}
            </button>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => void addShots(e.target.files)} />
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-warning-ink" role="alert">{error}</p>}
    </fieldset>
  );
}
