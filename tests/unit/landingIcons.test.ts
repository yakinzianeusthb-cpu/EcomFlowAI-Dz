import { describe, expect, it } from 'vitest';
import { icon, iconsFor } from '../../src/lib/landingIcons';

describe('iconsFor', () => {
  it('pictures each feature by its words, in Arabic, French and English', () => {
    expect(iconsFor(['مقاومة للماء', 'بطارية تدوم 12 ساعة', 'Livraison rapide', 'Ultra léger', 'Natural ingredients'])).toEqual(['droplet', 'zap', 'truck', 'feather', 'leaf']);
    expect(iconsFor(['إضاءة LED قوية'])).toEqual(['sun']);
    expect(iconsFor(['مظهر احترافي يزيد من هيبتك'])).toEqual(['eye']);
  });

  it('falls back to a check mark when no words match', () => {
    expect(iconsFor(['إصدار محدود', 'Promo'])).toEqual(['check', 'check']);
  });

  it('does not take a word for one of its letters', () => {
    // "beau", "nouveau", "heureux", "revue" are no water, time or eye
    expect(iconsFor(['Un beau cadeau'])).toEqual(['gift']);
    expect(iconsFor(['Nouveau modèle'])).toEqual(['check']);
    expect(iconsFor(['Client heureux'])).toEqual(['check']);
    expect(iconsFor(['Revue de presse'])).toEqual(['check']);
  });

  it('gives a feature another of its icons when the best one is already used higher in the list', () => {
    // "ماكينة دقيقة تدوم لسنوات" lasts (shield) and is precise (clock): the shield is taken
    expect(iconsFor(['زجاج مقاوم للخدش', 'ماكينة دقيقة تدوم لسنوات'])).toEqual(['shield', 'clock']);
    // with nothing else to match, the same icon again rather than a meaningless one
    expect(iconsFor(['زجاج مقاوم للخدش', 'مادة تدوم'])).toEqual(['shield', 'shield']);
  });
});

describe('icon', () => {
  it('draws a decorative inline icon that screen readers skip', () => {
    expect(icon('droplet', 'x')).toMatch(/^<svg class="x" viewBox="0 0 24 24"[^>]* aria-hidden="true" focusable="false"><path d="M12 22a7/);
  });
});
