import { describe, expect, it } from 'vitest';
import { sceneToText, scriptToText, type ScriptTextLabels } from '../../src/lib/videoScriptText';

const labels: ScriptTextLabels = {
  scene: (n) => `Scene ${n}`,
  visual: 'Visuals & staging',
  actor: 'Actor / creator directions',
  voice: 'Voice-over (Darija / Arabic)',
  franco: 'Phonetic reading (Franco-Arabic)',
  overlay: 'On-screen text:',
};

const hook = {
  step: 'The hook',
  time: '0-3s',
  visual: 'Close-up of the brush in wet hair',
  actorDirection: 'Smile, look at the camera',
  audio: 'شعرك ناعم في 10 دقايق',
  audioFranco: 'Cha3rek na3em f 10 dqayeq',
  overlay: '10 minutes!',
  sfxMusic: 'Whoosh',
};

describe('sceneToText', () => {
  it('puts the four parts of a scene in one text, each under its heading, with the title and timing', () => {
    expect(sceneToText(hook, 0, labels)).toBe([
      'Scene 1 — The hook (0-3s)',
      '',
      'Visuals & staging:',
      'Close-up of the brush in wet hair',
      '',
      'Actor / creator directions:',
      'Smile, look at the camera',
      '',
      'Voice-over (Darija / Arabic):',
      'شعرك ناعم في 10 دقايق',
      '',
      'Phonetic reading (Franco-Arabic):',
      'Cha3rek na3em f 10 dqayeq',
      '',
      'On-screen text: 10 minutes!',
      'SFX: Whoosh',
    ].join('\n'));
  });

  it('leaves out the parts that are empty, and a title or timing that is missing', () => {
    expect(sceneToText({ visual: '  Product on a table ', audio: '' }, 2, labels)).toBe('Scene 3\n\nVisuals & staging:\nProduct on a table');
  });
});

describe('scriptToText', () => {
  it('gives the whole script: its title, then every scene in order', () => {
    const text = scriptToText({ title: 'Straightening brush', scenes: [hook, { step: 'Offer', visual: 'Price on screen' }] }, labels);
    expect(text.startsWith('Straightening brush\n\nScene 1 — The hook (0-3s)')).toBe(true);
    expect(text.endsWith('Scene 2 — Offer\n\nVisuals & staging:\nPrice on screen')).toBe(true);
    expect(text.split('\n\n\n')).toHaveLength(2);
  });

  it('copes with a script without a title or scenes', () => {
    expect(scriptToText({}, labels)).toBe('');
    expect(scriptToText({ title: 'Only a title' }, labels)).toBe('Only a title');
  });
});
