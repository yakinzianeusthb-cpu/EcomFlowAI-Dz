import { describe, expect, it } from 'vitest';
import { AD_FORMATS, AD_TEMPLATES, STORY_SAFE_ZONE, creativeLayout, ctaLabel, readableTextOn, templateFor } from '../../src/lib/adCreative';

const inside = (r: { x: number; y: number; w: number; h: number }, W: number, H: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H && r.w > 0 && r.h > 0;

describe('creativeLayout', () => {
  for (const format of Object.keys(AD_FORMATS) as (keyof typeof AD_FORMATS)[]) {
    for (const template of AD_TEMPLATES) {
      it(`${template} ${format}: every block fits the image`, () => {
        const { width: W, height: H } = AD_FORMATS[format];
        const layout = creativeLayout(format, template);
        for (const key of ['photo', 'text', 'cta'] as const) expect(inside(layout[key], W, H), key).toBe(true);
        if (layout.badge) expect(inside(layout.badge, W, H)).toBe(true);
        if (layout.logo) expect(inside(layout.logo, W, H)).toBe(true);
      });
    }
  }

  it('keeps text, button, price and logo out of the parts of a story Instagram and Facebook cover', () => {
    const H = AD_FORMATS.story.height;
    for (const template of AD_TEMPLATES) {
      const layout = creativeLayout('story', template);
      for (const block of [layout.text, layout.cta, layout.badge, layout.logo].filter(Boolean) as { y: number; h: number }[]) {
        expect(block.y, template).toBeGreaterThanOrEqual(H * STORY_SAFE_ZONE.top);
        expect(block.y + block.h, template).toBeLessThanOrEqual(H * (1 - STORY_SAFE_ZONE.bottom));
      }
    }
  });

  it('gives the photo a large part of the image in every layout', () => {
    for (const template of AD_TEMPLATES) {
      const { photo } = creativeLayout('square', template);
      expect(photo.w * photo.h).toBeGreaterThan(1080 * 1080 * 0.3);
    }
  });
});

describe('templateFor', () => {
  it('varies the layout from one concept to the next', () => {
    expect(new Set([0, 1, 2].map(templateFor)).size).toBe(3);
    expect(templateFor(3)).toBe(templateFor(0));
  });
});

describe('ctaLabel', () => {
  it('writes the button in the language of the ad', () => {
    expect(ctaLabel('ORDER_NOW', 'ar')).toBe('اطلب الآن');
    expect(ctaLabel('ORDER_NOW', 'fr')).toBe('Commander');
    expect(ctaLabel('SHOP_NOW', 'en')).toBe('Shop now');
  });
});

describe('readableTextOn', () => {
  it('picks white text on dark colours and dark text on light ones', () => {
    expect(readableTextOn('#5b3df5')).toBe('#ffffff');
    expect(readableTextOn('#111111')).toBe('#ffffff');
    expect(readableTextOn('#f3f0e8')).toBe('#121212');
    expect(readableTextOn('#ffcc00')).toBe('#121212');
    expect(readableTextOn('not-a-colour')).toBe('#ffffff');
  });
});
