import { useId, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clapperboard, Download, Loader2, Package, TriangleAlert } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { charCount, type PackIssue } from '../../../lib/adPlatforms';
import { cn } from '../../../lib/utils';
import { recordsMp4 } from '../../../lib/videoRender';
import { Skeleton } from '../../ui/primitives';
import type { PackImage } from './usePackImages';
import '../../../i18n/campaigns';

/** A text with its platform's limit: the counter turns red past it, and says by how much. */
export function LimitField({ label, value, limit, onChange, multiline = false, hint }: {
  label: string;
  value: string;
  limit: number;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  const { t } = useLanguage();
  const id = useId();
  const count = charCount(value);
  const over = count > limit;
  const describedBy = `${id}-count${over ? ` ${id}-over` : ''}${hint ? ` ${id}-hint` : ''}`;
  const common = { id, dir: 'auto' as const, value, onChange: (e: { target: { value: string } }) => onChange(e.target.value), 'aria-invalid': over || undefined, 'aria-describedby': describedBy };
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-[13px] font-medium text-fg">
        <span>{label}</span>
        <span id={`${id}-count`} className={cn('text-xs tabular-nums', over ? 'font-semibold text-danger-ink' : 'text-fg-faint')}>{count}/{limit}</span>
      </label>
      {multiline
        ? <textarea {...common} className={cn('input-dz mt-1 min-h-20 resize-y', over && 'border-danger')} />
        : <input {...common} className={cn('input-dz mt-1', over && 'border-danger')} />}
      {over && <p id={`${id}-over`} className="mt-1 text-xs text-danger-ink">{t('pkTooLong', 'Trop long de {count} caractères.', { count: count - limit })}</p>}
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-fg-faint">{hint}</p>}
    </div>
  );
}

/** The button to pick in the platform's ads manager. */
export function CtaChip({ label }: { label: string }) {
  const { t } = useLanguage();
  return <span className="inline-flex rounded-[var(--radius-xs)] border border-line px-2 py-0.5 text-xs text-fg-muted">{t('pkCta', 'Bouton conseillé : {cta}', { cta: label })}</span>;
}

/** A pack's title and what is in it. */
export function PackIntro({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-surface-2 text-primary-ink" aria-hidden="true"><Package size={20} /></span>
      <div>
        <h2 className="text-[17px] font-semibold text-fg">{title}</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-fg-muted">{intro}</p>
      </div>
    </div>
  );
}

