import { useLanguage } from '../../context/LanguageContext';
import type { PosterColors } from '../../lib/landingSettings';
import { POSTER_PALETTE, landingColors } from '../../lib/landingTheme';
import { cn } from '../../lib/utils';
import '../../i18n/funnels';

/** The long-image page's colours: the deep blue and yellow of shop posters, or the product's palette; each shown as its two colours. */
export default function PosterColorsPicker({ value, onChange, palette }: { value: PosterColors; onChange: (next: PosterColors) => void; palette?: string[] }) {
  const { t } = useLanguage();
  const options: { id: PosterColors; label: string; palette: readonly string[] | undefined }[] = [
    { id: 'blue', label: t('lppPosterBlue', 'Bleu et jaune'), palette: POSTER_PALETTE },
    { id: 'product', label: t('lppPosterProduct', 'Couleurs du produit'), palette },
  ];

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-fg">{t('lppPosterColors', "Couleurs de l'affiche")}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          const colors = landingColors(option.palette, 'poster');
          return (
            <label
              key={option.id}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-[border-color,background-color] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50',
                selected ? 'border-primary bg-primary/[0.05] text-fg' : 'border-line text-fg-muted hover:border-fg/30',
              )}
            >
              <input type="radio" name="lp-poster-colors" value={option.id} checked={selected} onChange={() => onChange(option.id)} className="sr-only" />
              <span aria-hidden="true" className="flex">
                <span className="size-5 rounded-full border border-black/10" style={{ background: colors.canvas }} />
                <span className="-ms-1.5 size-5 rounded-full border border-black/10" style={{ background: colors.highlight }} />
              </span>
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
