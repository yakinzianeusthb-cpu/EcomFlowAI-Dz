import { useEffect, useRef, useState, type RefObject } from 'react';
import { anchorPoint, panelRange, pickQuality, scrollProgress } from '../../lib/heroMotion';
import { canUseWorker, mayHaveWebGL2, pageDriver, workerDriver, type HeroDriver, type HeroDriverOptions } from './heroDriver';

interface Props {
  /** the hero section: the canvas covers it */
  sectionRef: RefObject<HTMLElement | null>;
  /** the fluted glass panel's extent */
  panelRef: RefObject<HTMLElement | null>;
  /** where the object sits and how large it may be */
  anchorRef: RefObject<HTMLElement | null>;
  rtl: boolean;
}

const media = (query: string) => {
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
};

/** Visitors who asked to save data get the still picture instead of the 3D code. */
function savesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? '');
}

const whenIdle = (task: () => void): (() => void) => {
  // Safari has no requestIdleCallback
  const requestIdle = (window as { requestIdleCallback?: Window['requestIdleCallback'] }).requestIdleCallback;
  if (typeof requestIdle === 'function') {
    const id = requestIdle(task, { timeout: 1500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(task, 250);
  return () => clearTimeout(id);
};

const clampUnit = (v: number) => Math.max(-1, Math.min(1, v));

/** A fresh canvas for each attempt: one that was handed to a worker can never be drawn on from the page again. */
function freshCanvas(host: HTMLElement): HTMLCanvasElement {
  host.querySelector('canvas')?.remove();
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-canvas';
  host.appendChild(canvas);
  return canvas;
}

/** The worker way first, then the page itself; null when neither can run (no WebGL 2, an error). */
async function startDriver(host: HTMLElement, options: HeroDriverOptions, layout: (driver: HeroDriver) => void): Promise<HeroDriver | null> {
  const attempts: ((canvas: HTMLCanvasElement) => HeroDriver | Promise<HeroDriver>)[] = [];
  if (canUseWorker(document.createElement('canvas'))) attempts.push((canvas) => workerDriver(canvas, options));
  attempts.push((canvas) => pageDriver(canvas, options));
  for (const attempt of attempts) {
    let driver: HeroDriver | null = null;
    try {
      driver = await attempt(freshCanvas(host));
      layout(driver);
      await driver.ready;
      return driver;
    } catch (error) {
      driver?.dispose();
      console.warn('3D hero: falling back after', error);
    }
  }
  host.querySelector('canvas')?.remove();
  return null;
}

/**
 * The 3D picture behind the hero. Loaded once the page is idle and rendered off the main thread where the browser
 * allows it; paused off screen and in background tabs; a single still frame for reduced motion; a static picture
 * when WebGL is missing or data is being saved. Purely decorative: hidden from assistive technology.
 */
export default function HeroCanvas({ sectionRef, panelRef, anchorRef, rtl }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const relayoutRef = useRef<(() => void) | null>(null);
  const rtlRef = useRef(rtl);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (savesData()) {
      setStill(true);
      return;
    }
    let cancelled = false;
    let teardown = () => {};

    const boot = async () => {
      const host = hostRef.current;
      const section = sectionRef.current;
      if (!host || !section) return;
      // no WebGL 2: straight to the still picture, without downloading any 3D code
      if (!mayHaveWebGL2()) {
        setStill(true);
        return;
      }
      const nav = navigator as Navigator & { deviceMemory?: number };
      const reduced = media('(prefers-reduced-motion: reduce)');
      const options: HeroDriverOptions = {
        quality: pickQuality({
          width: window.innerWidth,
          coarsePointer: media('(pointer: coarse)'),
          devicePixelRatio: window.devicePixelRatio || 1,
          cores: nav.hardwareConcurrency,
          memoryGb: nav.deviceMemory,
        }),
        reduced,
        onLost: () => {
          teardown();
          teardown = () => {};
          host.querySelector('canvas')?.remove();
          setStill(true);
        },
      };
      const measure = (driver: HeroDriver) => {
        const box = section.getBoundingClientRect();
        if (!box.width || !box.height) return;
        const panel = panelRef.current?.getBoundingClientRect();
        const anchor = anchorRef.current?.getBoundingClientRect();
        driver.setLayout({
          width: box.width,
          height: box.height,
          panel: panel ? panelRange(panel, box) : { start: 0, end: 0 },
          anchor: anchor ? anchorPoint(anchor, box) : { x: 0.3, y: 0, size: 0.6 },
          rtl: rtlRef.current,
        });
      };

      const driver = await startDriver(host, options, measure);
      if (cancelled) {
        driver?.dispose();
        return;
      }
      if (!driver) {
        setStill(true);
        return;
      }
      host.querySelector('canvas')?.setAttribute('data-live', 'true');
      relayoutRef.current = () => measure(driver);

      let onScreen = true;
      let visible = document.visibilityState === 'visible';
      const run = () => driver.run(onScreen && visible);
      const resize = new ResizeObserver(() => measure(driver));
      resize.observe(section);
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting;
        run();
      }, { rootMargin: '120px 0px' });
      io.observe(section);
      const onVisibility = () => {
        visible = document.visibilityState === 'visible';
        run();
      };
      // pointer and scroll are sent at most once a frame
      let pending: { x: number; y: number } | null = null;
      let frame = 0;
      const flush = () => {
        frame = 0;
        if (pending) driver.setPointer(pending.x, pending.y);
        pending = null;
        const box = section.getBoundingClientRect();
        driver.setScroll(scrollProgress(box.top, box.height));
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(flush);
      };
      const onPointer = (event: PointerEvent) => {
        const box = section.getBoundingClientRect();
        pending = { x: clampUnit(((event.clientX - box.left) / box.width) * 2 - 1), y: clampUnit(1 - ((event.clientY - box.top) / box.height) * 2) };
        schedule();
      };
      document.addEventListener('visibilitychange', onVisibility);
      if (!reduced) window.addEventListener('scroll', schedule, { passive: true });
      if (!reduced && media('(hover: hover) and (pointer: fine)')) window.addEventListener('pointermove', onPointer, { passive: true });
      flush();
      run();

      teardown = () => {
        cancelAnimationFrame(frame);
        resize.disconnect();
        io.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('pointermove', onPointer);
        relayoutRef.current = null;
        driver.dispose();
      };
    };

    const cancelIdle = whenIdle(() => void boot());
    return () => {
      cancelled = true;
      cancelIdle();
      teardown();
    };
  }, [sectionRef, panelRef, anchorRef]);

  // a language change mirrors the layout without resizing anything: measure again once the page has flipped
  // (not on the first render: the scene measures the page itself when it starts)
  useEffect(() => {
    if (rtlRef.current === rtl) return;
    rtlRef.current = rtl;
    const id = requestAnimationFrame(() => relayoutRef.current?.());
    return () => cancelAnimationFrame(id);
  }, [rtl]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {still && (
        <picture>
          <source media="(max-width: 767px)" srcSet="/hero/still-phone.webp" />
          <img src="/hero/still-desktop.webp" alt="" decoding="async" className="absolute inset-0 size-full object-cover rtl:-scale-x-100" />
        </picture>
      )}
      <div ref={hostRef} className="absolute inset-0" />
    </div>
  );
}