/** A titled block of the pack. */
export function PackSection({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="ui-card space-y-4 p-5">
      <div>
        <h3 id={id} className="text-[15px] font-semibold text-fg">{title}</h3>
        {note && <p className="mt-1 text-xs leading-relaxed text-fg-faint">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Where the video comes from (the Video tab), and a warning when this browser records a format the platform refuses. */
export function VideoAdvice({ text, needsMp4 = false }: { text: string; needsMp4?: boolean }) {
  const { t } = useLanguage();
  const [, setParams] = useSearchParams();
  const noMp4 = useMemo(() => needsMp4 && !recordsMp4(), [needsMp4]);
  return (
    <PackSection title={t('cmpOutVideo', 'Vidéo')}>
      <p className="text-[13px] leading-relaxed text-fg-muted">{text}</p>
      {noMp4 && (
        <p role="note" className="flex gap-2 text-[13px] leading-relaxed text-warning-ink">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {t('pkNoMp4', 'Ce navigateur enregistre les vidéos en WebM, que TikTok et Snapchat refusent : ouvre l’app dans un navigateur récent qui enregistre en MP4, ou convertis le fichier.')}
        </p>
      )}
      <button type="button" onClick={() => setParams({ tab: 'video' }, { replace: true })} className="btn-dz-secondary !min-h-9 !py-1.5 !text-[13px]">
        <Clapperboard size={15} /> {t('pkGoVideo', 'Aller à la vidéo')}
      </button>
    </PackSection>
  );
}

/** The steps to import the pack, as shown on the page (the zip carries the same steps in guide.txt). */
export function GuideSteps({ steps }: { steps: string[] }) {
  const { t } = useLanguage();
  return (
    <PackSection title={t('pkGuideTitle', 'Comment l’importer')} note={t('pkLimitsNote', 'Limites tirées de la documentation de chaque plateforme (octobre 2026). Elles peuvent changer : l’aperçu de la plateforme fait foi.')}>
      <ol className="space-y-2 text-[13px] leading-relaxed text-fg-muted">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-2.5">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg" aria-hidden="true">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </PackSection>
  );
}

/** The pack's pictures: previews while they are drawn, then each one also downloadable on its own. */
export function PackImages({ images, failed, count, aspect, empty }: { images: PackImage[] | null; failed: boolean; count: number; aspect: string; empty?: string }) {
  const { t } = useLanguage();
  if (failed) return <p role="alert" className="text-[13px] text-danger-ink">{t('pkImagesFailed', 'Les images du pack n’ont pas pu être créées. Recharge la page et réessaie.')}</p>;
  if (images && images.length === 0) return empty ? <p className="text-[13px] text-fg-muted">{empty}</p> : null;
  const grid = 'grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]';
  if (!images) {
    return (
      <div className={grid} aria-busy="true">
        {Array.from({ length: Math.max(1, count) }, (_, i) => <div key={i} style={{ aspectRatio: aspect }}><Skeleton className="size-full" /></div>)}
      </div>
    );
  }
  return (
    <ul className={grid}>
      {images.map((img, i) => (
        <li key={img.name} className="group relative overflow-hidden rounded-[var(--radius-sm)] bg-surface-2" style={{ aspectRatio: `${img.width} / ${img.height}` }}>
          <img src={img.url} alt={t('pkImageAlt', 'Image {n} du pack ({width} × {height})', { n: i + 1, width: img.width, height: img.height })} className="absolute inset-0 size-full object-cover" />
          <a
            href={img.url}
            download={img.name.split('/').pop()}
            aria-label={t('pkDownloadImage', 'Télécharger l’image {n}', { n: i + 1 })}
            className="absolute bottom-1.5 end-1.5 grid size-8 place-items-center rounded-[var(--radius-xs)] bg-black/60 text-white opacity-90 hover:opacity-100 focus-visible:opacity-100"
          >
            <Download size={15} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Why the pack cannot be downloaded yet, in plain words. */
function useIssueText() {
  const { t } = useLanguage();
  return (issue: PackIssue): string => ({
    tooLong: t('pkIssueTooLong', 'Un texte dépasse sa limite : raccourcis-le pour télécharger le pack.'),
    empty: t('pkIssueEmpty', 'Un texte est vide : complète-le pour télécharger le pack.'),
    tooFew: t('pkIssueTooFew', 'Google demande au moins 3 titres et 2 descriptions.'),
    exclaim: t('pkIssueExclaim', 'Google refuse le point d’exclamation dans les titres : retire-le.'),
    symbols: t('pkIssueSymbols', 'Un texte contient un caractère que la plateforme refuse (emoji, #, @, lien ou retour à la ligne) : retire-le.'),
    duplicate: t('pkIssueDuplicate', 'Deux titres ou deux descriptions Google sont identiques : change l’un d’eux.'),
    path: t('pkIssuePath', 'Chemins affichés : des lettres, des chiffres et des tirets seulement, et le chemin 1 avant le chemin 2.'),
    url: t('pkIssueUrl', 'Indique l’adresse https de ta page de vente pour télécharger le pack Google.'),
  })[issue];
}

/** The pack's download button, with what still blocks it. */
export function DownloadBar({ issue, busy, picturesReady, onDownload }: { issue: PackIssue | null; busy: boolean; picturesReady: boolean; onDownload: () => void }) {
  const { t } = useLanguage();
  const issueText = useIssueText();
  return (
    <div className="ui-card flex flex-wrap items-center gap-3 p-4">
      <p className={cn('me-auto text-[13px]', issue ? 'text-danger-ink' : 'text-fg-muted')} role={issue ? 'alert' : undefined}>
        {issue ? issueText(issue) : t('pkReady', 'Pack prêt : textes, images et guide dans un seul fichier.')}
      </p>
      <button type="button" onClick={onDownload} disabled={issue !== null || busy || !picturesReady} className="btn-dz-primary !min-h-9 !py-1.5 !text-[13px] disabled:opacity-50">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} {busy ? t('pkZipping', 'Préparation du pack…') : t('pkDownload', 'Télécharger le pack (.zip)')}
      </button>
    </div>
  );
}
