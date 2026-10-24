/**
 * Draws the frames of a script video on a canvas and records them, with sound, into a video file, in the browser.
 * The timing comes from videoTimeline.ts and the music from videoMusic.ts; this file paints, mixes and records.
 *
 * The look is the one of today's short ads: the footage full frame (an AI clip, or the product photo with a slow
 * camera move), bold captions that pop in word by word with one word highlighted, a swipe up between scenes, and
 * an end card where the price lands with a bounce.
 */
import { inkOn } from './color';
import { musicPlan, renderMusic } from './videoMusic';
import { frameAt, isRtlText, pickRecorderMime, subtitlePages, wrapText, type Segment, type Timeline } from './videoTimeline';

const FONT = '"Noto Sans Arabic Variable", "Geist Variable", system-ui, sans-serif';
/** length of the swipe between two scenes */
const TRANSITION = 0.38;
/** delay between two words of a caption appearing */
const WORD_STAGGER = 0.07;
const DEFAULT_ACCENT = '#ffd23f';
/** a photo that would lose more than half of itself to fill the frame is shown whole, over a blurred copy */
const MIN_COVER_KEEP = 0.5;

export interface RenderAssets {
  images: HTMLImageElement[];
  /** a dark tone taken from each photo, for the end card behind the product */
  tones: string[];
  /** a small blurred copy of each photo that does not fit the frame's shape (null for the ones that do) */
  backdrops?: (HTMLCanvasElement | null)[];
  /** AI clip per scene of the script (null when the scene has none); shown instead of the photo */
  clips?: (HTMLVideoElement | null)[];
  /** the brand's colour, for the highlighted word and the price */
  accent?: string;
}

/** A muted, inline video element ready to be drawn on the canvas (its sound is routed in only while recording). */
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
  const fonts = ['900 40px "Noto Sans Arabic Variable"', '900 40px "Geist Variable"', '600 30px "Noto Sans Arabic Variable"', '600 30px "Geist Variable"'];
  await Promise.all(fonts.map((f) => document.fonts.load(f).catch(() => [])));
}

/** The photo's average colour, darkened: a background for the end card that belongs to the product. */
function darkTone(img: HTMLImageElement): string {
  const c = document.createElement('canvas');
  c.width = 8;
  c.height = 8;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return '#141416';
  g.drawImage(img, 0, 0, 8, 8);
  const px = g.getImageData(0, 0, 8, 8).data;
  let r = 0, gr = 0, b = 0;
  for (let i = 0; i < px.length; i += 4) { r += px[i]; gr += px[i + 1]; b += px[i + 2]; }
  const n = px.length / 4;
  const k = 0.28; // keep it dark enough for white text
  return `rgb(${Math.round((r / n) * k)}, ${Math.round((gr / n) * k)}, ${Math.round((b / n) * k)})`;
}

/**
 * How much of a photo stays visible once it is cropped to fill a frame (1 = all of it), along the side that loses
 * the most: a square photo keeps 56% of its width in a story frame, a landscape one under a third.
 */
export function coverKeeps(photoWidth: number, photoHeight: number, frameWidth: number, frameHeight: number): number {
  const photo = photoWidth / photoHeight;
  const frame = frameWidth / frameHeight;
  return Math.min(photo / frame, frame / photo);
}

