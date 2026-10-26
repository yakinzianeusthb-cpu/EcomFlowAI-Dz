import { Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LANDING_TEMPLATES, THEMES, landingColors, type LandingColors, type LandingTemplate, type Theme } from '../../lib/landingTheme';
import { cn } from '../../lib/utils';
import '../../i18n/funnels';

const LABELS: Record<LandingTemplate, { name: [string, string]; hint: [string, string] }> = {
  poster: { name: ['lppTplPoster', 'Affiche (image longue)'], hint: ['lppTplPosterHint', 'Une longue image faite de photos, puis le formulaire : le format des boutiques algériennes.'] },
  impact: { name: ['lppTplImpact', 'Impact'], hint: ['lppTplImpactHint', 'Lumineux et direct : pour la plupart des produits.'] },
  elegance: { name: ['lppTplElegance', 'Élégance'], hint: ['lppTplEleganceHint', 'Ivoire et serif : beauté, parfums, bijoux, mode.'] },
  nuit: { name: ['lppTplNuit', 'Nuit'], hint: ['lppTplNuitHint', 'Sombre et lumineux : high-tech, accessoires, auto.'] },
};

/** The long-image page drawn small: a phone-width canvas in one gradient, its title, photo, badges and yellow button. */
function PosterMiniature({ theme, colors }: { theme: Theme; colors: LandingColors }) {
  return (
    <div aria-hidden="true" className="flex justify-center overflow-hidden rounded-xl border border-line py-2.5" style={{ background: theme.bg }}>
      <div className="w-[4.5rem] space-y-1.5 overflow-hidden rounded-lg px-2 py-2" style={{ background: `linear-gradient(180deg, ${colors.brandLight}, ${colors.canvas} 55%, ${colors.brandDeep})`, boxShadow: `0 0 0 2px ${colors.brandDeep}` }}>
        <div className="mx-auto h-1.5 w-4/5 rounded-full bg-white" />
        <div className="mx-auto h-2 w-3/5 rounded-full" style={{ background: colors.highlight }} />
        <div className="-mx-2 h-7" style={{ background: `linear-gradient(180deg, transparent, ${colors.brandDeep} 30%, ${colors.brandDeep} 70%, transparent)` }} />
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => <span key={i} className="size-2 rounded-full border border-white" style={{ background: colors.canvas }} />)}
        </div>
        <div className="mx-auto h-2.5 w-4/5 rounded-full" style={{ background: colors.highlight }} />
        <div className="-mx-2 h-2" style={{ background: colors.brandDeep }} />
        <div className="h-1.5 w-full rounded-sm" style={{ background: colors.pill }} />
      </div>
    </div>
  );
}

/** The template drawn small: bar, photo, title, price and button, in its surfaces and the seller's colours. */
function Miniature({ theme, colors, template }: { theme: Theme; colors: LandingColors; template: LandingTemplate }) {
  if (template === 'poster') return <PosterMiniature theme={theme} colors={colors} />;
  const radius = Math.min(theme.radius, 12) / 2;
  const bar = template === 'impact' ? colors.brand : template === 'elegance' ? theme.ink : theme.line;
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-line" style={{ background: theme.bg }}>
      <div className="h-1.5" style={{ background: bar }} />
      <div className="grid grid-cols-[1fr_1fr] items-center gap-2.5 p-3">
        <div className="aspect-square" style={{ background: theme.surface, borderRadius: radius, outline: template === 'elegance' ? `1px solid ${theme.line}` : undefined, outlineOffset: 3 }} />
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full" style={{ background: theme.ink }} />
          <div className="h-1.5 w-2/3 rounded-full" style={{ background: theme.ink }} />
          <div className="flex items-center gap-1 pt-0.5">
            <div className="h-2 w-6 rounded-full" style={{ background: template === 'nuit' ? colors.brandText : theme.ink }} />
            <div className="h-2 w-3 rounded-full" style={{ background: colors.accent }} />
          </div>
          <div className="h-3 w-full" style={{ background: colors.brand, borderRadius: theme.buttonRadius >= 999 ? 999 : theme.buttonRadius / 2, boxShadow: template === 'nuit' ? `0 0 10px ${colors.brand}` : undefined }} />
        </div>
      </div>
    </div>
  );
}

/** Chooses the look of the page; each choice is shown with the seller's palette (the long-image page with its own colours, when set). */
export default function TemplatePicker({ value, onChange, palette, posterPalette }: { value: LandingTemplate; onChange: (template: LandingTemplate) => void; palette?: string[]; posterPalette?: readonly string[] }) {
  const { t } = useLanguage();
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-fg">{t('lppTemplate', 'Style de la page')}</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {LANDING_TEMPLATES.map((id) => {
          const selected = value === id;
          const { name, hint } = LABELS[id];
          return (
            <label
              key={id}
              className={cn(
                'block cursor-pointer rounded-2xl border p-3 transition-[border-color,box-shadow] duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50',
                selected ? 'border-primary bg-primary/[0.05]' : 'border-line hover:border-fg/30',
              )}
            >
              <input type="radio" name="lp-template" value={id} checked={selected} onChange={() => onChange(id)} className="sr-only" />
              <Miniature theme={THEMES[id]} colors={landingColors(id === 'poster' && posterPalette ? posterPalette : palette, id)} template={id} />
              <span className="mt-3 flex items-center gap-2 text-sm font-semibold text-fg">
                {t(name[0], name[1])}
                {selected && <Check size={15} className="text-primary-ink" aria-hidden="true" />}
              </span>
              <span className="mt-0.5 block text-xs text-fg-muted">{t(hint[0], hint[1])}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
