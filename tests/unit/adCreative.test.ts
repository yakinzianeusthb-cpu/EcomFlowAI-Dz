import { describe, expect, it } from 'vitest';
import {
  AD_FORMATS, AD_TEMPLATES, GOOGLE_IMAGE_FORMATS, STORY_SAFE_ZONE, TIKTOK_CAROUSEL, TIKTOK_SAFE_ZONE,
  creativeLayout, ctaLabel, plainImageLayout, readableTextOn, templateFor,
} from '../../src/lib/adCreative';

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

  it('also keeps clear of what Snapchat covers (150 px at the top, 330 px at the bottom of 1080×1920)', () => {
    expect(AD_FORMATS.story.height * STORY_SAFE_ZONE.top).toBeGreaterThanOrEqual(150);
    expect(AD_FORMATS.story.height * STORY_SAFE_ZONE.bottom).toBeGreaterThanOrEqual(330);
  });

  it('keeps text, button, price and logo out of what TikTok covers: low down and down the sides', () => {
    const { width: W, height: H } = AD_FORMATS.story;
    for (const template of AD_TEMPLATES) {
      const layout = creativeLayout('story', template, TIKTOK_SAFE_ZONE);
      expect(inside(layout.photo, W, H), template).toBe(true);
      for (const block of [layout.text, layout.cta, layout.badge, layout.logo].filter(Boolean) as { x: number; y: number; w: number; h: number }[]) {
        expect(block.y, template).toBeGreaterThanOrEqual(H * TIKTOK_SAFE_ZONE.top);
        expect(block.y + block.h, template).toBeLessThanOrEqual(H * (1 - TIKTOK_SAFE_ZONE.bottom));
        expect(block.x, template).toBeGreaterThanOrEqual(W * TIKTOK_SAFE_ZONE.side);
        expect(block.x + block.w, template).toBeLessThanOrEqual(W * (1 - TIKTOK_SAFE_ZONE.side));
      }
    }
  });

  it('leaves the text room to breathe even in TikTok’s taller safe zone', () => {
    for (const template of AD_TEMPLATES) {
      const { text } = creativeLayout('story', template, TIKTOK_SAFE_ZONE);
      expect(text.h, template).toBeGreaterThanOrEqual(AD_FORMATS.story.height * 0.12);
      expect(text.w, template).toBeGreaterThanOrEqual(AD_FORMATS.story.width * 0.55);
    }
  });

  it('applies a safe zone to story ads only: feed images are drawn the same with or without one', () => {
    for (const template of AD_TEMPLATES) {
      expect(creativeLayout('square', template, TIKTOK_SAFE_ZONE)).toEqual(creativeLayout('square', template));
      expect(creativeLayout('portrait', template, TIKTOK_SAFE_ZONE)).toEqual(creativeLayout('portrait', template));
    }
  });
});

describe('platform image sizes', () => {
  it('uses the sizes the platforms publish', () => {
    expect(TIKTOK_CAROUSEL).toMatchObject({ width: 720, height: 1280 });
    expect(GOOGLE_IMAGE_FORMATS.landscape.width / GOOGLE_IMAGE_FORMATS.landscape.height).toBeCloseTo(1.91, 2);
    expect(GOOGLE_IMAGE_FORMATS.square.width).toBe(GOOGLE_IMAGE_FORMATS.square.height);
    expect(GOOGLE_IMAGE_FORMATS.square.width).toBeGreaterThanOrEqual(1200);
  });
});

describe('plainImageLayout', () => {
  it('fills the image with a photo of the same shape, with no blurred backdrop', () => {
    expect(plainImageLayout(1200, 1200, 800, 800)).toEqual({ photo: { x: 0, y: 0, w: 1200, h: 1200 }, backdrop: false });
  });

  it('shows a photo of another shape whole and centred, over a blurred copy of itself', () => {
    const { photo, backdrop } = plainImageLayout(1200, 628, 1000, 1500); // a portrait product photo in a landscape image
    expect(backdrop).toBe(true);
    expect(photo.y).toBeGreaterThan(0);
    expect(photo.y + photo.h).toBeLessThanOrEqual(628);
    expect(Math.abs(photo.x + photo.w / 2 - 600)).toBeLessThanOrEqual(1);
    expect(photo.w / photo.h).toBeCloseTo(1000 / 1500, 2);
  });

  it('makes the product as large as the margins allow', () => {
    const { photo } = plainImageLayout(1200, 1200, 1600, 900); // landscape photo, square image
    expect(photo.w).toBeGreaterThanOrEqual(1200 * 0.87);
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
