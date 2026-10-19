import { describe, expect, it } from 'vitest';
import { sectionImagePrompt } from '../../src/lib/landingImages';

describe('sectionImagePrompt', () => {
  it('uses the image prompt the copywriter AI wrote inside the code block', () => {
    const section = { title: 'Hero', prompt: '📸 SECTION 1/6 — HERO\n**Prompt (Image Generator) :**\n```\nWoman holding the blender in a bright kitchen\n```\n**CTA bouton :** "اطلب"' };
    const prompt = sectionImagePrompt(section);
    expect(prompt).toContain('Woman holding the blender in a bright kitchen');
    expect(prompt).not.toContain('CTA bouton');
  });

  it('falls back to the structured image description', () => {
    const prompt = sectionImagePrompt({ imagePrompt: { subject: 'The blender', environment: 'Modern kitchen', lighting: 'Soft daylight', composition: 'Centered' } });
    for (const part of ['The blender', 'Modern kitchen', 'Soft daylight', 'Centered']) expect(prompt).toContain(part);
  });

  it('still describes something useful from the title alone', () => {
    expect(sectionImagePrompt({ title: 'Livraison rapide' })).toContain('Livraison rapide');
  });

  it('always asks to keep the exact product of the photo and to add no text', () => {
    const prompt = sectionImagePrompt({ title: 'X' });
    expect(prompt).toMatch(/exact product/i);
    expect(prompt).toMatch(/no text/i);
  });

  it('stays a reasonable length', () => {
    expect(sectionImagePrompt({ prompt: '```\n' + 'x'.repeat(9000) + '\n```' }).length).toBeLessThanOrEqual(1800);
  });
});
