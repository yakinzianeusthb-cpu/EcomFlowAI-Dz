/**
 * The arithmetic behind the home page's 3D hero, kept free of three.js and the DOM so it can be tested:
 * easing curves, frame-rate independent smoothing, the scroll exit, the quality chosen for the device, and
 * where the layout puts the glass panel and the object.
 */

/** A CSS cubic-bezier() timing function, evaluated in JavaScript (solved for x, then read on y). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solveX = (x: number): number => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < 1e-7) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - error / slope));
    }
    // the slope was too flat for Newton's method: bisect instead
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 40; i++) {
      const value = sampleX(t);
      if (Math.abs(value - x) < 1e-7) break;
      if (value < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };

  return (time: number) => {
    if (time <= 0) return 0;
    if (time >= 1) return 1;
    return sampleY(solveX(time));
  };
}

/** The strong ease-out used for entrances (the same curve as the CSS token --ease-out). */
export const EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

/** Moves `current` toward `target`; the same total movement whatever the frame rate. `lambda` is the speed (1/s). */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return target + (current - target) * Math.exp(-lambda * dt);
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 while the hero's top is on screen, 1 once the hero has scrolled a full height away. */
export function scrollProgress(top: number, height: number): number {
  if (height <= 0) return 0;
  return clamp01(-top / height);
}

export interface DeviceInfo {
  width: number;
  coarsePointer: boolean;
  devicePixelRatio: number;
  /** navigator.hardwareConcurrency, when the browser tells */
  cores?: number;
  /** navigator.deviceMemory (GB), when the browser tells */
  memoryGb?: number;
}

export interface HeroQuality {
  /** the canvas resolution, as a multiple of CSS pixels */
  pixelRatio: number;
  /** real refractive glass (an extra render pass); otherwise polished chrome, which looks close and costs less */
  transmission: boolean;
  /** geometry detail */
  detail: 'high' | 'low';
}

/** What the device can afford: a phone or a weak machine gets a lighter picture, never a stuttering one. */
export function pickQuality(device: DeviceInfo): HeroQuality {
  const weak = (device.cores !== undefined && device.cores <= 2) || (device.memoryGb !== undefined && device.memoryGb <= 2);
  if (weak) return { pixelRatio: Math.min(device.devicePixelRatio, 1), transmission: false, detail: 'low' };
  const phone = device.coarsePointer || device.width < 768;
  if (phone) return { pixelRatio: Math.min(device.devicePixelRatio, 1.5), transmission: false, detail: 'low' };
  return { pixelRatio: Math.min(device.devicePixelRatio, 1.75), transmission: true, detail: 'high' };
}

/** Frames slower than about 45 per second lower the resolution by a fifth, never below `floor`. */
export function nextPixelRatio(current: number, averageFrameMs: number, floor: number): number {
  if (averageFrameMs > 22 && current > floor) return Math.max(floor, current * 0.8);
  return current;
}

/** The glass panel's horizontal extent, as fractions of the canvas width (0 = left edge). */
export function panelRange(panel: { left: number; right: number }, canvas: { left: number; width: number }): { start: number; end: number } {
  if (canvas.width <= 0) return { start: 0, end: 0 };
  return { start: clamp01((panel.left - canvas.left) / canvas.width), end: clamp01((panel.right - canvas.left) / canvas.width) };
}

interface Box { left: number; top: number; width: number; height: number }

/**
 * Where the layout wants the object: the centre of the anchor element in normalised device coordinates
 * (x to the right, y up, -1..1), and the size of the square that fits in it, as a share of the canvas height.
 * An anchor with no width is a vertical line: its height alone sets the size.
 */
export function anchorPoint(anchor: Box, canvas: Box): { x: number; y: number; size: number } {
  const cx = anchor.left + anchor.width / 2 - canvas.left;
  const cy = anchor.top + anchor.height / 2 - canvas.top;
  const side = anchor.width > 0 ? Math.min(anchor.width, anchor.height) : anchor.height;
  return {
    x: (cx / canvas.width) * 2 - 1,
    y: 1 - (cy / canvas.height) * 2,
    size: side / canvas.height,
  };
}