/** A small blurred copy of the photo, stretched to fill the frame behind the whole photo. */
function backdrop(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement | null {
  const c = document.createElement('canvas');
  const scale = 96 / Math.max(width, height);
  c.width = Math.max(1, Math.round(width * scale));
  c.height = Math.max(1, Math.round(height * scale));
  const g = c.getContext('2d');
  if (!g) return null;
  // blurred where the browser can; drawn this small, then stretched, it comes out soft everywhere
  g.filter = 'blur(3px)';
  cover(g, img, img.naturalWidth, img.naturalHeight, c.width, c.height, 1.2);
  return c;
}

export function prepareAssets(images: HTMLImageElement[], width: number, height: number, accent?: string): RenderAssets {
  return {
    images,
    tones: images.map(darkTone),
    backdrops: images.map((img) => (coverKeeps(img.naturalWidth, img.naturalHeight, width, height) < MIN_COVER_KEEP ? backdrop(img, width, height) : null)),
    accent,
  };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export { inkOn };
const easeOutCubic = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const easeOutBack = (x: number) => {
  const t = clamp01(x) - 1;
  return 1 + 2.70158 * t ** 3 + 1.70158 * t ** 2;
};

function cover(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sw: number, sh: number, w: number, h: number, scale = 1, dx = 0) {
  const s = Math.max(w / sw, h / sh) * scale;
  ctx.drawImage(source, (w - sw * s) / 2 + dx, (h - sh * s) / 2, sw * s, sh * s);
}

function contain(ctx: CanvasRenderingContext2D, source: CanvasImageSource, sw: number, sh: number, w: number, h: number, scale = 1, dx = 0) {
  const s = Math.min(w / sw, h / sh) * scale;
  ctx.drawImage(source, (w - sw * s) / 2 + dx, (h - sh * s) / 2, sw * s, sh * s);
}

/** a photo shown whole sits a little inside the frame; the camera move takes it to at most 1.16 times that */
const CONTAIN_SCALE = 0.92;
const CONTAIN_LARGEST = CONTAIN_SCALE * 1.16;

/**
 * Where to centre the caption of a scene whose photo is shown whole: in the band above the photo when that band is
 * tall enough (a landscape photo in a story frame), so the words do not cover the product. Null otherwise.
 */
function captionAbovePhoto(segment: Segment, assets: RenderAssets, w: number, h: number): number | null {
  if (segment.imageIndex === null || !assets.backdrops?.[segment.imageIndex] || clipFor(segment, assets)) return null;
  const img = assets.images[segment.imageIndex];
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight) * CONTAIN_LARGEST;
  const top = (h - img.naturalHeight * s) / 2;
  return top > h * 0.2 ? top / 2 + h * 0.02 : null;
}

/**
 * The footage of a scene: its AI clip, or the photo with a slow push in, pull out or pan; then the legibility scrims.
 * A photo whose shape is far from the frame's (a landscape photo in a story) is shown whole over a blurred copy of
 * itself, rather than cropped down to a strip that may miss the product.
 */
function drawFootage(ctx: CanvasRenderingContext2D, segment: Segment, progress: number, assets: RenderAssets, w: number, h: number) {
  const clip = clipFor(segment, assets);
  if (clip && clip.readyState >= 2 && clip.videoWidth) {
    cover(ctx, clip, clip.videoWidth, clip.videoHeight, w, h);
  } else if (segment.imageIndex !== null && assets.images[segment.imageIndex]) {
    const img = assets.images[segment.imageIndex];
    const k = progress;
    let scale = 1.06;
    let dx = 0;
    if (segment.motion === 'zoom-in') scale = 1.04 + 0.12 * k;
    else if (segment.motion === 'zoom-out') scale = 1.16 - 0.12 * k;
    else dx = (segment.motion === 'pan-left' ? 0.5 - k : k - 0.5) * 0.07 * w;
    const blurred = assets.backdrops?.[segment.imageIndex];
    if (blurred) {
      ctx.drawImage(blurred, 0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, w, h);
      // the whole photo, a little inside the frame, with the same slow camera move
      contain(ctx, img, img.naturalWidth, img.naturalHeight, w, h, scale * CONTAIN_SCALE, dx * 0.5);
    } else {
      cover(ctx, img, img.naturalWidth, img.naturalHeight, w, h, scale, dx);
    }
  } else {
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, w, h);
  }
  // scrims (top for the app's own buttons, bottom for the captions)
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.22);
  top.addColorStop(0, 'rgba(0,0,0,0.38)');
  top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.22);
  const bottom = ctx.createLinearGradient(0, h * 0.45, 0, h);
  bottom.addColorStop(0, 'rgba(0,0,0,0)');
  bottom.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, h * 0.45, w, h * 0.55);
}

/** The word of a caption to highlight: one with a number (a price, a quantity), else the longest. */
export function highlightIndex(words: string[]): number {
  const withDigit = words.findIndex((word) => /\d/.test(word));
  if (withDigit >= 0) return withDigit;
  let best = -1;
  words.forEach((word, i) => { if (word.length >= 4 && (best < 0 || word.length > words[best].length)) best = i; });
  return best;
}

