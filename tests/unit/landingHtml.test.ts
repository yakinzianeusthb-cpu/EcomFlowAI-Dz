import { describe, expect, it } from 'vitest';
import { DZ_PHONE, WILAYAS, buildLandingHtml, pageLanguage, safeColor, safeImageSrc, type LandingPageInput } from '../../src/lib/landingHtml';

const PHOTO = 'data:image/jpeg;base64,/9j/AAAA';
const NBSP = ' ';
const base: LandingPageInput = {
  productName: 'مفرمة احترافية',
  language: 'ar',
  colorPalette: ['#0F766E', '#F59E0B', '#FFFFFF'],
  photos: [PHOTO],
  price: '2 900 DA',
  oldPrice: '4 500 DA',
  whatsapp: '213555000000',
  sections: [
    {
      title: 'وداعاً للتعب في المطبخ',
      content: 'فرم اللحم والخضار في ثوانٍ.\nسهلة التنظيف.',
      benefits: ['محرك قوي', 'شفرات فولاذية'],
      textOverlay: { headline: 'المفرمة الأقوى في الجزائر', subtext: 'جودة مضمونة' },
      cta: { variations: [{ text: 'اطلب الآن', type: 'direct' }], subtext: 'توصيل مجاني' },
    },
    {
      title: 'آراء زبائننا',
      content: '',
      testimonials: [{ name: 'أمينة (وهران)', text: 'ممتازة!', rating: 5 }],
    },
    {
      title: 'لماذا نحن؟',
      comparisonTable: [{ feature: 'القوة', product: '1000 واط', competitor: '500 واط' }],
      guaranteeDetails: { title: 'ضمان 12 شهر', description: 'استبدال مجاني' },
    },
  ],
};

