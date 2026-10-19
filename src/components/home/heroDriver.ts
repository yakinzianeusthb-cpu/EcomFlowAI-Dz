/**
 * Two ways to run the 3D hero behind one interface. Preferred: a worker with an OffscreenCanvas (nothing on the
 * page's main thread). Otherwise: on the page itself, loaded on demand. Each throws (or rejects `ready`) when the
 * browser cannot run it, so the caller can try the next way and, last, show the still picture.
 */
import type { HeroQuality } from '../../lib/heroMotion';
import type { HeroLayout } from './heroScene';
import type { HeroWorkerMessage, HeroWorkerReply } from './heroWorker';

export interface HeroDriver {
  /** resolves once the first frame is on screen */
  ready: Promise<void>;
  setLayout(layout: HeroLayout): void;
  setPointer(x: number, y: number): void;
  setScroll(progress: number): void;
  /** animate (true) or hold still (false): off screen, background tab */
  run(on: boolean): void;
  dispose(): void;
}

export interface HeroDriverOptions {
  quality: HeroQuality;
  /** one still frame instead of the animation */
  reduced: boolean;
  onLost: () => void;
}

/**
 * A free check before downloading any 3D code: does the browser know WebGL 2 at all? (Creating a test context here
 * would cost the page's main thread a long task on a weak phone; whether a context can really be made is left to
 * the drivers, which fail over to the still picture.)
 */
export function mayHaveWebGL2(): boolean {
  return typeof WebGL2RenderingContext !== 'undefined';
}

export function canUseWorker(canvas: HTMLCanvasElement): boolean {
  return typeof Worker === 'function' && typeof canvas.transferControlToOffscreen === 'function';
}

export function workerDriver(canvas: HTMLCanvasElement, { quality, reduced, onLost }: HeroDriverOptions): HeroDriver {
  const offscreen = canvas.transferControlToOffscreen();
  const worker = new Worker(new URL('./heroWorker.ts', import.meta.url), { type: 'module' });
  const send = (message: HeroWorkerMessage, transfer: Transferable[] = []) => worker.postMessage(message, transfer);
  const ready = new Promise<void>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<HeroWorkerReply>) => {
      const reply = event.data;
      if (reply.type === 'ready') resolve();
      else if (reply.type === 'error') reject(new Error(reply.message));
      else onLost();
    };
    worker.onerror = (event) => {
      event.preventDefault();
      reject(new Error(event.message || 'the 3D worker could not start'));
    };
  });
  send({ type: 'init', canvas: offscreen, quality, reduced }, [offscreen]);
  return {
    ready,
    setLayout: (layout) => send({ type: 'layout', layout }),
    setPointer: (x, y) => send({ type: 'pointer', x, y }),
    setScroll: (progress) => send({ type: 'scroll', progress }),
    run: (on) => send({ type: 'run', on }),
    dispose: () => {
      send({ type: 'dispose' });
      // let it free its GPU memory, then end it (ending it also releases its WebGL context)
      setTimeout(() => worker.terminate(), 200);
    },
  };
}

export async function pageDriver(canvas: HTMLCanvasElement, { quality, reduced, onLost }: HeroDriverOptions): Promise<HeroDriver> {
  const { createHeroScene } = await import('./heroScene');
  const scene = createHeroScene(canvas, { quality, onContextLost: onLost });
  let started = false;
  let wantRun = false;
  const apply = () => {
    if (!started) return;
    if (reduced) scene.renderStill();
    else if (wantRun) scene.start();
    else scene.stop();
  };
  return {
    ready: scene.ready.then(() => {
      started = true;
      apply();
    }),
    setLayout: (layout) => {
      scene.setLayout(layout);
      if (reduced) apply();
    },
    setPointer: scene.setPointer,
    setScroll: scene.setScroll,
    run: (on) => {
      wantRun = on;
      apply();
    },
    dispose: () => scene.dispose(),
  };
}
