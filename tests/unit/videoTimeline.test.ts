import { describe, expect, it } from 'vitest';
import { CANVAS_SIZE, buildTimeline, frameAt, isRtlText, parseSceneSeconds, pickRecorderMime, subtitlePages, wrapText } from '../../src/lib/videoTimeline';

const NBSP = ' ';
const script = {
  scenes: [
    { time: '0-3s', step: 'Le Hook', overlay: 'التوصيل مجاني 🎁', audio: 'شوفي هاد المفرمة' },
    { time: '3-8s', step: 'Problème', overlay: 'Fini la fatigue', audio: 'Avant, je passais des heures' },
    { time: '8-20s', step: 'Démonstration', overlay: '', audio: '' },
  ],
  ctaSection: { ctaText: 'اطلب الآن', priceOnScreen: '2 900 DA', trustTriggers: ['الدفع عند الاستلام', 'توصيل 58 ولاية', 'ضمان', 'extra'] },
};

describe('parseSceneSeconds', () => {
  it('reads the length of a "start-end s" range', () => {
    expect(parseSceneSeconds('0-3s')).toBe(3);
    expect(parseSceneSeconds('3-6s')).toBe(3);
    expect(parseSceneSeconds('12 - 15 s')).toBe(3);
    expect(parseSceneSeconds('0-4.5s')).toBe(4.5);
  });

  it('returns null when there is no usable range', () => {
    expect(parseSceneSeconds('')).toBeNull();
    expect(parseSceneSeconds(undefined)).toBeNull();
    expect(parseSceneSeconds('intro')).toBeNull();
    expect(parseSceneSeconds('5-5s')).toBeNull();
    expect(parseSceneSeconds('8-3s')).toBeNull();
  });
});

describe('buildTimeline', () => {
  it('makes one segment per scene and a closing call-to-action card', () => {
    const tl = buildTimeline(script, { imageCount: 2 });
    expect(tl.segments.map((s) => s.kind)).toEqual(['scene', 'scene', 'scene', 'cta']);
  });

  it('uses the scene lengths from the script, kept between 2 and 6 seconds so a still photo never drags', () => {
    const tl = buildTimeline(script, { imageCount: 1 });
    expect(tl.segments.slice(0, 3).map((s) => s.end - s.start)).toEqual([3, 5, 6]);
  });

  it('gives scenes without a usable time a 3-second default', () => {
    const tl = buildTimeline({ scenes: [{ time: 'intro' }, {}] }, { imageCount: 1 });
    expect(tl.segments.slice(0, 2).map((s) => s.end - s.start)).toEqual([3, 3]);
  });

  it('places segments back to back and reports the total length', () => {
    const tl = buildTimeline(script, { imageCount: 1 });
    for (let i = 1; i < tl.segments.length; i++) expect(tl.segments[i].start).toBe(tl.segments[i - 1].end);
    expect(tl.duration).toBe(tl.segments.at(-1)!.end);
    expect(tl.duration).toBe(3 + 5 + 6 + 3);
  });

  it('remembers which scene of the script each segment shows, so an AI clip can replace its photo', () => {
    const tl = buildTimeline(script, { imageCount: 1 });
    expect(tl.segments.map((s) => s.sceneIndex)).toEqual([0, 1, 2, undefined]);
  });

  it('cycles through the photos and the camera moves', () => {
    const tl = buildTimeline(script, { imageCount: 2 });
    expect(tl.segments.slice(0, 3).map((s) => s.imageIndex)).toEqual([0, 1, 0]);
    const motions = tl.segments.slice(0, 3).map((s) => s.motion);
    expect(new Set(motions).size).toBe(3);
  });

  it('works without any photo (text on a coloured background)', () => {
    const tl = buildTimeline(script, { imageCount: 0 });
    expect(tl.segments.every((s) => s.imageIndex === null)).toBe(true);
  });

  it('carries the on-screen text and, when asked, the voice-over as subtitles', () => {
    const withSubs = buildTimeline(script, { imageCount: 1, subtitles: true });
    expect(withSubs.segments[0]).toMatchObject({ caption: 'التوصيل مجاني 🎁', subtitle: 'شوفي هاد المفرمة' });
    const without = buildTimeline(script, { imageCount: 1, subtitles: false });
    expect(without.segments[0].subtitle).toBe('');
  });

  it('builds the closing card from the script, with at most three trust badges', () => {
    const cta = buildTimeline(script, { imageCount: 1 }).segments.at(-1)!;
    expect(cta).toMatchObject({ kind: 'cta', caption: 'اطلب الآن', price: `2${NBSP}900 DA` });
    expect(cta.badges).toEqual(['الدفع عند الاستلام', 'توصيل 58 ولاية', 'ضمان']);
  });

  it('falls back to a price given by the form and a default call to action', () => {
    const cta = buildTimeline({ scenes: [{}] }, { imageCount: 1, price: '1 500 DA' }).segments.at(-1)!;
    expect(cta.caption).toBe('اطلب الآن');
    expect(cta.price).toBe(`1${NBSP}500 DA`);
  });

  it('keeps spaced numbers in one piece, so Arabic text never shows "900 2"', () => {
    const tl = buildTimeline(
      { scenes: [{ overlay: 'السعر 2 900 دج فقط', audio: 'غير ب 2 900 دج' }], ctaSection: { priceOnScreen: '2 900 دج', trustTriggers: ['أكثر من 1 200 زبون'] } },
      { imageCount: 1 },
    );
    expect(tl.segments[0]).toMatchObject({ caption: `السعر 2${NBSP}900 دج فقط`, subtitle: `غير ب 2${NBSP}900 دج` });
    expect(tl.segments[1]).toMatchObject({ price: `2${NBSP}900 دج`, badges: [`أكثر من 1${NBSP}200 زبون`] });
  });

  it('still makes a short video when the script has no scenes', () => {
    const tl = buildTimeline({}, { imageCount: 1 });
    expect(tl.segments.map((s) => s.kind)).toEqual(['cta']);
    expect(tl.duration).toBe(3);
  });
});

