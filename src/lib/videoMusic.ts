/**
 * Background music for the videos made in the browser, synthesised on the spot: no audio file, no licence question.
 * An upbeat four-on-the-floor loop in A minor (Am, F, C, G) with a pulsing bass, soft chords that duck under the
 * kick, a light lead after the intro, a whoosh at each scene change and an impact when the price appears.
 * `musicPlan` decides every note (pure, tested); `renderMusic` turns the plan into sound with an OfflineAudioContext.
 */

export const MUSIC_BPM = 116;
const BEAT = 60 / MUSIC_BPM;
const BAR = 4 * BEAT;
const FADE_OUT = 1.2;
/** the four chords of the loop, as MIDI notes (A3 C4 E4, F3 A3 C4, C4 E4 G4, G3 B3 D4) and their bass roots */
const CHORDS = [
  { notes: [57, 60, 64], root: 45 },
  { notes: [53, 57, 60], root: 41 },
  { notes: [60, 64, 67], root: 48 },
  { notes: [55, 59, 62], root: 43 },
];

export type MusicEvent =
  | { kind: 'kick' | 'clap' | 'hat' | 'whoosh' | 'impact'; time: number; open?: boolean }
  | { kind: 'chord'; time: number; notes: number[]; length: number }
  | { kind: 'bass' | 'lead'; time: number; note: number; length: number };

export interface MusicPlan {
  duration: number;
  events: MusicEvent[];
  fadeOutAt: number;
}

export const midiToHz = (note: number) => 440 * 2 ** ((note - 69) / 12);

/**
 * Every sound of the track for a video of `duration` seconds. The first bar is an intro (chords, hats and bass only);
 * the kick starts on bar two. `transitions` are the scene changes (a whoosh lands just before each), `impact` the
 * moment the price appears.
 */
export function musicPlan(duration: number, cues: { transitions: number[]; impact: number | null }): MusicPlan {
  const events: MusicEvent[] = [];
  const inside = (time: number) => time >= 0 && time < duration;
  const bars = Math.ceil(duration / BAR);
  for (let bar = 0; bar < bars; bar++) {
    const start = bar * BAR;
    const chord = CHORDS[bar % CHORDS.length];
    events.push({ kind: 'chord', time: start, notes: chord.notes, length: BAR });
    for (let beat = 0; beat < 4; beat++) {
      const time = start + beat * BEAT;
      if (bar > 0) events.push({ kind: 'kick', time });
      if (bar > 0 && (beat === 1 || beat === 3)) events.push({ kind: 'clap', time });
      events.push({ kind: 'hat', time: time + BEAT / 2, open: beat === 3 });
    }
    for (let eighth = 0; eighth < 8; eighth++) {
      events.push({ kind: 'bass', time: start + eighth * (BEAT / 2), note: chord.root, length: BEAT / 2.4 });
    }
    // a light arpeggio from the third bar: the chord's notes an octave up, on the off-beat sixteenths
    if (bar >= 2) {
      for (let step = 0; step < 8; step++) {
        const note = chord.notes[step % chord.notes.length] + 12;
        events.push({ kind: 'lead', time: start + step * (BEAT / 2) + BEAT / 4, note, length: BEAT / 4 });
      }
    }
  }
  for (const t of cues.transitions) events.push({ kind: 'whoosh', time: +(t - 0.2).toFixed(4) });
  if (cues.impact !== null) events.push({ kind: 'impact', time: cues.impact });
  return {
    duration,
    events: events.filter((e) => inside(e.time)).sort((a, b) => a.time - b.time),
    fadeOutAt: Math.max(0, duration - FADE_OUT),
  };
}

/** Plays the plan into an offline context and returns the finished track (stereo, 44.1 kHz). Browser only. */
export async function renderMusic(plan: MusicPlan): Promise<AudioBuffer> {
  const rate = 44_100;
  const ctx = new OfflineAudioContext(2, Math.ceil((plan.duration + 0.05) * rate), rate);

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, 0);
  master.gain.exponentialRampToValueAtTime(0.68, 0.15);
  master.gain.setValueAtTime(0.68, plan.fadeOutAt);
  master.gain.linearRampToValueAtTime(0.0001, plan.duration);
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.005;
  compressor.release.value = 0.12;
  master.connect(compressor).connect(ctx.destination);

  // the chords and the lead go through a bus that dips after each kick (the "pumping" of dance music)
  const music = ctx.createGain();
  music.connect(master);

  const noise = ctx.createBuffer(1, rate, rate);
  const data = noise.getChannelData(0);
  // a fixed seed: the same noise every render
  let seed = 7;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  const noiseSource = (time: number, length: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.start(time, 0, length);
    return src;
  };
  const envelope = (node: GainNode, time: number, peak: number, attack: number, decay: number) => {
    node.gain.setValueAtTime(0.0001, time);
    node.gain.exponentialRampToValueAtTime(peak, time + attack);
    node.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
  };

  for (const event of plan.events) {
    const t = event.time;
    switch (event.kind) {
      case 'kick': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
        envelope(gain, t, 0.9, 0.003, 0.3);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + 0.35);
        music.gain.setValueAtTime(0.45, t);
        music.gain.linearRampToValueAtTime(1, t + BEAT * 0.75);
        break;
      }
      case 'clap': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1600;
        filter.Q.value = 0.9;
        const gain = ctx.createGain();
        envelope(gain, t, 0.35, 0.002, 0.18);
        noiseSource(t, 0.22).connect(filter).connect(gain).connect(master);
        break;
      }
      case 'hat': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7500;
        const gain = ctx.createGain();
        envelope(gain, t, event.open ? 0.12 : 0.08, 0.001, event.open ? 0.18 : 0.05);
        noiseSource(t, 0.25).connect(filter).connect(gain).connect(master);
        break;
      }
      case 'chord': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1300;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
        gain.gain.setValueAtTime(0.07, t + event.length - 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + event.length);
        filter.connect(gain).connect(music);
        for (const note of event.notes) {
          for (const detune of [-7, 7]) {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = midiToHz(note);
            osc.detune.value = detune;
            osc.connect(filter);
            osc.start(t);
            osc.stop(t + event.length);
          }
        }
        break;
      }
      case 'bass': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = midiToHz(event.note);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 420;
        const gain = ctx.createGain();
        envelope(gain, t, 0.28, 0.005, event.length);
        osc.connect(filter).connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + event.length + 0.05);
        break;
      }
      case 'lead': {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = midiToHz(event.note);
        const gain = ctx.createGain();
        envelope(gain, t, 0.06, 0.004, event.length * 1.6);
        osc.connect(gain).connect(music);
        osc.start(t);
        osc.stop(t + event.length * 2);
        break;
      }
      case 'whoosh': {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.2;
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(4000, t + 0.4);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.22, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        noiseSource(t, 0.5).connect(filter).connect(gain).connect(master);
        break;
      }
      case 'impact': {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(90, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
        const gain = ctx.createGain();
        envelope(gain, t, 0.7, 0.004, 0.7);
        osc.connect(gain).connect(master);
        osc.start(t);
        osc.stop(t + 0.8);
        break;
      }
    }
  }
  return ctx.startRendering();
}
