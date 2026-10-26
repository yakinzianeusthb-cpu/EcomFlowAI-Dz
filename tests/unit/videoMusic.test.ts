import { describe, expect, it } from 'vitest';
import { MUSIC_BPM, midiToHz, musicPlan } from '../../src/lib/videoMusic';

const beat = 60 / MUSIC_BPM;

describe('musicPlan', () => {
  const plan = musicPlan(18, { transitions: [4, 9, 13], impact: 15 });

  it('keeps every sound inside the video', () => {
    for (const event of plan.events) {
      expect(event.time).toBeGreaterThanOrEqual(0);
      expect(event.time).toBeLessThan(18);
    }
  });

  it('puts a kick on every beat once the intro bar is over', () => {
    const kicks = plan.events.filter((e) => e.kind === 'kick').map((e) => e.time);
    expect(kicks[0]).toBeCloseTo(4 * beat, 4);
    for (let i = 1; i < kicks.length; i++) expect(kicks[i] - kicks[i - 1]).toBeCloseTo(beat, 4);
  });

  it('changes chord every bar, through a four-chord loop', () => {
    const chords = plan.events.filter((e) => e.kind === 'chord');
    expect(chords.length).toBe(Math.ceil(18 / (4 * beat)));
    expect(chords[4].notes).toEqual(chords[0].notes);
    expect(chords[1].notes).not.toEqual(chords[0].notes);
  });

  it('marks each scene change with a whoosh and the price with an impact', () => {
    expect(plan.events.filter((e) => e.kind === 'whoosh').map((e) => e.time)).toEqual([3.8, 8.8, 12.8]);
    expect(plan.events.filter((e) => e.kind === 'impact').map((e) => e.time)).toEqual([15]);
  });

  it('fades out at the end', () => {
    expect(plan.fadeOutAt).toBeCloseTo(18 - 1.2, 6);
  });

  it('is the same every time (no randomness in the music itself)', () => {
    expect(musicPlan(18, { transitions: [4, 9, 13], impact: 15 })).toEqual(plan);
  });

  it('handles a very short video', () => {
    const short = musicPlan(2, { transitions: [], impact: null });
    expect(short.events.length).toBeGreaterThan(0);
    expect(short.events.every((e) => e.time < 2)).toBe(true);
  });
});

describe('midiToHz', () => {
  it('gives concert pitch for A4', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });
});
