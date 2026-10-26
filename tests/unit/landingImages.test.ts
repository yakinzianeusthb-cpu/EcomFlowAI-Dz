import { describe, expect, it } from 'vitest';
import { posterAspect, posterImagePrompt, sectionImagePrompt } from '../../src/lib/landingImages';

describe('posterImagePrompt', () => {
  const section = { title: 'Hero', prompt: '```\nA man wearing the watch at a café terrace, golden hour\n```' };
  const text = { headline: 'زيد في هيبتك', subline: 'ساعة الفخامة السوداء', labels: ['مقاومة للخدش', 'ستانلس ستيل', 'دقة متناهية'], button: 'اطلب الآن' };
  const prompt = posterImagePrompt(section, text, { language: 'ar', hero: true, colors: ['#1a1a1a', '#d4af37'] });

  it('draws the section\'s own words into a vertical poster, exactly', () => {
    for (const words of ['"زيد في هيبتك"', '"ساعة الفخامة السوداء"', '"مقاومة للخدش"', '"ستانلس ستيل"', '"دقة متناهية"', '"اطلب الآن"']) expect(prompt).toContain(words);
    expect(prompt).toMatch(/exactly/i);
    expect(prompt).toMatch(/right to left/i);
  });

  it('makes the opening poster taller than the others, like the long images of the shops', () => {
    expect(posterAspect(true)).toBe('2:3');
    expect(posterAspect(false)).toBe('4:5');
    expect(prompt).toContain('A vertical advertising poster (2:3)');
    expect(posterImagePrompt(section, text, { language: 'ar', hero: false, colors: [] })).toContain('A vertical advertising poster (4:5)');
  });

  it('gives every poster the same look and edges that join, so the stacked posters read as one long image', () => {
    expect(prompt).toMatch(/one continuous image/i);
    expect(prompt).toMatch(/no frame, no border, no rounded corners/);
    expect(prompt).toContain('#1a1a1a');
    expect(prompt).toContain('#d4af37');
  });

  it('asks for large text only: small Arabic text comes out garbled', () => {
    expect(prompt).toMatch(/no small print/i);
  });

  it('keeps the scene the copywriter AI described and the exact product of the photo', () => {
    expect(prompt).toContain('A man wearing the watch at a café terrace');
    expect(prompt).toMatch(/exact product/i);
  });

  it('forbids every word nobody vouched for: prices, customer counts, ratings, reviews', () => {
    expect(prompt).toMatch(/no other (words|text)/i);
    for (const banned of ['prices', 'customer counts', 'ratings', 'stars', 'reviews', 'logos']) expect(prompt).toContain(banned);
  });

  it('opens the page with a hero poster, and frames the others as sections', () => {
    expect(prompt).toMatch(/the opening of a long landing-page image/);
    expect(prompt).toMatch(/a person using the product/);
    const other = posterImagePrompt(section, text, { language: 'ar', hero: false, colors: [] });
    expect(other).toMatch(/one section of a long landing-page image/);
    expect(other).toMatch(/a collage of 2 or 3 photos/);
  });

  it('writes French posters in French, and leaves out what a section has not got', () => {
    const fr = posterImagePrompt({ title: 'Livraison' }, { headline: 'Fini la fatigue', labels: [], button: 'Commander' }, { language: 'fr', hero: false, colors: [] });
    expect(fr).toMatch(/in French/);
    expect(fr).not.toMatch(/right to left/i);
    expect(fr).not.toMatch(/feature labels/);
    expect(fr).not.toMatch(/white pill/);
  });

  it('drops quotes from the words and keeps them short, so the prompt stays well formed', () => {
    const long = posterImagePrompt({}, { headline: 'Le "meilleur" « produit » ' + 'x'.repeat(200), labels: ['a'.repeat(80)], button: 'Go' }, { language: 'fr', hero: false, colors: [] });
    expect(long).not.toContain('"meilleur"');
    expect(long).not.toContain('«');
    expect(long.length).toBeLessThanOrEqual(2400);
  });
});

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
