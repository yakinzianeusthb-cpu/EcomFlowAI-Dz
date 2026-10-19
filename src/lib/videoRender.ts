/**
 * Draws the frames of a script video on a canvas and records them into a video file, in the browser.
 * The timing comes from videoTimeline.ts; this file only paints and records.
 */
import { frameAt, isRtlText, pickRecorderMime, wrapText, type Segment, type Timeline } from './videoTimeline';

const FONT = '"Noto Sans Arabic Variable", "Geist Variable", system-ui, sans-serif';
const FADE_SECONDS = 0.35;

export interface RenderAssets {
  images: HTMLImageElement[];
  /** Blurred, darkened full-frame versions of `images`, prepared once (blurring every frame would be too slow). */
  backgrounds: HTMLCanvasElement[];
  /** AI clip per scene of the script (null when the scene has none); drawn instead of the photo. */
  clips?: (HTMLVideoElement | null)[];
}

/** A muted, inline video element ready to be drawn on the canvas. */
export function loadClip(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('clip could not be loaded'));
    video.src = src;
  });
}

const clipFor = (segment: Segment, assets: RenderAssets) =>
  segment.kind === 'scene' && segment.sceneIndex !== undefined ? assets.clips?.[segment.sceneIndex] ?? null : null;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image could not be loaded'));
    img.src = src;
  });
}

/** Makes sure the fonts are ready before the first frame, so the first seconds do not show a fallback font. */
export async function loadVideoFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.all(['800 40px "Noto Sans Arabic Variable"', '800 40px "Geist Variable"', '600 30px "Noto Sans Arabic Variable"'].map((f) => document.fonts.load(f).catch(() => [])));
}

const cover = (iw: number, ih: number, w: number, h: number) => {
  const s = Math.max(w / iw, h / ih);
  return { w: iw * s, h: ih * s, x: (w - iw * s) / 2, y: (h - ih * s) / 2 };
};
const contain = (iw: number, ih: number, w: number, h: number) => {
  const s = Math.min(w / iw, h / ih);
  return { w: iw * s, h: ih * s };
};
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

export function prepareAssets(images: HTMLImageElement[], width: number, height: number): RenderAssets {
  const backgrounds = images.map((img) => {
    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const g = c.getContext('2d')!;
    g.filter = 'blur(32px) brightness(0.5) saturate(1.2)';
    const r = cover(img.naturalWidth, img.naturalHeight, width, height);
    g.drawImage(img, r.x - 60, r.y - 60, r.w + 120, r.h + 120);
    return c;
  });
  return { images, backgrounds };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws centred, wrapped text on a rounded backdrop; returns the bottom of the box. */
function textBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  o: { width: number; top: number; size: number; weight: number; color: string; backdrop: string; maxLines: number },
): number {
  ctx.font = `${o.weight} ${o.size}px ${FONT}`;
  ctx.direction = isRtlText(text) ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const maxWidth = o.width * 0.82;
  const lines = wrapText(text, maxWidth, (part) => ctx.measureText(part).width, o.maxLines);
  if (!lines.length) return o.top;
  const lineHeight = o.size * 1.38;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const padX = o.size * 0.7;
  const padY = o.size * 0.45;
  const boxW = Math.min(o.width * 0.92, widest + padX * 2);
  const boxH = lines.length * lineHeight + padY * 2;
  const x = (o.width - boxW) / 2;
  ctx.fillStyle = o.backdrop;
  roundRect(ctx, x, o.top, boxW, boxH, o.size * 0.5);
  ctx.fill();
  ctx.fillStyle = o.color;
  lines.forEach((line, i) => ctx.fillText(line, o.width / 2, o.top + padY + lineHeight * (i + 0.5)));
  return o.top + boxH;
}

