import { Check, GripVertical } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { keepNumbersTogether } from '../../lib/numberSpacing';
import { cn } from '../../lib/utils';
import { Chip, ProductPhoto, TextLines } from './HomeArt';
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

export function AdsVisual() {
  const { t } = useLanguage();
  const formats = [
    { ratio: 'aspect-square', width: 'w-[31%]', label: '1:1', story: false, backdrop: 'linen' as const },
    { ratio: 'aspect-[4/5]', width: 'w-[31%]', label: '4:5', story: false, backdrop: 'night' as const },
    { ratio: 'aspect-[9/16]', width: 'w-[27%]', label: '9:16', story: true, backdrop: 'ember' as const },
  ];
  return (
    <div aria-hidden="true" data-ui className="flex items-end justify-center gap-3 sm:gap-4" dir="ltr">
      {formats.map((f) => (
        <div key={f.label} className={f.width}>
          <div className={cn('relative overflow-hidden rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]', f.ratio)}>
            <ProductPhoto className="absolute inset-0" artClassName="-translate-y-[10%]" backdrop={f.backdrop} />
            {f.story && (
              <>
                <span className="absolute inset-x-0 top-[14%] border-t border-dashed border-white/45" />
                <span className="absolute inset-x-0 bottom-[20%] border-t border-dashed border-white/45" />
              </>
            )}
            <div className={cn('absolute inset-x-0 bg-linear-to-t from-black/80 to-transparent p-2.5 pt-8', f.story ? 'bottom-[20%]' : 'bottom-0')}>
              <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white" dir="auto">{t('homeDemoHeadline', 'Une lumière douce pour chaque soir')}</p>
              <span className="mt-1.5 inline-flex rounded-[3px] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#17161a]" dir="auto">{t('homeDemoShop', 'Acheter')}</span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs tabular-nums text-fg-faint">{f.label}</p>
        </div>
      ))}
    </div>
  );
}

export function MetaVisual() {
  const { t } = useLanguage();
  const rows = [
    { label: t('homeMetaBudget', 'Budget quotidien'), value: <span dir="ltr">{keepNumbersTogether('1 500 DA')}</span> },
    { label: t('homeMetaCountry', 'Pays ciblé'), value: t('homeMetaCountryValue', 'Algérie') },
    { label: t('homeMetaAge', 'Âge'), value: <span dir="ltr">18–45</span> },
    { label: t('homeMetaStatus', 'Statut'), value: <span className="rounded-[var(--radius-xs)] bg-warning/12 px-1.5 py-0.5 text-xs font-medium text-warning-ink">{t('homeMetaPaused', 'En pause')}</span> },
  ];
  return (
    <div aria-hidden="true" data-ui className="mx-auto w-full max-w-sm rounded-[var(--radius-md)] border border-line bg-surface p-5 shadow-[var(--shadow-lg)]">
      <p className="text-sm font-semibold text-fg">{t('homeMetaCardTitle', 'Avant d’activer')}</p>
      <dl className="mt-3 divide-y divide-line text-[13px]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-fg-muted">{r.label}</dt>
            <dd className="font-medium text-fg">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex items-center gap-2 text-[13px] text-fg">
        <span className="grid size-4 place-items-center rounded-[4px] bg-primary text-white"><Check size={11} strokeWidth={3} /></span>
        {t('homeMetaCheck', 'J’ai vérifié ces réglages')}
      </p>
      <span className="mt-4 flex w-full justify-center rounded-[var(--radius-sm)] bg-primary py-2 text-sm font-semibold text-white">{t('homeMetaActivate', 'Activer')}</span>
    </div>
  );
}

// an example seller's brand: the green and red of the Algerian flag, sand, ivory and ink
const SWATCHES = ['bg-[#006233]', 'bg-[#d21034]', 'bg-[#e3c995]', 'bg-[#f1ece2]', 'bg-[#17161a]'];

export function BrandVisual() {
  const { t } = useLanguage();
  return (
    <div aria-hidden="true" data-ui className="flex flex-wrap items-end gap-x-8 gap-y-5">
      <div className="flex -space-x-2 rtl:space-x-reverse">
        {SWATCHES.map((c) => <span key={c} className={cn('size-10 rounded-full border border-line-strong ring-2 ring-surface', c)} />)}
      </div>
      <div>
        <p className="display-title text-4xl leading-none text-fg" dir="ltr">Aa</p>
        <p className="mt-1.5 text-xs text-fg-faint" dir="ltr">Instrument Serif · Geist</p>
      </div>
      <Chip className="text-xs">{t('homeBrandTone', 'Chaleureux · premium')}</Chip>
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
