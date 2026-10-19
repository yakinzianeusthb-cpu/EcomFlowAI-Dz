/**
 * Runs the home page's 3D hero inside a worker, on an OffscreenCanvas: three.js is parsed here and every frame is
 * drawn here, so the page's main thread (taps, scrolling, React) never waits for the 3D.
 */
import { createHeroScene, type HeroLayout, type HeroScene } from './heroScene';
import type { HeroQuality } from '../../lib/heroMotion';

export type HeroWorkerMessage =
  | { type: 'init'; canvas: OffscreenCanvas; quality: HeroQuality; reduced: boolean }
  | { type: 'layout'; layout: HeroLayout }
  | { type: 'pointer'; x: number; y: number }
  | { type: 'scroll'; progress: number }
  | { type: 'run'; on: boolean }
  | { type: 'dispose' };

export type HeroWorkerReply = { type: 'ready' } | { type: 'lost' } | { type: 'error'; message: string };

// the worker's global scope, typed without pulling the WebWorker library into the app's DOM build
const scope = self as unknown as { postMessage(reply: HeroWorkerReply): void; onmessage: ((event: MessageEvent<HeroWorkerMessage>) => void) | null };
const post = (reply: HeroWorkerReply) => scope.postMessage(reply);

let scene: HeroScene | null = null;
let reduced = false;
let ready = false;
let wantRun = false;

const apply = () => {
  if (!scene || !ready) return;
  if (reduced) scene.renderStill();
  else if (wantRun) scene.start();
  else scene.stop();
};

scope.onmessage = (event) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      reduced = message.reduced;
      try {
        scene = createHeroScene(message.canvas, { quality: message.quality, onContextLost: () => post({ type: 'lost' }) });
      } catch (error) {
        post({ type: 'error', message: String(error) });
        return;
      }
      scene.ready.then(
        () => {
          ready = true;
          apply();
          post({ type: 'ready' });
        },
        (error) => post({ type: 'error', message: String(error) }),
      );
      return;
    case 'layout':
      scene?.setLayout(message.layout);
      if (reduced) apply();
      return;
    case 'pointer':
      scene?.setPointer(message.x, message.y);
      return;
    case 'scroll':
      scene?.setScroll(message.progress);
      return;
    case 'run':
      wantRun = message.on;
      apply();
      return;
    case 'dispose':
      scene?.dispose();
      scene = null;
      return;
  }
};
