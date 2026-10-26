import { describe, expect, it } from 'vitest';
import { IMAGE_COST_USD, formatImageCost } from '../../src/lib/imageCost';

const plain = (text: string | null) => text?.replace(/\s/g, ' ') ?? null;

describe('formatImageCost', () => {
  it('shows Google’s price per image, in the reader’s locale', () => {
    expect(IMAGE_COST_USD.gemini).toBe(0.04);
    expect(plain(formatImageCost('gemini', 'en-US'))).toBe('$0.04');
    expect(plain(formatImageCost('gemini', 'fr-FR'))).toBe('0,04 $');
    expect(formatImageCost('gemini', 'ar-DZ')).not.toContain('US');
  });

  it('adds up several images', () => {
    expect(plain(formatImageCost('gemini', 'en-US', 6))).toBe('$0.24');
  });

  it('shows no amount for services that bill at their own rate', () => {
    for (const provider of ['openai', 'fal', 'cloudflare'] as const) expect(formatImageCost(provider, 'en-US')).toBeNull();
  });
});