/** Big caption, centred around `centerY`: each word pops in after the previous one; one word sits on the accent colour. */
function drawCaption(ctx: CanvasRenderingContext2D, text: string, t: number, w: number, centerY: number, size: number, accent: string) {
  const rtl = isRtlText(text);
  ctx.font = `900 ${size}px ${FONT}`;
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const lines = wrapText(text, w * 0.84, (part) => ctx.measureText(part).width, 3);
  const words = lines.flatMap((line) => line.split(' '));
  const mark = highlightIndex(words);
  const lineHeight = size * 1.22;
  const space = ctx.measureText(' ').width;
  let index = 0;
  lines.forEach((line, li) => {
    const parts = line.split(' ');
    const widths = parts.map((p) => ctx.measureText(p).width);
    const total = widths.reduce((s, x) => s + x, 0) + space * (parts.length - 1);
    const y = centerY + (li - (lines.length - 1) / 2) * lineHeight;
    // left-to-right lines start at the left edge, right-to-left ones at the right edge
    let x = rtl ? (w + total) / 2 : (w - total) / 2;
    parts.forEach((part, pi) => {
      const wordWidth = widths[pi];
      const left = rtl ? x - wordWidth : x;
      const appear = (t - index * WORD_STAGGER) / 0.28;
      if (appear > 0) {
        const scale = 0.6 + 0.4 * easeOutBack(appear);
        ctx.save();
        ctx.globalAlpha = clamp01(appear * 2.5);
        ctx.translate(left + wordWidth / 2, y);
        ctx.scale(scale, scale);
        ctx.translate(-(left + wordWidth / 2), -y);
        if (index === mark) {
          const pad = size * 0.16;
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.roundRect(left - pad, y - size * 0.62, wordWidth + pad * 2, size * 1.2, size * 0.22);
          ctx.fill();
          ctx.fillStyle = inkOn(accent);
          ctx.fillText(part, left, y);
        } else {
          ctx.lineJoin = 'round';
          ctx.lineWidth = size * 0.16;
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.strokeText(part, left, y);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(part, left, y);
        }
        ctx.restore();
      }
      x = rtl ? x - wordWidth - space : x + wordWidth + space;
      index++;
    });
  });
}

/** when the subtitle starts, after the caption has begun to land */
const SUBTITLE_IN = 0.25;

/**
 * The voice-over line, smaller, on a soft pill near the bottom. A long line pages through two lines at a time over
 * the scene (`length` seconds), each page shown for as long as its share of the words.
 */
function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, t: number, length: number, w: number, h: number, unit: number) {
  const size = Math.round(unit * 0.042);
  ctx.save();
  ctx.font = `600 ${size}px ${FONT}`;
  ctx.direction = isRtlText(text) ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pages = subtitlePages(wrapText(text, w * 0.8, (part) => ctx.measureText(part).width));
  const span = Math.max(0.5, length - SUBTITLE_IN - 0.15);
  const progress = (t - SUBTITLE_IN) / span;
  const page = pages.find((p) => progress < p.to) ?? pages[pages.length - 1];
  if (!page) {
    ctx.restore();
    return;
  }
  const shownAt = SUBTITLE_IN + page.from * span;
  ctx.globalAlpha = clamp01((t - shownAt) / (page.from === 0 ? 0.3 : 0.12));
  const lines = page.lines;
  const lineHeight = size * 1.4;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 0);
  const boxW = widest + size * 1.4;
  const boxH = lines.length * lineHeight + size * 0.8;
  const top = h * 0.8 - boxH / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect((w - boxW) / 2, top, boxW, boxH, boxH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, i) => ctx.fillText(line, w / 2, top + size * 0.4 + lineHeight * (i + 0.5)));
  ctx.restore();
}

/** Sets the font for `text`, made smaller if needed so that text plus `padding` fits in `maxWidth`; returns the size. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxWidth: number, padding: number): number {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const room = maxWidth - padding;
  const width = ctx.measureText(text).width;
  if (width <= room || width === 0) return size;
  const fitted = Math.max(10, Math.floor((size * room) / width));
  ctx.font = `${weight} ${fitted}px ${FONT}`;
  return fitted;
}

/**
 * Where the end card puts things: stacked on a tall (story) frame; side by side on square, 4:5 and landscape frames,
 * where a stack would not fit.
 */
function endCardLayout(w: number, h: number) {
  if (h / w > 1.3) {
    return { productX: w / 2, productY: h * 0.31, productW: w * 0.74, productH: h * 0.38, textX: w / 2, textY: h * 0.58, textW: w * 0.84 };
  }
  return { productX: w * 0.28, productY: h * 0.5, productW: w * 0.46, productH: h * 0.72, textX: w * 0.72, textY: h * 0.3, textW: w * 0.46 };
}

