import { describe, expect, it } from 'vitest';
import { encodeWav, voiceCues } from '../../src/lib/voiceTrack';
import type { Timeline } from '../../src/lib/videoTimeline';

const pcm = (channels: number[][], sampleRate: number) => ({
  numberOfChannels: channels.length,
  sampleRate,
  length: channels[0].length,
  getChannelData: (c: number) => Float32Array.from(channels[c]),
});

describe('encodeWav', () => {
  it('writes a 16-bit PCM WAV header and the samples, interleaved and clamped', () => {
    const view = new DataView(encodeWav(pcm([[0, 1, -1, 2], [0.5, -0.5, 0, -2]], 24000)));
    const text = (at: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(at + i)));
    expect(text(0)).toBe('RIFF');
    expect(text(8)).toBe('WAVE');
    expect(text(36)).toBe('data');
    expect(view.getUint32(4, true)).toBe(36 + 16);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(2); // channels
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint32(28, true)).toBe(24000 * 4); // bytes per second
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(16);
    const samples = Array.from({ length: 8 }, (_, i) => view.getInt16(44 + i * 2, true));
    expect(samples).toEqual([0, 16383, 32767, -16384, -32768, 0, 32767, -32768]);
  });
});

describe('voiceCues', () => {
  it('starts each scene\'s voice at its scene, a beat in, and skips scenes without one', () => {
    const timeline: Timeline = {
      duration: 12,
      segments: [
        { kind: 'scene', sceneIndex: 0, start: 0, end: 4, imageIndex: 0, motion: 'zoom-in', caption: '', subtitle: '' },
        { kind: 'scene', sceneIndex: 1, start: 4, end: 9, imageIndex: 0, motion: 'pan-left', caption: '', subtitle: '' },
        { kind: 'cta', start: 9, end: 12, imageIndex: 0, motion: 'zoom-out', caption: '', subtitle: '' },
      ],
    };
    expect(voiceCues(timeline, ['a', null])).toEqual([{ voice: 'a', at: 0.15 }]);
    expect(voiceCues(timeline, ['a', 'b'])).toEqual([{ voice: 'a', at: 0.15 }, { voice: 'b', at: 4.15 }]);
  });
});