describe('buildLandingHtml', () => {
  const html = buildLandingHtml(base);

  it('is a complete, mobile-ready HTML document in the page language', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
    expect(html).toContain('<title>مفرمة احترافية</title>');
  });

  it('writes French pages left to right', () => {
    const fr = buildLandingHtml({ ...base, language: 'fr' });
    expect(fr).toContain('<html lang="fr" dir="ltr">');
    expect(fr).toContain('Commander maintenant');
  });

  it('shows the copy of every section', () => {
    for (const text of ['المفرمة الأقوى في الجزائر', 'جودة مضمونة', 'وداعاً للتعب في المطبخ', 'محرك قوي', 'شفرات فولاذية', 'أمينة (وهران)', 'ممتازة!', 'ضمان 12 شهر', 'استبدال مجاني', '1000 واط', '500 واط']) {
      expect(html, text).toContain(text);
    }
  });

  it('turns line breaks in the copy into paragraphs', () => {
    expect(html).toContain('<p>فرم اللحم والخضار في ثوانٍ.</p>');
    expect(html).toContain('<p>سهلة التنظيف.</p>');
  });

  it('shows the price, and the old price struck through', () => {
    expect(html).toContain(`<b>2${NBSP}900 DA</b>`);
    expect(html).toMatch(new RegExp(`<s[^>]*>4${NBSP}500 DA</s>`));
  });

  it('keeps spaced numbers in one piece, so right-to-left text never shows "900 2"', () => {
    const page = buildLandingHtml({ ...base, sections: [{ title: 'عرض خاص', content: 'السعر 2 900 دج فقط' }] });
    expect(page).toContain(`<p>السعر 2${NBSP}900 دج فقط</p>`);
    expect(page).not.toContain('2 900 دج');
  });

  it('sends the price to the order address exactly as typed, and keeps it whole in the WhatsApp message', () => {
    expect(html).toContain('"price":"2 900 DA"');
    expect(html).toContain('"priceText":"2900 DA"');
    expect(html).toContain("l.price + ': ' + cfg.priceText");
  });

  it('has a cash-on-delivery order form with all 58 wilayas', () => {
    expect(html).toContain('id="order-form"');
    for (const name of ['name', 'phone', 'wilaya', 'address', 'quantity']) expect(html).toContain(`name="${name}"`);
    expect((html.match(/<option value="\d\d - /g) ?? []).length).toBe(58);
  });

  it('uses the generated colours', () => {
    expect(html).toContain('--primary: #0F766E');
    expect(html).toContain('--accent: #F59E0B');
  });

  it('places the product photos in the page', () => {
    expect(html).toContain(`src="${PHOTO}"`);
  });

  it('prefers an AI image made for a section over the product photo', () => {
    const ai = 'data:image/png;base64,iVBORw0KGgo=';
    const withAi = buildLandingHtml({ ...base, sectionImages: [ai, null, null] });
    expect(withAi).toContain(`src="${ai}"`);
  });

  it('escapes every piece of text, so the copy can never inject markup', () => {
    const evil = buildLandingHtml({
      ...base,
      productName: '<img src=x onerror=alert(1)>',
      sections: [{ title: '<script>alert(1)</script>', content: '"quoted" & <b>bold</b>', benefits: ['<svg onload=alert(1)>'] }],
    });
    expect(evil).not.toContain('<script>alert(1)</script>');
    expect(evil).not.toContain('<img src=x');
    expect(evil).not.toContain('<svg onload');
    expect(evil).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(evil).toContain('&quot;quoted&quot; &amp; &lt;b&gt;bold&lt;/b&gt;');
  });

  it('keeps the settings script safe even if a value contains "</script>"', () => {
    const tricky = buildLandingHtml({ ...base, productName: 'x</script><script>alert(1)</script>' });
    expect(tricky.match(/<\/script>/g)?.length).toBe((tricky.match(/<script/g) ?? []).length);
  });

  it('only sends orders to the WhatsApp number and web address that were set up', () => {
    expect(html).toContain('"whatsapp":"213555000000"');
    const none = buildLandingHtml({ ...base, whatsapp: '', webhookUrl: '' });
    expect(none).toContain('"whatsapp":""');
    expect(none).toContain('"webhook":""');
  });

  it('accepts only https web addresses for the order hook', () => {
    expect(buildLandingHtml({ ...base, webhookUrl: 'https://script.google.com/macros/s/abc/exec' })).toContain('"webhook":"https://script.google.com/macros/s/abc/exec"');
    expect(buildLandingHtml({ ...base, webhookUrl: 'javascript:alert(1)' })).toContain('"webhook":""');
    expect(buildLandingHtml({ ...base, webhookUrl: 'http://insecure.example' })).toContain('"webhook":""');
  });

  it('keeps only the digits of the WhatsApp number', () => {
    expect(buildLandingHtml({ ...base, whatsapp: '+213 555-00-00-00' })).toContain('"whatsapp":"213555000000"');
  });

  it('works without photos or optional sections', () => {
    const bare = buildLandingHtml({ productName: 'Produit', language: 'fr', sections: [{ title: 'Titre' }], photos: [] });
    expect(bare).toContain('Titre');
    expect(bare).toContain('id="order-form"');
  });
});

describe('pageLanguage', () => {
  it('follows the language chosen in the tool', () => {
    expect(pageLanguage('Arabe / Darija Algérienne', [])).toBe('ar');
    expect(pageLanguage('Français', [])).toBe('fr');
    expect(pageLanguage('Anglais', [])).toBe('en');
  });

  it('falls back to the language of the text', () => {
    expect(pageLanguage('', ['اطلب الآن'])).toBe('ar');
    expect(pageLanguage(undefined, ['Commandez maintenant'])).toBe('fr');
  });
});

describe('safety helpers', () => {
  it('accepts only real colours', () => {
    expect(safeColor('#0f766e', '#000')).toBe('#0f766e');
    expect(safeColor('#abc', '#000')).toBe('#abc');
    expect(safeColor('red; background:url(x)', '#000')).toBe('#000');
    expect(safeColor(undefined, '#123456')).toBe('#123456');
  });

  it('accepts only image data or https images', () => {
    expect(safeImageSrc(PHOTO)).toBe(PHOTO);
    expect(safeImageSrc('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(safeImageSrc('javascript:alert(1)')).toBeNull();
    expect(safeImageSrc('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(safeImageSrc('" onerror="alert(1)')).toBeNull();
  });
});

describe('WILAYAS and DZ_PHONE', () => {
  it('lists the 58 wilayas in order', () => {
    expect(WILAYAS).toHaveLength(58);
    expect(WILAYAS[0]).toBe('01 - Adrar - أدرار');
    expect(WILAYAS[15]).toBe('16 - Alger - الجزائر');
    expect(WILAYAS[57]).toBe('58 - El Meniaa - المنيعة');
  });

  it('recognises Algerian mobile numbers', () => {
    for (const ok of ['0555123456', '0661234567', '0798765432', '+213555123456', '213661234567']) expect(DZ_PHONE.test(ok), ok).toBe(true);
    for (const bad of ['0455123456', '055512345', '05551234567', 'abc', '+33612345678']) expect(DZ_PHONE.test(bad), bad).toBe(false);
  });
});