/** The closing card: the product floating on its own tone, the call to action, the price landing, the reassurances. */
function drawEndCard(ctx: CanvasRenderingContext2D, segment: Segment, t: number, assets: RenderAssets, w: number, h: number) {
  const unit = Math.min(w, h);
  const accent = assets.accent || DEFAULT_ACCENT;
  const index = segment.imageIndex;
  const layout = endCardLayout(w, h);
  ctx.fillStyle = (index !== null && assets.tones[index]) || '#141416';
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(layout.productX, layout.productY, 0, layout.productX, layout.productY, unit * 0.62);
  glow.addColorStop(0, 'rgba(255,255,255,0.16)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  if (index !== null && assets.images[index]) {
    const img = assets.images[index];
    const enter = easeOutCubic(t / 0.5);
    const s = Math.min(layout.productW / img.naturalWidth, layout.productH / img.naturalHeight) * (0.9 + 0.1 * enter);
    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const cx = layout.productX;
    const cy = layout.productY + Math.sin(t * 2.2) * unit * 0.008;
    ctx.save();
    ctx.globalAlpha = enter;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + ih / 2 + unit * 0.03, iw * 0.42, unit * 0.022, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(cx - iw / 2, cy - ih / 2, iw, ih, unit * 0.04);
    ctx.clip();
    ctx.drawImage(img, cx - iw / 2, cy - ih / 2, iw, ih);
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const x = layout.textX;
  let y = layout.textY;
  if (segment.price) {
    const slam = easeOutBack((t - 0.45) / 0.35);
    if (t > 0.45) {
      ctx.save();
      ctx.direction = isRtlText(segment.price) ? 'rtl' : 'ltr';
      const base = Math.round(unit * 0.12);
      const size = fitFont(ctx, segment.price, 900, base, layout.textW, base * 0.7);
      const pw = ctx.measureText(segment.price).width + size * 0.7;
      ctx.translate(x, y);
      ctx.scale(1.5 - 0.5 * slam, 1.5 - 0.5 * slam);
      ctx.globalAlpha = clamp01((t - 0.45) / 0.12);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(-pw / 2, -size * 0.66, pw, size * 1.32, size * 0.3);
      ctx.fill();
      ctx.fillStyle = inkOn(accent);
      ctx.fillText(segment.price, 0, size * 0.04);
      ctx.restore();
    }
    y += unit * 0.15;
  }
  // the call to action, as a button that gently breathes
  if (t > 0.2) {
    const rise = easeOutCubic((t - 0.2) / 0.4);
    ctx.save();
    ctx.globalAlpha = rise;
    ctx.direction = isRtlText(segment.caption) ? 'rtl' : 'ltr';
    const base = Math.round(unit * 0.062);
    const size = fitFont(ctx, segment.caption, 900, base, layout.textW, base * 2);
    const bw = ctx.measureText(segment.caption).width + size * 2;
    const bh = size * 2;
    const breathe = 1 + 0.03 * Math.sin(t * 5);
    ctx.translate(x, y + (1 - rise) * unit * 0.05);
    ctx.scale(breathe, breathe);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.fillText(segment.caption, 0, size * 0.04);
    ctx.restore();
    y += unit * 0.14;
  }
  (segment.badges ?? []).forEach((badge, i) => {
    const appear = clamp01((t - 0.75 - i * 0.12) / 0.3);
    if (!appear) return;
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.direction = isRtlText(badge) ? 'rtl' : 'ltr';
    const label = `✓  ${badge}`;
    const base = Math.round(unit * 0.038);
    const size = fitFont(ctx, label, 600, base, layout.textW, base * 1.6);
    const bw = ctx.measureText(label).width + size * 1.6;
    const bh = size * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x, y + size * 0.04);
    ctx.restore();
    y += unit * 0.085;
  });
}

/** One full frame of a segment at `local` seconds into it. */
function drawSegment(ctx: CanvasRenderingContext2D, segment: Segment, local: number, assets: RenderAssets, w: number, h: number) {
  const length = segment.end - segment.start;
  if (segment.kind === 'cta') {
    drawEndCard(ctx, segment, local, assets, w, h);
    return;
  }
  const unit = Math.min(w, h);
  drawFootage(ctx, segment, clamp01(local / length), assets, w, h);
  if (segment.caption) {
    const size = Math.round(unit * (isRtlText(segment.caption) ? 0.08 : 0.088));
    const centerY = captionAbovePhoto(segment, assets, w, h) ?? h * 0.6;
    drawCaption(ctx, segment.caption, local - 0.15, w, centerY, size, assets.accent || DEFAULT_ACCENT);
  }
  if (segment.subtitle) drawSubtitle(ctx, segment.subtitle, local, length, w, h, unit);
}

/** Paints the frame at `seconds` onto the canvas context. Between two scenes, the new one swipes up over the old. */
export function drawFrame(ctx: CanvasRenderingContext2D, timeline: Timeline, seconds: number, assets: RenderAssets): void {
  const { width: w, height: h } = ctx.canvas;
  const { segment, index } = frameAt(timeline, seconds);
  const local = Math.max(0, seconds - segment.start);
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (index > 0 && local < TRANSITION) {
    const previous = timeline.segments[index - 1];
    const p = easeOutCubic(local / TRANSITION);
    ctx.save();
    ctx.translate(0, -h * 0.35 * p);
    drawSegment(ctx, previous, previous.end - previous.start, assets, w, h);
    ctx.restore();
    ctx.save();
    ctx.translate(0, h * (1 - p));
    drawSegment(ctx, segment, local, assets, w, h);
    ctx.restore();
  } else {
    drawSegment(ctx, segment, local, assets, w, h);
  }
  ctx.restore();
}

