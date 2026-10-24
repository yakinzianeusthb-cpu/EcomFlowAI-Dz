import { useState, type ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { reveal } from './useReveal';
import '../../i18n/home';

/** Demonstration pages made with the app's "Affiche" template (public/showcase, 546 px wide), with their height. */
const PAGES = [
  { file: 'qatta3a', height: 6516, labelKey: 'homeWorkPage1', fallback: 'Cuisine : un hachoir à légumes' },
  { file: 'brosse', height: 6539, labelKey: 'homeWorkPage2', fallback: 'Beauté : une brosse lissante' },
  { file: 'aspirateur', height: 0, labelKey: 'homeWorkPage3', fallback: 'Auto : un aspirateur sans fil' },
  { file: 'montre', height: 0, labelKey: 'homeWorkPage4', fallback: 'Enfants : une montre GPS' },
].filter((p) => p.height > 0);
const WIDTH = 546;
/** the frame's shape: a phone screen */
const FRAME = 19.5 / 9;

/**
 * Pages made with the long-image template, each in a phone-shaped frame showing its first screen. Pointing at one
 * (or focusing it) runs slowly through the whole page; the link opens the full image.
 */
export default function ShowcaseGallery({ intro }: { intro: ReactNode }) {
  const { t } = useLanguage();
  const [running, setRunning] = useState<string | null>(null);
  const stop = (file: string) => setRunning((r) => (r === file ? null : r));

  return (
    <div className="grid gap-12 lg:grid-cols-4 lg:items-end lg:gap-5">
      {/* with two pages, the heading takes the other half of the row; with more, it sits above them */}
      <div className={PAGES.length <= 2 ? "lg:col-span-2 lg:self-center lg:pe-10" : "lg:col-span-4"}>{intro}</div>
      <ul className={`-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 ${PAGES.length <= 2 ? "lg:col-span-2 lg:grid-cols-2" : "lg:col-span-4 lg:grid-cols-4"}`}>
        {PAGES.map((p, i) => {
          // how far the picture travels for its bottom to reach the bottom of the frame
          const travel = (1 - (WIDTH * FRAME) / p.height) * 100;
          const label = t(p.labelKey, p.fallback);
          return (
            <li key={p.file} className="w-[72%] shrink-0 snap-center sm:w-[44%] lg:w-auto" {...reveal(i * 80)}>
              <a
                href={`/showcase/${p.file}.webp`}
                target="_blank"
                rel="noopener noreferrer"
                onPointerEnter={() => setRunning(p.file)}
                onPointerLeave={() => stop(p.file)}
                onFocus={() => setRunning(p.file)}
                onBlur={() => stop(p.file)}
                aria-label={t('homeWorkOpen', 'Voir la page entière : {label}', { label })}
                className="block overflow-hidden rounded-[1.75rem] bg-surface-2 transition-transform duration-300 ease-[var(--ease-out)] active:scale-[0.98]"
              >
                <span className="relative block aspect-[9/19.5] overflow-hidden">
                  <img
                    src={`/showcase/${p.file}.webp`}
                    alt=""
                    width={WIDTH}
                    height={p.height}
                    loading="lazy"
                    decoding="async"
                    className="showcase-run absolute inset-x-0 top-0 block h-auto w-full"
                    style={{ transform: `translateY(${running === p.file ? -travel : 0}%)` }}
                  />
                </span>
              </a>
              <p className="mt-4 text-[16px] leading-snug text-fg">{label}</p>
            </li>
        );
      })}
    </ul>
    </div>
  );
}
