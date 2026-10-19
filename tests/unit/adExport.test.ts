import { describe, expect, it } from 'vitest';
import { adPackToCsv, creativeFileName } from '../../src/lib/adExport';

const pack = {
  concepts: [
    { id: 'c1', angle: 'Problème', hook: 'Coupure ?', primaryText: 'Fini le noir, "vraiment".', headline: 'Lumière 12 h', description: 'COD', callToAction: 'ORDER_NOW' as const, overlay: 'Jamais dans le noir', audience: 'Familles' },
    { id: 'c2', angle: 'عرض', hook: 'عرض خاص', primaryText: 'سطر 1\nسطر 2', headline: 'اطلب الآن', description: '', callToAction: 'SHOP_NOW' as const, overlay: '', audience: '' },
  ],
  audiences: [],
  testPlan: [],
};

describe('adPackToCsv', () => {
  const csv = adPackToCsv(pack);

  it('starts with a byte-order mark so spreadsheets read Arabic correctly', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('has a header and one row per concept', () => {
    const lines = csv.slice(1).split('\r\n');
    expect(lines[0]).toBe('concept,angle,hook,primary_text,headline,description,call_to_action,overlay,audience');
    expect(csv).toContain('ORDER_NOW');
    expect(csv).toContain('SHOP_NOW');
  });

  it('quotes values with commas, quotes or line breaks', () => {
    expect(csv).toContain('"Fini le noir, ""vraiment""."');
    expect(csv).toContain('"سطر 1\nسطر 2"');
  });

  it('neutralises values a spreadsheet would run as formulas', () => {
    const risky = adPackToCsv({ ...pack, concepts: [{ ...pack.concepts[0], headline: '=HYPERLINK("http://x")' }] });
    expect(risky).toContain("'=HYPERLINK");
  });
});

describe('creativeFileName', () => {
  it('makes a readable, safe file name', () => {
    expect(creativeFileName('Lampe LED rechargeable', 2, 'story')).toBe('lampe-led-rechargeable-concept-2-story.jpg');
    expect(creativeFileName('مصباح', 1, 'square')).toBe('ad-concept-1-square.jpg');
  });
});
