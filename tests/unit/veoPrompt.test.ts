import { describe, expect, it } from 'vitest';
import { buildScenePrompt } from '../../src/lib/veoPrompt';

describe('buildScenePrompt', () => {
  const scene = { visual: 'Plan serré sur une femme qui coupe des légumes avec le hachoir', actorDirection: 'Sourit, montre le résultat à la caméra', overlay: 'التوصيل مجاني' };

  it('describes the scene, the action and the product', () => {
    const prompt = buildScenePrompt(scene, { productName: 'Hachoir Pro', format: '9:16' });
    expect(prompt).toContain('Plan serré sur une femme qui coupe des légumes avec le hachoir');
    expect(prompt).toContain('Sourit, montre le résultat à la caméra');
    expect(prompt).toContain('Hachoir Pro');
  });

  it('asks for a vertical phone video, or a landscape one for 16:9', () => {
    expect(buildScenePrompt(scene, { productName: 'X', format: '9:16' })).toMatch(/vertical/i);
    expect(buildScenePrompt(scene, { productName: 'X', format: '16:9' })).toMatch(/landscape/i);
  });

  it('asks for no text in the picture, since the video maker adds the captions itself', () => {
    expect(buildScenePrompt(scene, { productName: 'X', format: '9:16' })).toMatch(/no (on-screen )?text/i);
    expect(buildScenePrompt(scene, { productName: 'X', format: '9:16' })).not.toContain('التوصيل مجاني');
  });

  it('still makes a usable description for an empty scene', () => {
    const prompt = buildScenePrompt({}, { productName: 'Lampe LED', format: '9:16' });
    expect(prompt).toContain('Lampe LED');
    expect(prompt.length).toBeGreaterThan(20);
  });

  it('stays under the 2000 characters the server accepts', () => {
    expect(buildScenePrompt({ visual: 'x'.repeat(5000) }, { productName: 'X', format: '9:16' }).length).toBeLessThanOrEqual(2000);
  });
});