describe('frameAt', () => {
  const tl = buildTimeline(script, { imageCount: 1 });

  it('finds the segment playing at a moment and how far into it we are', () => {
    expect(frameAt(tl, 0)).toMatchObject({ index: 0, progress: 0 });
    expect(frameAt(tl, 1.5)).toMatchObject({ index: 0, progress: 0.5 });
    expect(frameAt(tl, 3)).toMatchObject({ index: 1, progress: 0 });
    expect(frameAt(tl, 15.5).segment.kind).toBe('cta');
  });

  it('stays on the last frame at and after the end', () => {
    expect(frameAt(tl, tl.duration)).toMatchObject({ index: tl.segments.length - 1, progress: 1 });
    expect(frameAt(tl, 999)).toMatchObject({ index: tl.segments.length - 1, progress: 1 });
  });

  it('treats negative times as the start', () => {
    expect(frameAt(tl, -2)).toMatchObject({ index: 0, progress: 0 });
  });
});

describe('isRtlText', () => {
  it('detects Arabic text', () => {
    expect(isRtlText('اطلب الآن')).toBe(true);
    expect(isRtlText('Commande 2 900 DA اطلب')).toBe(true);
    expect(isRtlText('Order now')).toBe(false);
    expect(isRtlText('')).toBe(false);
  });
});

describe('wrapText', () => {
  const measure = (s: string) => s.length * 10; // 10 px per character

  it('breaks a sentence into lines that fit', () => {
    expect(wrapText('un deux trois quatre', 110, measure)).toEqual(['un deux', 'trois', 'quatre']);
  });

  it('keeps a word longer than the line on its own line', () => {
    expect(wrapText('anticonstitutionnellement ok', 100, measure)).toEqual(['anticonstitutionnellement', 'ok']);
  });

  it('limits the number of lines and marks the cut', () => {
    expect(wrapText('a b c d e f', 10, measure, 2)).toEqual(['a', 'b…']);
  });

  it('returns nothing for empty text', () => {
    expect(wrapText('   ', 100, measure)).toEqual([]);
  });

  it('never breaks a line inside a number joined by no-break spaces', () => {
    expect(wrapText(`بـ 2${NBSP}900 دج فقط`, 60, measure)).toEqual(['بـ', `2${NBSP}900`, 'دج فقط']);
  });
});

