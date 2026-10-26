import { describe, expect, it } from 'vitest';
import { DZ_PHONE, WILAYAS, buildLandingHtml, pageLanguage, safeImageSrc, sectionRoles, type LandingPageInput } from '../../src/lib/landingHtml';
import { LANDING_TEMPLATES, THEMES } from '../../src/lib/landingTheme';

const PHOTO = 'data:image/jpeg;base64,/9j/AAAA';
const PHOTO_2 = 'data:image/png;base64,iVBORw0KGgoB';
const NBSP = ' ';
// the web layout; the long-image layout has its own tests below
const base: LandingPageInput = {
  template: 'impact',
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
      content: 'آلاف الزبائن راضون',
      testimonials: [{ name: 'أمينة (وهران)', text: 'ممتازة!', rating: 5 }],
    },
    {
      title: 'لماذا نحن؟',
      comparisonTable: [{ feature: 'القوة', product: '1000 واط', competitor: '500 واط' }],
      guaranteeDetails: { title: 'ضمان 12 شهر', description: 'استبدال مجاني' },
    },
  ],
};
const config = (html: string) => JSON.parse(/<script type="application\/json" id="lp-config">([\s\S]*?)<\/script>/.exec(html)![1]);

describe('buildLandingHtml', () => {
  const html = buildLandingHtml(base);

  it('is a complete, mobile-ready HTML document in the page language', () => {
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="ar" dir="rtl">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">');
    expect(html).toContain('<title>مفرمة احترافية</title>');
  });

  it('writes French pages left to right', () => {
    const fr = buildLandingHtml({ ...base, language: 'fr' });
    expect(fr).toContain('<html lang="fr" dir="ltr">');
    expect(fr).toContain('Commander maintenant');
  });

  it('shows the copy of every section', () => {
    for (const text of ['المفرمة الأقوى في الجزائر', 'جودة مضمونة', 'وداعاً للتعب في المطبخ', 'محرك قوي', 'شفرات فولاذية', 'لماذا نحن؟', '1000 واط', '500 واط']) {
      expect(html, text).toContain(text);
    }
    const guaranteed = buildLandingHtml({ ...base, promises: { guarantee: true } });
    for (const text of ['ضمان 12 شهر', 'استبدال مجاني']) expect(guaranteed, text).toContain(text);
  });

  it('turns line breaks in the copy into paragraphs', () => {
    expect(html).toContain('<p>فرم اللحم والخضار في ثوانٍ.</p>');
    expect(html).toContain('<p>سهلة التنظيف.</p>');
  });

  it('shows the price, the old price struck through, and the saving computed from both', () => {
    expect(html).toContain(`<bdi class="price-now">2${NBSP}900 DA</bdi>`);
    expect(html).toMatch(new RegExp(`<s class="price-old"><bdi class="old">4${NBSP}500 DA</bdi></s>`));
    // written left to right even in an Arabic page, so the minus stays in front
    expect(html).toContain('<span class="save" dir="ltr">');
    expect(html).toContain('-36%</span>');
    expect(buildLandingHtml({ ...base, oldPrice: '' })).not.toContain('class="save"');
  });

  it('keeps spaced numbers in one piece, so right-to-left text never shows "900 2"', () => {
    const page = buildLandingHtml({ ...base, sections: [{ title: 'عرض خاص', content: 'السعر 2 900 دج فقط' }] });
    expect(page).toContain(`<p>السعر 2${NBSP}900 دج فقط</p>`);
    expect(page).not.toContain('2 900 دج');
  });

  it('sends the price to the order address exactly as typed, and keeps it whole in the WhatsApp message', () => {
    expect(config(html)).toMatchObject({ price: '2 900 DA', priceText: '2900 DA' });
    expect(html).toContain("l.price + ': ' + cfg.priceText");
  });

  it('has a cash-on-delivery order form with all 58 wilayas', () => {
    expect(html).toContain('id="order-form"');
    for (const name of ['name', 'phone', 'wilaya', 'address', 'quantity']) expect(html).toContain(`name="${name}"`);
    expect((html.match(/<option value="\d\d - /g) ?? []).length).toBe(58);
  });

  it('labels the quantity without wrapping its buttons, so tapping the label never removes one', () => {
    expect(html).toContain('<label for="qty">');
    expect(html).toContain('<input id="qty" name="quantity"');
    expect(html).not.toMatch(/<label[^>]*>[^<]*<span class="qty">/);
  });

  it('uses the generated colours', () => {
    expect(html).toContain('--brand: #0f766e');
    expect(html).toContain('--accent: #f59e0b');
  });

  it('places the product photos in the page', () => {
    expect(html).toContain(`src="${PHOTO}"`);
  });

  it('shows a gallery with one dot per photo when there are several', () => {
    const two = buildLandingHtml({ ...base, photos: [PHOTO, PHOTO_2] });
    expect((two.match(/class="slide"/g) ?? []).length).toBe(2);
    expect((two.match(/class="dot"/g) ?? []).length).toBe(2);
    expect(html).not.toContain('class="dot"');
  });

  it('lets keyboard users reach and scroll a gallery of several photos', () => {
    expect(buildLandingHtml({ ...base, photos: [PHOTO, PHOTO_2] })).toContain('<div class="slides" id="slides" tabindex="0" role="region" aria-label="صور المنتج">');
    expect(html).toContain('<div class="slides" id="slides">');
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
      storeName: '<svg onload=alert(1)>',
      reviews: [{ name: '<b>x</b>', text: '<script>alert(2)</script>' }],
      sections: [{ title: '<script>alert(1)</script>', content: '"quoted" & <b>bold</b>', benefits: ['<svg onload=alert(1)>'] }],
    });
    expect(evil).not.toContain('<script>alert(1)</script>');
    expect(evil).not.toContain('<script>alert(2)</script>');
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
    expect(config(html).whatsapp).toBe('213555000000');
    const none = buildLandingHtml({ ...base, whatsapp: '', webhookUrl: '' });
    expect(config(none)).toMatchObject({ whatsapp: '', webhook: '' });
  });

  it('accepts only https web addresses for the order hook', () => {
    expect(config(buildLandingHtml({ ...base, webhookUrl: 'https://script.google.com/macros/s/abc/exec' })).webhook).toBe('https://script.google.com/macros/s/abc/exec');
    expect(config(buildLandingHtml({ ...base, webhookUrl: 'javascript:alert(1)' })).webhook).toBe('');
    expect(config(buildLandingHtml({ ...base, webhookUrl: 'http://insecure.example' })).webhook).toBe('');
  });

  it('keeps only the digits of the WhatsApp number', () => {
    expect(config(buildLandingHtml({ ...base, whatsapp: '+213 555-00-00-00' })).whatsapp).toBe('213555000000');
  });

  it('offers a WhatsApp link for questions only when there is a number', () => {
    expect(html).toContain(`href="https://wa.me/213555000000?text=${encodeURIComponent('مفرمة احترافية')}"`);
    expect(buildLandingHtml({ ...base, whatsapp: '' })).not.toContain('class="wa"');
  });

  it('works without photos or optional sections', () => {
    const bare = buildLandingHtml({ template: 'impact', productName: 'Produit', language: 'fr', sections: [{ title: 'Titre' }], photos: [] });
    expect(bare).toContain('Titre');
    expect(bare).toContain('id="order-form"');
    expect(bare).toContain('hero-grid solo');
  });
});

describe('reviews', () => {
  it('never publishes the reviews the AI invented, nor the section around them', () => {
    const html = buildLandingHtml(base);
    for (const text of ['أمينة (وهران)', 'ممتازة!', 'آلاف الزبائن راضون', 'reviews-title']) expect(html, text).not.toContain(text);
  });

  it('publishes the seller\'s real reviews where that section was, escaped', () => {
    const html = buildLandingHtml({ ...base, language: 'fr', reviews: [{ name: 'Karim, Sétif', text: 'Reçu en 2 jours, très content.' }, { name: 'vide', text: '  ' }] });
    expect(html).toContain('<blockquote>Reçu en 2 jours, très content.</blockquote><figcaption>Karim, Sétif</figcaption>');
    expect(html).not.toContain('vide');
    const at = html.indexOf('reviews-title');
    expect(at).toBeGreaterThan(html.indexOf('وداعاً للتعب في المطبخ'));
    expect(at).toBeLessThan(html.indexOf('لماذا نحن؟'));
  });

  it('shows the screenshots of real reviews, images only', () => {
    const html = buildLandingHtml({ ...base, reviewShots: [PHOTO_2, 'javascript:alert(1)'] });
    expect(html).toContain(`<img src="${PHOTO_2}" alt="رأي أحد زبائننا"`);
    expect(html).not.toContain('javascript:alert(1)');
  });

  it('puts real reviews before the order form when the copy has no review section', () => {
    const html = buildLandingHtml({ ...base, sections: [base.sections[0]], reviews: [{ text: 'Top' }] });
    expect(html.indexOf('reviews-title')).toBeLessThan(html.indexOf('id="order"'));
    expect(html.indexOf('reviews-title')).toBeGreaterThan(html.indexOf('وداعاً للتعب في المطبخ'));
  });
});

describe('what the AI wrote that the seller has not vouched for', () => {
  const page = (overrides: Partial<LandingPageInput> = {}) => buildLandingHtml({
    ...base,
    sections: [
      base.sections[0],
      {
        title: 'علاش تختارنا',
        content: 'جودة عالية.',
        cta: { variations: [{ type: 'urgency', text: 'تخفيض 30% صالح لمدة 24 ساعة' }, { type: 'benefit', text: 'انضم لآلاف الزبائن الراضين' }, { type: 'direct', text: 'اطلب نظاراتك درك' }], subtext: 'أكثر من 5000 زبون راضي في الجزائر' },
      },
      { title: 'حقك مضمون', content: 'ماتخلص حتى تفحص', guaranteeDetails: { title: 'ضمان 12 شهر', description: 'استبدال مجاني' } },
    ],
    ...overrides,
  });

  it('labels each section button with the plain call to action, not the urgency or benefit lines', () => {
    const html = page();
    expect(html).toContain('اطلب نظاراتك درك');
    expect(html).not.toContain('تخفيض 30%');
    expect(html).not.toContain('انضم لآلاف الزبائن الراضين');
  });

  it('uses the page\'s own button label when the AI gave no plain call to action', () => {
    const html = buildLandingHtml({ ...base, sections: [{ title: 'Titre', cta: { variations: [{ type: 'urgency', text: 'Plus que 3 en stock' }] } }], language: 'fr' });
    expect(html).not.toContain('Plus que 3 en stock');
    expect(html).toMatch(/<div class="sec-cta"><a class="btn" href="#order">Commander maintenant/);
  });

  it('replaces the line under each button (counts, ratings, stock) with the promises the seller ticked', () => {
    const html = page();
    expect(html).not.toContain('أكثر من 5000 زبون');
    expect(html).toContain('<p class="cta-sub">الدفع عند الاستلام · توصيل إلى 58 ولاية</p>');
  });

  it('shows the guarantee section only when the seller offers a guarantee or a check before paying', () => {
    expect(page()).not.toContain('ضمان 12 شهر');
    expect(page()).not.toContain('حقك مضمون');
    expect(page({ promises: { guarantee: true } })).toContain('ضمان 12 شهر');
    expect(page({ promises: { inspection: true } })).toContain('حقك مضمون');
  });

  it('keeps a section that has more than the guarantee, without the guarantee box', () => {
    const html = buildLandingHtml(base);
    expect(html).toContain('لماذا نحن؟');
    expect(html).toContain('1000 واط');
    expect(html).not.toContain('class="guarantee"');
  });

  it('does not repeat the big title in the first section', () => {
    const html = buildLandingHtml({ ...base, sections: [{ ...base.sections[0], title: 'المفرمة الأقوى في الجزائر مع ضمان' }] });
    expect(html.match(/المفرمة الأقوى في الجزائر/g)?.length).toBe(2); // the h1 and the og:title, not a second heading
  });
});

describe('sectionRoles', () => {
  const quote = (n: number) => Array.from({ length: n }, () => ({ name: 'X', text: 'Y', rating: 5 }));

  it('takes only the section with the most reviews as the review section: the AI often adds one to every section', () => {
    const sections = [{ title: 'A', testimonials: quote(1) }, { title: 'B', testimonials: quote(1) }, { title: 'أكثر من 3,400 رجل', testimonials: quote(3) }, { title: 'D', testimonials: quote(1) }];
    expect(sectionRoles(sections)).toEqual(['shown', 'shown', 'reviews', 'shown']);
    const html = buildLandingHtml({ ...base, sections });
    for (const title of ['>A<', '>B<', '>D<']) expect(html).toContain(title);
    expect(html).not.toContain('3,400');
  });

  it('keeps every section when no single one is the review section, and puts the real reviews at the end', () => {
    const sections = [{ title: 'A', testimonials: quote(1) }, { title: 'B', testimonials: quote(1) }];
    expect(sectionRoles(sections)).toEqual(['shown', 'shown']);
    const html = buildLandingHtml({ ...base, sections, reviews: [{ text: 'Vrai avis' }] });
    expect(html.indexOf('Vrai avis')).toBeGreaterThan(html.indexOf('>B<'));
  });

  it('tells which sections the page shows, so no AI image is made for a section left out', () => {
    expect(sectionRoles(base.sections)).toEqual(['shown', 'reviews', 'shown']);
    const guaranteeOnly = [{ title: 'حقك مضمون', guaranteeDetails: { title: 'ضمان' } }, { content: '' }];
    expect(sectionRoles(guaranteeOnly)).toEqual(['hidden', 'hidden']);
    expect(sectionRoles(guaranteeOnly, { guarantee: true })).toEqual(['shown', 'hidden']);
  });
});

describe('promises', () => {
  it('always says cash on delivery, and delivery to the 58 wilayas unless the seller unticks it', () => {
    const html = buildLandingHtml(base);
    expect(html).toContain('الدفع عند الاستلام');
    expect(html).toContain('توصيل إلى 58 ولاية');
    expect(html).not.toContain('ضمان الجودة');
    expect(html).not.toContain('عاين المنتج قبل الدفع');
  });

  it('shows only what the seller ticked', () => {
    const html = buildLandingHtml({ ...base, promises: { nationwide: false, guarantee: true, inspection: true } });
    expect(html).not.toContain('توصيل إلى 58 ولاية');
    expect(html).toContain('ضمان الجودة');
    expect(html).toContain('عاين المنتج قبل الدفع');
  });
});

describe('order total and delivery', () => {
  it('says delivery depends on the wilaya by default, next to the product total', () => {
    const html = buildLandingHtml(base);
    expect(html).toContain('<span>التوصيل</span><span>حسب الولاية</span>');
    expect(html).toContain(`<bdi id="sum-total">2${NBSP}900 DA</bdi><span class="plus"> + التوصيل</span>`);
    expect(config(html).money).toMatchObject({ unit: 2900, feeMode: 'by-wilaya', fee: 0 });
  });

  it('adds a fixed delivery price to the total', () => {
    const html = buildLandingHtml({ ...base, delivery: { mode: 'fixed', fee: '400 DA' } });
    expect(html).toContain(`<bdi id="sum-total">3${NBSP}300 DA</bdi>`);
    expect(config(html)).toMatchObject({ deliveryText: '400 DA', money: { feeMode: 'fixed', fee: 400 } });
  });

  it('falls back to "depends on the wilaya" when the fixed price has no amount', () => {
    expect(config(buildLandingHtml({ ...base, delivery: { mode: 'fixed', fee: 'à voir' } })).money.feeMode).toBe('by-wilaya');
  });

  it('announces free delivery when the seller offers it', () => {
    const html = buildLandingHtml({ ...base, delivery: { mode: 'free' } });
    expect(html).toContain('توصيل مجاني');
    expect(html).toContain('<span>التوصيل</span><span>مجاني</span>');
    expect(html).toContain(`<bdi id="sum-total">2${NBSP}900 DA</bdi></span>`);
  });

  it('shows no total when the price has no amount', () => {
    const html = buildLandingHtml({ ...base, price: '' });
    expect(html).not.toContain('id="sum-total"');
    expect(config(html).money.unit).toBeNull();
  });
});

describe('templates', () => {
  it('builds each template with its own fonts and look', () => {
    for (const template of LANDING_TEMPLATES) {
      const html = buildLandingHtml({ ...base, template });
      expect(html, template).toContain(`<body class="t-${template}">`);
      expect(html, template).toContain(THEMES[template].fonts.href);
    }
  });

  it('falls back to the first template, the long-image page, for an unknown one', () => {
    expect(buildLandingHtml({ ...base, template: 'other' as never })).toContain('<body class="t-poster">');
  });

  it('puts the shop name in the header, the footer and the title', () => {
    const html = buildLandingHtml({ ...base, storeName: 'Dz Shop' });
    expect(html).toContain('<title>مفرمة احترافية — Dz Shop</title>');
    expect(html).toContain('<strong class="brand-name">Dz Shop</strong>');
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
  it('accepts only image data or https images', () => {
    expect(safeImageSrc(PHOTO)).toBe(PHOTO);
    expect(safeImageSrc('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
    expect(safeImageSrc('javascript:alert(1)')).toBeNull();
    expect(safeImageSrc('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(safeImageSrc('" onerror="alert(1)')).toBeNull();
  });

  it('never lets a palette value into the CSS unless it is a colour', () => {
    const html = buildLandingHtml({ ...base, colorPalette: ['red;}</style><script>alert(1)</script>', '#0F766E'] });
    expect(html).not.toContain('alert(1)');
    expect(html).toContain('--brand: #0f766e');
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
