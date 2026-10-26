import { describe, expect, it } from 'vitest';
import { buildScenePrompt } from '../../src/lib/aiVideoPrompt';

describe('buildScenePrompt', () => {
  const scene = { visual: 'Plan serré sur une femme qui coupe des légumes avec le hachoir', actorDirection: 'Sourit, montre le résultat à la caméra', overlay: 'التوصيل مجاني' };
  const base = { productName: 'Hachoir Pro', format: '9:16' };

  it('describes the scene, the action and the product', () => {
    const prompt = buildScenePrompt(scene, base);
    expect(prompt).toContain('Plan serré sur une femme qui coupe des légumes avec le hachoir');
    expect(prompt).toContain('Sourit, montre le résultat à la caméra');
    expect(prompt).toContain('Hachoir Pro');
  });

  it('asks for a vertical phone video, or a landscape one for 16:9', () => {
    expect(buildScenePrompt(scene, { productName: 'X', format: '9:16' })).toMatch(/vertical/i);
    expect(buildScenePrompt(scene, { productName: 'X', format: '16:9' })).toMatch(/landscape/i);
  });

  it('asks for a premium commercial look that keeps the product exactly as in the photo', () => {
    const prompt = buildScenePrompt(scene, base);
    expect(prompt).toMatch(/commercial/i);
    expect(prompt).toMatch(/exactly as in the photo/i);
  });

  it('gives each shot its role: the first grabs attention, the last ends on the product', () => {
    expect(buildScenePrompt(scene, { ...base, index: 0, total: 3 })).toMatch(/opening shot/i);
    expect(buildScenePrompt(scene, { ...base, index: 1, total: 3 })).toMatch(/in use/i);
    expect(buildScenePrompt(scene, { ...base, index: 2, total: 3 })).toMatch(/final shot/i);
  });

  it('asks for music and sound effects, but no voice (the captions carry the words, in any language)', () => {
    const prompt = buildScenePrompt(scene, base);
    expect(prompt).toMatch(/music/i);
    expect(prompt).toMatch(/no voice/i);
  });

  it('says how long the shot is', () => {
    expect(buildScenePrompt(scene, { ...base, durationSeconds: 6 })).toMatch(/about 6 seconds/i);
    expect(buildScenePrompt(scene, base)).toMatch(/about 8 seconds/i);
  });

  it('asks for no text in the picture, since the video maker adds the captions itself', () => {
    expect(buildScenePrompt(scene, base)).toMatch(/no (on-screen )?text/i);
    expect(buildScenePrompt(scene, base)).not.toContain('التوصيل مجاني');
  });

  it('still makes a usable description for an empty scene', () => {
    const prompt = buildScenePrompt({}, { productName: 'Lampe LED', format: '9:16' });
    expect(prompt).toContain('Lampe LED');
    expect(prompt.length).toBeGreaterThan(20);
  });

  it('stays under the 2000 characters the server accepts', () => {
    expect(buildScenePrompt({ visual: 'x'.repeat(5000), actorDirection: 'y'.repeat(5000) }, { ...base, index: 0, total: 3 }).length).toBeLessThanOrEqual(2000);
  });
});