describe('subtitlePages', () => {
  it('shows a short line as a single page for the whole scene', () => {
    expect(subtitlePages(['Livraison partout'])).toEqual([{ lines: ['Livraison partout'], from: 0, to: 1 }]);
  });

  it('pages through a long line two lines at a time instead of cutting it', () => {
    const pages = subtitlePages(['un deux trois', 'quatre cinq six', 'sept huit neuf', 'dix']);
    expect(pages.map((p) => p.lines)).toEqual([['un deux trois', 'quatre cinq six'], ['sept huit neuf', 'dix']]);
  });

  it('gives each page a share of the time that follows its number of words, ending at 1', () => {
    const pages = subtitlePages(['a b c', 'd e f', 'g h']);
    expect(pages[0]).toMatchObject({ from: 0, to: 0.75 });
    expect(pages[1]).toMatchObject({ from: 0.75, to: 1 });
  });

  it('returns no page for no text', () => {
    expect(subtitlePages([])).toEqual([]);
  });
});

describe('scene lengths from AI clips', () => {
  it('gives a scene the length of its clip, within limits, and keeps the script length elsewhere', () => {
    const timeline = buildTimeline(script, { imageCount: 1, sceneSeconds: [8.2, null, 30] });
    const scenes = timeline.segments.filter((s) => s.kind === 'scene');
    expect(scenes.map((s) => +(s.end - s.start).toFixed(2))).toEqual([8.2, 5, 10]);
  });
});

describe('scene lengths from the voice-over', () => {
  it('stretches a scene to its voice plus a short pause, never shortens one, and caps very long lines', () => {
    // scene 1 is 3 s in the script, scene 2 is 5 s, scene 3 is 6 s (12 s capped)
    const timeline = buildTimeline(script, { imageCount: 1, voiceSeconds: [4.1, 2, 40] });
    const scenes = timeline.segments.filter((s) => s.kind === 'scene');
    expect(scenes.map((s) => +(s.end - s.start).toFixed(2))).toEqual([4.5, 5, 15]);
  });

  it('lets a filmed clip and a voice share a scene: the longer of the two', () => {
    const timeline = buildTimeline(script, { imageCount: 1, sceneSeconds: [6, null, null], voiceSeconds: [7.6, null, null] });
    expect(+(timeline.segments[0].end - timeline.segments[0].start).toFixed(2)).toBe(8);
  });
});

describe('pickRecorderMime', () => {
  it('prefers MP4 when the browser can record it', () => {
    expect(pickRecorderMime((t) => t.startsWith('video/mp4'))).toMatch(/^video\/mp4/);
  });

  it('asks for a format with an audio codec when the video has sound', () => {
    expect(pickRecorderMime(() => true, true)).toBe('video/mp4;codecs=avc1.42E01E,mp4a.40.2');
    expect(pickRecorderMime((t) => t.startsWith('video/webm'), true)).toBe('video/webm;codecs=vp9,opus');
  });

  it('falls back to WebM', () => {
    expect(pickRecorderMime((t) => t.startsWith('video/webm'))).toMatch(/^video\/webm/);
  });

  it('returns null when nothing is supported', () => {
    expect(pickRecorderMime(() => false)).toBeNull();
  });
});

describe('CANVAS_SIZE', () => {
  it('has a frame size for every format the video tool offers', () => {
    expect(CANVAS_SIZE['9:16']).toEqual({ width: 720, height: 1280 });
    expect(CANVAS_SIZE['16:9']).toEqual({ width: 1280, height: 720 });
    expect(CANVAS_SIZE['1:1']).toEqual({ width: 720, height: 720 });
    expect(CANVAS_SIZE['4:5']).toEqual({ width: 720, height: 900 });
  });
});
