/**
 * Turns a generated video script into a timeline the in-browser video maker can draw, frame by frame.
 * Pure functions only: the drawing and recording live in components/VideoMaker.tsx.
 */

import { keepNumbersTogether } from './numberSpacing';

export type VideoFormat = '9:16' | '1:1' | '4:5' | '16:9';
export type Motion = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

/** Frame size per format. 720 px on the short side keeps real-time recording smooth on ordinary laptops and phones. */
export const CANVAS_SIZE: Record<VideoFormat, { width: number; height: number }> = {
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 720, height: 720 },
  '4:5': { width: 720, height: 900 },
  '16:9': { width: 1280, height: 720 },
};

export interface ScriptScene {
  time?: string;
  step?: string;
  overlay?: string;
  audio?: string;
  /** What the camera shows and what the actor does (used to film the scene with AI). */
  visual?: string;
  actorDirection?: string;
}

export interface VideoScript {
  scenes?: ScriptScene[];
  ctaSection?: { ctaText?: string; priceOnScreen?: string; trustTriggers?: string[] };
}

export interface Segment {
  kind: 'scene' | 'cta';
  /** Position of the scene in the script (scene segments only), to find its AI clip. */
  sceneIndex?: number;
  start: number;
  end: number;
  /** Which photo to show, cycling through the ones provided; null when there is none. */
  imageIndex: number | null;
  motion: Motion;
  /** Big on-screen text (the scene's overlay, or the call to action on the closing card). */
  caption: string;
  /** Smaller text at the bottom: the voice-over line, when subtitles are on. */
  subtitle: string;
  price?: string;
  badges?: string[];
}

export interface Timeline {
  segments: Segment[];
  duration: number;
}

const MIN_SCENE = 2;
const MAX_SCENE = 6;
const DEFAULT_SCENE = 3;
const CTA_SECONDS = 3;
const MOTIONS: Motion[] = ['zoom-in', 'pan-left', 'zoom-out', 'pan-right'];
const DEFAULT_CTA = 'اطلب الآن';

/** Length in seconds of a "start-end s" range such as "3-6s"; null when absent or not a forward range. */
export function parseSceneSeconds(time: string | undefined): number | null {
  const match = /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/.exec(time ?? '');
  if (!match) return null;
  const length = Number(match[2]) - Number(match[1]);
  return length > 0 ? length : null;
}

// spaced numbers are joined so Arabic captions never show "900 2"
const clean = (text: string | undefined) => keepNumbersTogether((text ?? '').trim());

export function buildTimeline(
  script: VideoScript,
  options: { imageCount: number; subtitles?: boolean; price?: string },
): Timeline {
  const { imageCount, subtitles = true } = options;
  const segments: Segment[] = [];
  let cursor = 0;

  (script.scenes ?? []).forEach((scene, i) => {
    const seconds = Math.min(MAX_SCENE, Math.max(MIN_SCENE, parseSceneSeconds(scene.time) ?? DEFAULT_SCENE));
    segments.push({
      kind: 'scene',
      sceneIndex: i,
      start: cursor,
      end: cursor + seconds,
      imageIndex: imageCount > 0 ? i % imageCount : null,
      motion: MOTIONS[i % MOTIONS.length],
      caption: clean(scene.overlay),
      subtitle: subtitles ? clean(scene.audio) : '',
    });
    cursor += seconds;
  });

  const cta = script.ctaSection ?? {};
  segments.push({
    kind: 'cta',
    start: cursor,
    end: cursor + CTA_SECONDS,
    imageIndex: imageCount > 0 ? 0 : null,
    motion: 'zoom-out',
    caption: clean(cta.ctaText) || DEFAULT_CTA,
    subtitle: '',
    price: clean(cta.priceOnScreen) || clean(options.price),
    badges: (cta.trustTriggers ?? []).map(clean).filter(Boolean).slice(0, 3),
  });
  cursor += CTA_SECONDS;

  return { segments, duration: cursor };
}

/** The segment shown at `seconds`, and how far through it we are (0..1). Clamped to the start and the end. */
export function frameAt(timeline: Timeline, seconds: number): { segment: Segment; index: number; progress: number } {
  const { segments } = timeline;
  const t = Math.max(0, seconds);
  if (t >= timeline.duration) return { segment: segments[segments.length - 1], index: segments.length - 1, progress: 1 };
  const index = Math.max(0, segments.findIndex((s) => t >= s.start && t < s.end));
  const segment = segments[index];
  return { segment, index, progress: (t - segment.start) / (segment.end - segment.start) };
}

/** True when the text contains Arabic letters, so it is drawn right-to-left. */
export function isRtlText(text: string): boolean {
  return /[؀-ۿݐ-ݿ]/.test(text);
}

/**
 * Splits text into lines no wider than `maxWidth`, measured by `measure` (the canvas's measureText in the app).
 * A word wider than the line keeps its own line. With `maxLines`, extra text is cut and the last line ends with "…".
 */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number, maxLines = Infinity): string[] {
  // any space except the no-break ones, which hold a number together
  const words = text.trim().split(/[^\S  ]+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]}…`;
    return kept;
  }
  return lines;
}

const RECORDER_TYPES = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

/** The best video format this browser can record (MP4 plays everywhere, WebM is the fallback). */
export function pickRecorderMime(isSupported: (type: string) => boolean): string | null {
  return RECORDER_TYPES.find((type) => isSupported(type)) ?? null;
}
