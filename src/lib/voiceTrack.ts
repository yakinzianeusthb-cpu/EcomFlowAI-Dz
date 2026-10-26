/**
 * The voice-over track of the videos made in the browser: where each scene's voice starts in the timeline, the whole
 * voice-over rendered as one sound (to download), and that sound as a WAV file.
 */
import type { Timeline } from './videoTimeline';

/** the voice starts a beat after its scene, so the cut is not on the first syllable */
const VOICE_DELAY = 0.15;

/** When each scene's voice starts, for the scenes that have one (voices are given by scene, as in the script). */
export function voiceCues<T>(timeline: Timeline, voices: (T | null)[]): { voice: T; at: number }[] {
  return timeline.segments.flatMap((segment) => {
    const voice = segment.kind === 'scene' && segment.sceneIndex !== undefined ? voices[segment.sceneIndex] : null;
    return voice ? [{ voice, at: segment.start + VOICE_DELAY }] : [];
  });
}

interface PcmLike {
  numberOfChannels: number;
  sampleRate: number;
  length: number;
  getChannelData(channel: number): Float32Array;
}

/** A sound as a 16-bit PCM WAV file (the format every editor opens: CapCut, Premiere, TikTok…). */
export function encodeWav(sound: PcmLike): ArrayBuffer {
  const channels = sound.numberOfChannels;
  const dataBytes = sound.length * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + dataBytes));
  const write = (at: number, text: string) => [...text].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  write(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sound.sampleRate, true);
  view.setUint32(28, sound.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, dataBytes, true);
  const data = Array.from({ length: channels }, (_, c) => sound.getChannelData(c));
  let at = 44;
  for (let i = 0; i < sound.length; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(at, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      at += 2;
    }
  }
  return view.buffer;
}

/** The whole voice-over as one sound, each scene's voice at its place in the video (a browser-only call). */
export async function renderVoiceTrack(timeline: Timeline, voices: (AudioBuffer | null)[]): Promise<AudioBuffer> {
  const sampleRate = 44100;
  const context = new OfflineAudioContext(1, Math.ceil(timeline.duration * sampleRate), sampleRate);
  for (const { voice, at } of voiceCues(timeline, voices)) {
    const node = context.createBufferSource();
    node.buffer = voice;
    node.connect(context.destination);
    node.start(at);
  }
  return context.startRendering();
}