/** True when this browser can record a canvas into a video. */
export function canRecordVideo(): boolean {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return false;
  if (typeof HTMLCanvasElement.prototype.captureStream !== 'function') return false;
  return pickRecorderMime((t) => MediaRecorder.isTypeSupported(t)) !== null;
}

let audioContext: AudioContext | null = null;
/** an element can be routed into the audio graph only once: its source node is kept for the next recordings */
const elementSources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

interface Soundtrack {
  stream: MediaStream;
  begin(): void;
  end(): void;
}

/**
 * The sound of the video: the AI clips' own soundtrack when the video has clips (each clip's sound is routed into
 * the recording, not to the speakers), otherwise the generated music. Null for a silent video.
 */
async function prepareSoundtrack(timeline: Timeline, assets: RenderAssets, music: boolean): Promise<Soundtrack | null> {
  const clips = (assets.clips ?? []).filter((c): c is HTMLVideoElement => c !== null);
  if (!clips.length && !music) return null;
  if (typeof AudioContext === 'undefined') return null;
  audioContext ??= new AudioContext();
  // created and resumed while the "create the video" click is still recent, as browsers require
  await audioContext.resume().catch(() => {});
  const ctx = audioContext;
  const destination = ctx.createMediaStreamDestination();

  if (clips.length) {
    for (const clip of clips) {
      let source = elementSources.get(clip);
      if (!source) {
        source = ctx.createMediaElementSource(clip);
        elementSources.set(clip, source);
      }
      source.connect(destination);
      clip.muted = false;
    }
    return {
      stream: destination.stream,
      begin() {},
      end() {
        for (const clip of clips) {
          clip.muted = true;
          elementSources.get(clip)?.disconnect();
        }
      },
    };
  }

  const cta = timeline.segments.find((s) => s.kind === 'cta');
  const plan = musicPlan(timeline.duration, {
    transitions: timeline.segments.slice(1).map((s) => s.start),
    impact: cta?.price ? cta.start + 0.45 : null,
  });
  const buffer = await renderMusic(plan);
  let node: AudioBufferSourceNode | null = null;
  return {
    stream: destination.stream,
    begin() {
      node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(destination);
      node.start();
    },
    end() {
      try { node?.stop(); } catch { /* already stopped */ }
      node?.disconnect();
    },
  };
}

/**
 * Plays the timeline on the canvas in real time while recording it, with its sound. Resolves with the video file.
 * The tab must stay visible: browsers slow down hidden tabs, which would stretch the video.
 */
export async function recordVideo(
  canvas: HTMLCanvasElement,
  timeline: Timeline,
  assets: RenderAssets,
  onProgress?: (fraction: number) => void,
  options: { music?: boolean } = {},
): Promise<Blob> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2D context unavailable');
  const soundtrack = await prepareSoundtrack(timeline, assets, options.music ?? true);
  const mimeType = pickRecorderMime((t) => MediaRecorder.isTypeSupported(t), Boolean(soundtrack));
  if (!mimeType) throw new Error('video recording is not supported in this browser');

  drawFrame(ctx, timeline, 0, assets);
  const picture = canvas.captureStream(30);
  const stream = new MediaStream([...picture.getVideoTracks(), ...(soundtrack?.stream.getAudioTracks() ?? [])]);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 160_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
  recorder.start(250);
  soundtrack?.begin();

  const startedAt = performance.now();
  let playing: HTMLVideoElement | null = null;
  let segmentIndex = -1;
  try {
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = (performance.now() - startedAt) / 1000;
        const now = frameAt(timeline, Math.min(t, timeline.duration));
        if (now.index !== segmentIndex) {
          segmentIndex = now.index;
          const next = clipFor(now.segment, assets);
          // each scene's clip starts from its first frame; on the end card the last clip keeps playing (its sound)
          if (next || now.segment.kind !== 'cta') {
            playing?.pause();
            playing = next;
            if (playing) { playing.currentTime = 0; playing.play().catch(() => {}); }
          }
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
  } finally {
    playing?.pause();
    soundtrack?.end();
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
  }
  return new Blob(chunks, { type: mimeType.split(';')[0] });
}
