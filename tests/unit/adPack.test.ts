import { describe, expect, it } from 'vitest';
import { AD_CTAS, AD_LIMITS, buildAdPackPrompt, normalizeAdPack } from '../../src/lib/adPack';

const brief = {
  name: 'Lampe', productName: 'Lampe LED rechargeable', description: 'Autonomie 12 h', audience: 'Familles', objective: 'sales' as const,
  tone: 'Chaleureux', platforms: ['facebook' as const, 'instagram' as const], language: 'ar' as const, price: '2 900 DA',
};

describe('buildAdPackPrompt', () => {
  it('gives the AI the product facts, the language and how many concepts to write', () => {
    const prompt = buildAdPackPrompt(brief, { brandName: 'Lumina', colors: [], tone: '', audience: '', instructions: 'Jamais de rouge', styles: [] }, 4);
    for (const text of ['Lampe LED rechargeable', 'Autonomie 12 h', '2 900 DA', 'Familles', 'Lumina', 'Jamais de rouge', 'Darija', '4 concepts', 'facebook, instagram']) {
      expect(prompt, text).toContain(text);
    }
    expect(prompt).not.toMatch(/undefined|null/);
  });

  it('asks for honest copy only', () => {
    const prompt = buildAdPackPrompt(brief, null, 3);
    expect(prompt).toMatch(/faux avis/);
    expect(prompt).toContain(AD_CTAS.join(', '));
  });
});

describe('normalizeAdPack', () => {
  const concept = { angle: 'Problème / solution', hook: 'Coupure de courant ?', primaryText: 'Fini le noir.', headline: 'Lumière 12 h', description: 'Livraison 58 wilayas', callToAction: 'ORDER_NOW', overlay: 'Jamais dans le noir', audience: 'Familles' };

  it('keeps well-formed concepts and numbers them', () => {
    const pack = normalizeAdPack({ concepts: [concept, { ...concept, angle: 'Offre' }], audiences: ['Familles'], testPlan: ['Tester 2 accroches'] });
    expect(pack.concepts.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(pack.concepts[0]).toMatchObject({ headline: 'Lumière 12 h', callToAction: 'ORDER_NOW', overlay: 'Jamais dans le noir' });
    expect(pack).toMatchObject({ audiences: ['Familles'], testPlan: ['Tester 2 accroches'] });
  });

  it('replaces a call to action Meta does not know', () => {
    expect(normalizeAdPack({ concepts: [{ ...concept, callToAction: 'CLICK_HERE_NOW' }] }).concepts[0].callToAction).toBe('SHOP_NOW');
  });

  it('drops concepts without copy and refuses an empty answer', () => {
    expect(normalizeAdPack({ concepts: [concept, { angle: 'vide' }] }).concepts).toHaveLength(1);
    expect(() => normalizeAdPack({ concepts: [] })).toThrow();
    expect(() => normalizeAdPack('nonsense')).toThrow();
  });

  it('caps every field so nothing overflows a placement', () => {
    const long = normalizeAdPack({ concepts: [{ ...concept, headline: 'x'.repeat(500), primaryText: 'y'.repeat(5000), overlay: 'z'.repeat(300) }] }).concepts[0];
    expect(long.headline.length).toBeLessThanOrEqual(AD_LIMITS.headline.max);
    expect(long.primaryText.length).toBeLessThanOrEqual(AD_LIMITS.primaryText.max);
    expect(long.overlay.length).toBeLessThanOrEqual(AD_LIMITS.overlay.max);
  });

  it('accepts a single concept object or a bare list, as models sometimes answer', () => {
    expect(normalizeAdPack([concept]).concepts).toHaveLength(1);
    expect(normalizeAdPack({ concepts: concept }).concepts).toHaveLength(1);
  });
});
