import { GripVertical } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { ProductPhoto, TextLines } from './HomeArt';
import '../../i18n/home';

// Illustrations for the studio rows of the home page. They are drawings of the interface, hidden from screen readers:
// the text next to each one says what the studio does.

export function LandingVisual() {
  const { t } = useLanguage();
  const sections = [
    t('homeLandingSection1', 'Accroche'),
    t('homeLandingSection2', 'Avantages'),
    t('homeLandingSection3', 'Mode d’emploi'),
    t('homeLandingSection4', 'Questions'),
    t('homeLandingSection5', 'Bon de commande'),
  ];
  return (
    <div aria-hidden="true" data-ui className="grid items-center gap-6 sm:grid-cols-2">
      <div className="mx-auto w-full max-w-[240px] overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface shadow-[var(--shadow-md)]">
        <div className="bg-primary/8 p-4">
          <ProductPhoto className="aspect-[4/3] w-full rounded-[var(--radius-sm)]" />
          <p className="display-title mt-3 text-lg leading-tight text-fg">{t('homeDemoHeadline', 'Une lumière douce pour chaque soir')}</p>
          <TextLines />
        </div>
        <div className="space-y-2 p-4">
          <p className="text-[11px] font-semibold text-fg">{t('homeLandingSection5', 'Bon de commande')}</p>
          <div className="flex justify-between gap-2 rounded-[var(--radius-xs)] border border-line bg-bg px-2 py-1.5 text-[11px] text-fg-muted">
            <span>{t('homeLandingWilaya', 'Wilaya')}</span>
            <span>{t('homeLandingWilayaValue', '16 · Alger')}</span>
          </div>
          <span className="block rounded-[var(--radius-xs)] bg-primary py-1.5 text-center text-[11px] font-semibold text-white">{t('homeDemoOrder', 'Commander')}</span>
        </div>
      </div>
      <ol className="space-y-2">
        {sections.map((s, i) => (
          <li
            key={s}
            className={cn(
              'flex items-center gap-2.5 rounded-[var(--radius-sm)] border bg-surface px-3 py-2.5 text-[13px]',
              i === 1 ? 'translate-x-2 border-primary/50 shadow-[var(--shadow-md)] rtl:-translate-x-2' : 'border-line',
            )}
          >
            <GripVertical size={14} className="shrink-0 text-fg-faint" />
            <span className="text-xs tabular-nums text-fg-faint">{String(i + 1).padStart(2, '0')}</span>
            <span className="font-medium text-fg">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function VideoVisual() {
  const { t } = useLanguage();
  const scenes = [
    { label: t('homeDemoScene1', 'Accroche'), time: '0–3 s', art: 'scale-125' },
    { label: t('homeDemoScene2', 'Démonstration'), time: '3–9 s', art: '' },
    { label: t('homeDemoScene3', 'Offre'), time: '9–15 s', art: 'scale-90 -translate-y-[6%]' },
  ];
  return (
    <div aria-hidden="true" data-ui>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {scenes.map((s) => (
          <div key={s.time}>
            <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]">
              <ProductPhoto className="absolute inset-0" artClassName={s.art} />
              <span className="absolute inset-x-2 bottom-2 rounded-[4px] bg-black/60 px-1.5 py-1 text-center text-[11px] font-semibold text-white">{s.label}</span>
            </div>
            <p className="mt-2 text-xs tabular-nums text-fg-faint" dir="ltr">{s.time}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex h-1.5 gap-1" dir="ltr">
        <span className="w-1/5 rounded-full bg-primary" />
        <span className="w-2/5 rounded-full bg-primary/55" />
        <span className="w-2/5 rounded-full bg-primary/25" />
      </div>
    </div>
  );
}

export function LibraryVisual() {
  return (
    <div aria-hidden="true" data-ui className="grid grid-cols-3 gap-2">
      {([['scale-110', 'night'], ['', 'linen'], ['logo', 'night'], ['-translate-y-[6%] scale-90', 'ember'], ['scale-125', 'night'], ['', 'linen']] as const).map(([art, backdrop], i) => (
        <div key={i} className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)]">
          {art === 'logo' ? (
            <div className="grid size-full place-items-center bg-surface-2">
              <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] bg-[#2f6f5e] text-sm font-semibold text-white" dir="ltr">L</span>
            </div>
          ) : (
            <ProductPhoto className="absolute inset-0" artClassName={art} backdrop={backdrop} />
          )}
        </div>
      ))}
    </div>
  );
}
