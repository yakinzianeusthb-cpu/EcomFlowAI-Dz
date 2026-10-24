import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import '../../i18n/home';

// The studio rows of the home page, shown with real output: long pages made with the "Affiche" template and the
// product photos behind them (public/showcase). Hidden from screen readers; the text beside each says what it does.

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Cycles through `count` steps every `ms` while the element is on screen (and never with reduced motion). */
function useCycle(count: number, ms: number) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (paused || reducedMotion()) return;
    const el = ref.current;
    let timer: number | undefined;
    const start = () => { timer ??= window.setInterval(() => setStep((s) => (s + 1) % count), ms); };
    const stop = () => { window.clearInterval(timer); timer = undefined; };
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.3 });
    if (el) io.observe(el);
    return () => { stop(); io.disconnect(); };
  }, [count, ms, paused]);
  return { ref, step, setStep, setPaused };
}

/** A gentle 3D tilt that follows the pointer, written straight to the element (no re-render per move). */
function useTilt(base: { x: number; y: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (x: number, y: number) => ref.current?.style.setProperty('--tilt', `rotateX(${y}deg) rotateY(${x}deg)`);
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reducedMotion() || e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    set(base.x + dx * 10, base.y - dy * 8);
  };
  const onPointerLeave = () => set(base.x, base.y);
  const style = { '--tilt': `rotateX(${base.y}deg) rotateY(${base.x}deg)` } as CSSProperties;
  return { ref, style, onPointerMove, onPointerLeave };
}

/** The chopper page (public/showcase/qatta3a.webp, 546 × 6516): where each part starts, as a share of its height. */
const PAGE_HEIGHT = 6516;
const PAGE_WIDTH = 546;
const WINDOW = (PAGE_WIDTH * (19.5 / 9)) / PAGE_HEIGHT;
const PARTS = [0, 0.19, 0.49, 0.64, 0.72];

function Phone({ src, offset = 0, className, style }: { src: string; offset?: number; className?: string; style?: CSSProperties }) {
  return (
    <div className={cn('rounded-[2.1rem] bg-[#0b0b0c] p-2 ring-1 ring-white/10', className)} style={style}>
      <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.6rem] bg-surface-2">
        <img
          src={src}
          alt=""
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          loading="lazy"
          decoding="async"
          className="absolute inset-x-0 top-0 block h-auto w-full transition-transform duration-[1200ms] ease-[var(--ease-out)]"
          style={{ transform: `translateY(-${Math.min(offset, 1 - WINDOW) * 100}%)` }}
        />
      </div>
    </div>
  );
}

