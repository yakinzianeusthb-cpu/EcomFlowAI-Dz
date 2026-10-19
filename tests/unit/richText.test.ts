import { describe, expect, it } from 'vitest';
import { parseRichText } from '../../src/lib/richText';

describe('parseRichText', () => {
  it('returns plain text as one part', () => {
    expect(parseRichText('Just a sentence.')).toEqual([{ text: 'Just a sentence.', strong: false }]);
  });

  it('marks **bold** parts and keeps the text around them', () => {
    expect(parseRichText('**Action :** raise the price')).toEqual([
      { text: 'Action :', strong: true },
      { text: ' raise the price', strong: false },
    ]);
  });

  it('handles several bold parts and bold at the end', () => {
    expect(parseRichText('Test an **upsell** and **bundles**')).toEqual([
      { text: 'Test an ', strong: false },
      { text: 'upsell', strong: true },
      { text: ' and ', strong: false },
      { text: 'bundles', strong: true },
    ]);
  });

  it('works for Arabic, where the emphasised words fall in a different place', () => {
    const parts = parseRichText('اختبر **العرض الإضافي** الآن');
    expect(parts.filter((p) => p.strong).map((p) => p.text)).toEqual(['العرض الإضافي']);
    expect(parts.map((p) => p.text).join('')).toBe('اختبر العرض الإضافي الآن');
  });

  it('leaves unbalanced or empty markers as literal text', () => {
    expect(parseRichText('5 ** 2')).toEqual([{ text: '5 ** 2', strong: false }]);
    expect(parseRichText('****')).toEqual([{ text: '****', strong: false }]);
    expect(parseRichText('')).toEqual([]);
  });
});