function drawPhoto(ctx: CanvasRenderingContext2D, segment: Segment, progress: number, assets: RenderAssets, w: number, h: number) {
  const clip = clipFor(segment, assets);
  if (clip && clip.readyState >= 2 && clip.videoWidth) {
    const r = cover(clip.videoWidth, clip.videoHeight, w, h);
    ctx.drawImage(clip, r.x, r.y, r.w, r.h);
    return;
  }
  const index = segment.imageIndex;
  if (index === null || !assets.images[index]) {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0b1530');
    g.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const img = assets.images[index];
  ctx.drawImage(assets.backgrounds[index], 0, 0, w, h);

  const k = ease(progress);
  let scale = 1;
  let dx = 0;
  if (segment.motion === 'zoom-in') scale = 1 + 0.12 * k;
  else if (segment.motion === 'zoom-out') scale = 1.12 - 0.12 * k;
  else { scale = 1.06; dx = (segment.motion === 'pan-left' ? 0.5 - k : k - 0.5) * 0.08 * w; }

  const isCta = segment.kind === 'cta';
  const box = contain(img.naturalWidth, img.naturalHeight, w * 0.9, h * (isCta ? 0.42 : 0.56));
  ctx.save();
  ctx.translate(w / 2 + dx, h * (isCta ? 0.34 : 0.5));
  ctx.scale(scale, scale);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 40;
  roundRect(ctx, -box.w / 2, -box.h / 2, box.w, box.h, 28);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.clip();
  ctx.drawImage(img, -box.w / 2, -box.h / 2, box.w, box.h);
  ctx.restore();
}

function drawCta(ctx: CanvasRenderingContext2D, segment: Segment, local: number, w: number, h: number) {
  const unit = Math.min(w, h);
  // the call to action, as a button that gently pulses
  const pulse = 1 + 0.04 * Math.sin(local * 6);
  ctx.save();
  ctx.translate(w / 2, h * 0.66);
  ctx.scale(pulse, pulse);
  ctx.font = `800 ${Math.round(unit * 0.075)}px ${FONT}`;
  ctx.direction = isRtlText(segment.caption) ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const btnW = Math.min(w * 0.86, ctx.measureText(segment.caption).width + unit * 0.16);
  const btnH = unit * 0.14;
  ctx.fillStyle = '#22c55e';
  roundRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(segment.caption, 0, 0);
  ctx.restore();

  let y = h * 0.66 + unit * 0.12;
  if (segment.price) {
    y = textBox(ctx, segment.price, { width: w, top: y, size: Math.round(unit * 0.07), weight: 800, color: '#111827', backdrop: '#facc15', maxLines: 1 }) + unit * 0.03;
  }
  for (const badge of segment.badges ?? []) {
    y = textBox(ctx, `✓ ${badge}`, { width: w, top: y, size: Math.round(unit * 0.042), weight: 700, color: '#ffffff', backdrop: 'rgba(0,0,0,0.55)', maxLines: 1 }) + unit * 0.018;
  }
}

/** Paints the frame at `seconds` onto the canvas context. */
export function drawFrame(ctx: CanvasRenderingContext2D, timeline: Timeline, seconds: number, assets: RenderAssets): void {
  const { width: w, height: h } = ctx.canvas;
  const { segment, progress } = frameAt(timeline, seconds);
  const local = progress * (segment.end - segment.start);
  const unit = Math.min(w, h);
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  drawPhoto(ctx, segment, progress, assets, w, h);

  // overall progress, as on stories
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(unit * 0.05, unit * 0.04, w - unit * 0.1, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(unit * 0.05, unit * 0.04, (w - unit * 0.1) * Math.min(1, seconds / timeline.duration), 6);

  if (segment.kind === 'cta') {
    drawCta(ctx, segment, local, w, h);
  } else {
    if (segment.caption) textBox(ctx, segment.caption, { width: w, top: h * 0.08, size: Math.round(unit * 0.066), weight: 800, color: '#ffffff', backdrop: 'rgba(0,0,0,0.58)', maxLines: 3 });
    if (segment.subtitle) {
      ctx.font = `600 ${Math.round(unit * 0.045)}px ${FONT}`;
      const estimate = Math.min(3, Math.ceil(ctx.measureText(segment.subtitle).width / (w * 0.82))) * unit * 0.045 * 1.38 + unit * 0.09;
      textBox(ctx, segment.subtitle, { width: w, top: h * 0.92 - estimate, size: Math.round(unit * 0.045), weight: 600, color: '#fde047', backdrop: 'rgba(0,0,0,0.62)', maxLines: 3 });
    }
  }

  if (local < FADE_SECONDS) {
    ctx.fillStyle = `rgba(0,0,0,${1 - local / FADE_SECONDS})`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/** True when this browser can record a canvas into a video. */
export function canRecordVideo(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') return false;
  return pickRecorderMime((t) => MediaRecorder.isTypeSupported(t)) !== null;
}

/**
 * Plays the timeline on the canvas in real time while recording it. Resolves with the video file.
 * The tab must stay visible: browsers slow down hidden tabs, which would stretch the video.
 */
export async function recordVideo(
  canvas: HTMLCanvasElement,
  timeline: Timeline,
  assets: RenderAssets,
  onProgress?: (fraction: number) => void,
): Promise<Blob> {
  const mimeType = pickRecorderMime((t) => MediaRecorder.isTypeSupported(t));
  if (!mimeType) throw new Error('video recording is not supported in this browser');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2D context unavailable');

  drawFrame(ctx, timeline, 0, assets);
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
  recorder.start(250);

  const startedAt = performance.now();
  let playing: HTMLVideoElement | null = null;
  let segmentIndex = -1;
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - startedAt) / 1000;
      const now = frameAt(timeline, Math.min(t, timeline.duration));
      if (now.index !== segmentIndex) {
        // each scene's clip starts from its first frame when the scene starts
        segmentIndex = now.index;
        playing?.pause();
        playing = clipFor(now.segment, assets);
        if (playing) { playing.currentTime = 0; playing.play().catch(() => {}); }
      }
      drawFrame(ctx, timeline, Math.min(t, timeline.duration), assets);
      onProgress?.(Math.min(1, t / timeline.duration));
      if (t >= timeline.duration) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // keep the last frame for a moment so the file does not end on a half-drawn frame
  await new Promise((r) => setTimeout(r, 200));
  playing?.pause();
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((track) => track.stop());
  return new Blob(chunks, { type: mimeType.split(';')[0] });
}