export function LandingVisual() {
  const { t } = useLanguage();
  const sections = [
    t('homeLandingSection1', 'Accroche'),
    t('homeLandingSection2', 'Avantages'),
    t('homeLandingSection3', 'Mode d’emploi'),
    t('homeLandingSection4', 'Garantie'),
    t('homeLandingSection5', 'Bon de commande'),
  ];
  const { ref, step, setStep, setPaused } = useCycle(sections.length, 2600);
  const tilt = useTilt({ x: -16, y: 6 });

  return (
    <div ref={ref} aria-hidden="true" data-ui className="grid items-center gap-8 sm:grid-cols-[1.15fr_1fr]">
      <div onPointerMove={tilt.onPointerMove} onPointerLeave={tilt.onPointerLeave} className="relative mx-auto h-[440px] w-full max-w-[300px] [perspective:1400px] sm:h-[480px]">
        <div ref={tilt.ref} style={tilt.style} className="studio-tilt relative size-full [transform-style:preserve-3d]">
          {/* the page behind: another niche, pushed back */}
          <Phone src="/showcase/brosse.webp" className="absolute end-0 top-[8%] w-[60%] opacity-80 [transform:translateZ(-90px)_rotateY(10deg)]" />
          <Phone src="/showcase/qatta3a.webp" offset={PARTS[step]} className="absolute start-0 top-0 w-[68%] [transform:translateZ(40px)]" />
        </div>
      </div>
      <ol className="space-y-2" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
        {sections.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setStep(i)}
              className={cn(
                'flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 text-start text-[14px] transition-[background-color,color,transform] duration-300',
                i === step ? 'translate-x-2 bg-primary text-white rtl:-translate-x-2' : 'bg-surface text-fg hover:bg-surface-2',
              )}
            >
              <span className={cn('size-2 shrink-0 rounded-full', i === step ? 'bg-white' : 'bg-fg/25')} />
              <span className="font-medium">{s}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function VideoVisual() {
  const { t } = useLanguage();
  const scenes = [
    { label: t('homeDemoScene1', 'Accroche'), time: '0–3 s', src: '/showcase/photos/brush-hero.webp', caption: 'شعر ناعم في', highlight: '10 دقايق!' },
    { label: t('homeDemoScene2', 'Démonstration'), time: '3–9 s', src: '/showcase/photos/brush-use.webp', caption: 'تمشّطي برك', highlight: 'ويولّي ناعم' },
    { label: t('homeDemoScene3', 'Offre'), time: '9–15 s', src: '/showcase/photos/brush-detail.webp', caption: 'اطلبيها الآن', highlight: '3500 DA' },
  ];
  const { ref, step } = useCycle(scenes.length, 2400);

  return (
    <div ref={ref} aria-hidden="true" data-ui>
      <div className="grid grid-cols-3 gap-3 [perspective:1200px] sm:gap-4">
        {scenes.map((s, i) => {
          const active = i === step;
          return (
            <div key={s.time} className={cn('transition-transform duration-700 ease-[var(--ease-out)]', active ? '[transform:translateZ(36px)_translateY(-6px)]' : '[transform:translateZ(0)]')}>
              <div className={cn('relative aspect-[9/16] overflow-hidden rounded-[var(--radius-md)] bg-surface-2 transition-opacity duration-500', active ? 'opacity-100' : 'opacity-60')}>
                <img
                  src={s.src}
                  alt=""
                  width={768}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                  className={cn('absolute inset-0 size-full object-cover transition-transform ease-linear', active ? 'scale-110 duration-[2400ms]' : 'scale-100 duration-500')}
                />
                {/* the on-screen words, as the video renderer draws them: one phrase, its last words picked out */}
                <p dir="rtl" className="absolute inset-x-2 bottom-[18%] text-center text-[13px] font-bold leading-tight studio-caption text-white sm:text-[15px]">
                  {s.caption} <span dir="auto" className="rounded-[4px] bg-[#facc15] px-1 text-[#0b0b0c]">{s.highlight}</span>
                </p>
              </div>
              <p className="mt-2 flex justify-between gap-2 text-xs">
                <span className={cn('font-medium transition-colors', active ? 'text-fg' : 'text-fg-muted')}>{s.label}</span>
                <span className="whitespace-nowrap tabular-nums text-fg-faint" dir="ltr">{s.time}</span>
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex h-1.5 gap-1" dir="ltr">
        {scenes.map((s, i) => (
          <span key={s.time} className={cn('relative overflow-hidden rounded-full bg-primary/20', i === 0 ? 'w-1/5' : 'w-2/5')}>
            <span
              className={cn('absolute inset-y-0 start-0 w-full origin-left rounded-full bg-primary', i < step ? 'scale-x-100' : i === step ? 'studio-play' : 'scale-x-0')}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export function LibraryVisual() {
  const files = [
    { src: '/showcase/photos/chopper-hero.webp', name: 'hachoir-cuisine.webp' },
    { src: '/showcase/photos/brush-detail.webp', name: 'brosse-detail.webp' },
    { src: '/showcase/douche-plage.webp', name: 'page-douche-plage.webp', page: true },
    { src: '/showcase/photos/chopper-use.webp', name: 'hachoir-utilisation.webp' },
    { src: '/showcase/photos/brush-hero.webp', name: 'brosse-modele.webp' },
    { src: '/showcase/photos/chopper-detail.webp', name: 'hachoir-lames.webp' },
  ];
  return (
    <ul aria-hidden="true" data-ui className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {files.map((f) => (
        <li key={f.name} className="group">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] bg-surface-2">
            <img
              src={f.src}
              alt=""
              loading="lazy"
              decoding="async"
              className={cn('absolute inset-0 size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-105', f.page && 'object-top')}
            />
          </div>
          <p className="mt-2 truncate text-[13px] text-fg-muted" dir="ltr">{f.name}</p>
        </li>
      ))}
    </ul>
  );
}
