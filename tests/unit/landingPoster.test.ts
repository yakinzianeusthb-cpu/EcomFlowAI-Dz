import { describe, expect, it } from 'vitest';
import { buildLandingHtml, type LandingPageInput } from '../../src/lib/landingHtml';
import { markHeadline, pagePlan, posterText } from '../../src/lib/landingParts';
import { splitFeature } from '../../src/lib/landingPoster';
import { TEXT } from '../../src/lib/landingCopy';

const PHOTO = 'data:image/jpeg;base64,/9j/AAAA';
const PHOTO_2 = 'data:image/png;base64,iVBORw0KGgoB';
const POSTER = 'data:image/jpeg;base64,/9j/POSTER1';
const NBSP = ' ';
const page: LandingPageInput = {
  productName: 'ساعة بلاك ستيلث',
  language: 'ar',
  colorPalette: ['#1A1A1A', '#0A2463', '#D4AF37'],
  photos: [PHOTO, PHOTO_2],
  price: '2 900 DA',
  oldPrice: '4 500 DA',
  whatsapp: '213555000000',
  sections: [
    { title: 'زيد في هيبتك وخلي حضورك يطغى', content: 'ماشي غير ساعة.', benefits: ['هيبة لا تقاوم', 'مقاومة للماء'], textOverlay: { headline: 'زيد في هيبتك', subtext: 'ساعة الفخامة السوداء' } },
    { title: 'عييت من الساعات اللي تبان رخيصة؟', content: 'الفولاذ المقاوم للصدأ.', benefits: ['مقاومة للخدش', 'ستانلس ستيل', 'دقة متناهية', 'زجاج معدني'], textOverlay: { headline: 'الجودة اللي تستحقها', subtext: 'مصنوعة لتدوم' }, cta: { variations: [{ type: 'urgency', text: 'آخر فرصة' }, { type: 'direct', text: 'تأكيد الطلب الآن' }], subtext: 'الكمية المتبقية: 7 قطع فقط' } },
    { title: 'الفرق واضح', comparisonTable: [{ feature: 'المادة', product: 'ستانلس ستيل', competitor: 'بلاستيك' }] },
    { title: 'واش قالوا زبائننا؟', content: 'آلاف الزبائن راضون', testimonials: [{ name: 'أمينة', text: 'ممتازة!', rating: 5 }] },
  ],
};
const sectionsOf = (html: string) => html.match(/<section class="sx">[\s\S]*?<\/section>/g) ?? [];

describe('the long-image page (poster template)', () => {
  const html = buildLandingHtml(page);

  it('is the default template: one canvas of pictures, then the order form on it', () => {
    expect(html).toContain('<body class="t-poster">');
    expect(html).toContain('<div class="strip">');
    expect(html.indexOf('<div class="strip">')).toBeLessThan(html.indexOf('id="order-form"'));
  });

  it('is one continuous canvas: no header bar, no section backgrounds, the footer inside it', () => {
    expect(html).toContain('.announce, .top { display: none; }');
    // one gradient on the canvas, none on the sections laid on it
    expect(html).toMatch(/\nmain \{[^}]*linear-gradient\(180deg/);
    const sectionRules = html.match(/\n\.(?:sx|sx-hero|sx\.extra|reviews-sx) \{[^}]*\}/g) ?? [];
    expect(sectionRules.length).toBeGreaterThanOrEqual(3);
    for (const rule of sectionRules) expect(rule).not.toContain('background');
    expect(html.indexOf('<footer class="foot">')).toBeGreaterThan(html.indexOf('id="order-form"'));
    expect(html.indexOf('<footer class="foot">')).toBeLessThan(html.indexOf('</main>'));
  });

  it('opens with the name, the big title with its last words highlighted, its line and the first photo', () => {
    expect(html).toContain('<section class="sx sx-hero" aria-labelledby="hero-title"><p class="tag name">ساعة بلاك ستيلث</p><h1 id="hero-title" class="headline">زيد في <mark>هيبتك</mark></h1><p class="pill">ساعة الفخامة السوداء</p>');
    expect(html).toContain(`<div class="hero-media"><img src="${PHOTO}" alt="ساعة بلاك ستيلث" fetchpriority="high" decoding="async">`);
    // one picture, not a slider: the other photos go down the canvas
    expect(html).not.toContain('id="slides"');
  });

  it('lays round feature badges, each with an icon matching its words, and the button over the bottom of the photo', () => {
    const hero = /<section class="sx sx-hero"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(hero).toMatch(/<\/div><div class="lift"><ul class="badges"><li><span class="badge-ico"><svg[^>]*>[^]*?<\/svg><\/span><span class="badge-label">هيبة لا تقاوم<\/span><\/li>/);
    // "مقاومة للماء" (water resistant) gets the droplet
    expect(hero).toContain('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg></span><span class="badge-label">مقاومة للماء</span>');
    expect(hero).toMatch(/<\/ul><a class="btn btn-cta" href="#order" id="hero-cta">اطلب الآن<span class="cart"><svg/);
  });

  it('puts the price on a round sticker over the first photo, with the saving', () => {
    expect(html).toContain(`<div class="sticker"><bdi class="now">2${NBSP}900 DA</bdi><s><bdi>4${NBSP}500 DA</bdi></s><span class="cut" dir="ltr">`);
    expect(html).toContain('-36%</span></div></div><div class="lift">');
  });

  it('gives the opening its own button with the seller\'s promises under it, and no price bar breaking the canvas', () => {
    const hero = /<section class="sx sx-hero"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(hero).toContain('id="hero-cta"');
    expect(hero).toContain('<p class="cta-sub">الدفع عند الاستلام · توصيل إلى 58 ولاية</p>');
    expect(html).not.toContain('class="buybar"');
  });

  it('keeps the first section\'s text under the opening button, not in a section of its own', () => {
    expect(html).toMatch(/<section class="sx sx-hero"[\s\S]*?id="hero-cta"[\s\S]*?<div class="prose"><p>ماشي غير ساعة\.<\/p><\/div><\/section>/);
    expect((html.match(/ماشي غير ساعة\./g) ?? []).length).toBe(1);
  });

  it('goes straight from the last section of the canvas to the order form', () => {
    expect(html).toMatch(/<\/section><\/div>\n<section class="order-sec" id="order"/);
  });

  it('draws each other section on the canvas: sticker, title on a brush band, line, picture, features and the plain call to action', () => {
    expect(html).toContain('<section class="sx"><p class="tag">الجودة اللي تستحقها</p><h2 class="banner">عييت من الساعات اللي <mark>تبان رخيصة؟</mark></h2><p class="pill">مصنوعة لتدوم</p>');
    expect(html).toContain('تأكيد الطلب الآن');
    expect(html).not.toContain('آخر فرصة');
    expect(html).not.toContain('الكمية المتبقية');
  });

  it('lays a section\'s features over the bottom of its photo, the button after them', () => {
    const second = sectionsOf(html)[0];
    expect(second).toContain(`<figure class="sx-shot rv"><img src="${PHOTO_2}" alt="عييت من الساعات اللي تبان رخيصة؟" loading="lazy" decoding="async"></figure><div class="lift"><ul class="rows"><li><span class="row-box"><span class="row-ico">`);
    expect(second).toContain('<strong>مقاومة للخدش</strong>');
    expect(second).toMatch(/<\/ul><\/div><div class="flat"><a class="btn btn-cta" href="#order">تأكيد الطلب الآن<span class="cart">[\s\S]*?<p class="cta-sub">الدفع عند الاستلام · توصيل إلى 58 ولاية<\/p><\/div><\/section>/);
  });

  it('lays the features of a section without its own picture over strips of the product photos', () => {
    const features = { title: 'تفاصيل تصنع الفرق', benefits: ['إضاءة ليلية', 'بطارية تدوم سنتين', 'Livraison rapide'] };
    const strips = sectionsOf(buildLandingHtml({ ...page, sections: [page.sections[0], page.sections[1], features] }))[1];
    expect(strips).toContain('<ul class="rows strips">');
    // the photos in turn, decorative here (each is shown with its description elsewhere)
    expect(strips).toContain(`<img class="row-pic" src="${PHOTO}" alt="" loading="lazy" decoding="async"></li><li>`);
    expect(strips).toContain(`<img class="row-pic" src="${PHOTO_2}" alt=""`);
    expect(strips).not.toContain('sx-shot');
    // a single photo would fill every strip with itself: plain feature boxes then
    const single = sectionsOf(buildLandingHtml({ ...page, photos: [PHOTO], sections: [page.sections[0], page.sections[1], features] }))[1];
    expect(single).toContain('<ul class="rows">');
    expect(single).not.toContain('row-pic');
  });

  it('keeps the comparison table, and never the invented reviews or their section', () => {
    expect(html).toContain('<div class="compare">');
    for (const text of ['أمينة', 'ممتازة!', 'آلاف الزبائن راضون']) expect(html).not.toContain(text);
  });

  it('puts the seller\'s real reviews and screenshots where the AI\'s review section was', () => {
    const withReviews = buildLandingHtml({ ...page, reviews: [{ name: 'Karim, Sétif', text: 'Reçue en 2 jours.' }], reviewShots: [PHOTO_2] });
    expect(withReviews).toContain('<section class="sx reviews-sx" aria-labelledby="reviews-title"><h2 id="reviews-title" class="banner">');
    expect(withReviews.indexOf('reviews-title')).toBeGreaterThan(withReviews.indexOf('الفرق واضح'));
    expect(withReviews).toContain('Reçue en 2 jours.');
  });

  it('colours the browser bar like the canvas and highlights the order title the same way', () => {
    expect(html).toContain('<meta name="theme-color" content="#1a1a1a">');
    expect(html).toMatch(/<h2 id="order-title">[^<]* <mark>[^<]+<\/mark><\/h2>/);
  });
});

describe('AI posters in the long-image page', () => {
  it('shows a section the AI drew as its picture alone, linked to the form, with its words for screen readers', () => {
    const html = buildLandingHtml({ ...page, posterImages: [null, POSTER] });
    expect(html).toContain(`<figure class="poster"><h2 class="sr">الجودة اللي تستحقها</h2><a href="#order"><img src="${POSTER}" alt="الجودة اللي تستحقها — مصنوعة لتدوم — مقاومة للخدش — ستانلس ستيل — دقة متناهية"`);
    expect(html).toContain('<figcaption class="sr">الفولاذ المقاوم للصدأ.</figcaption>');
    // its words are in the picture: not drawn a second time
    expect(html).not.toContain('<p class="tag">الجودة اللي تستحقها</p>');
  });

  it('opens with the AI poster of the first section, keeping a real title for the page', () => {
    const html = buildLandingHtml({ ...page, posterImages: [POSTER] });
    expect(html).toContain('<figure class="poster hero-poster"><h1 class="sr" id="hero-title">زيد في هيبتك</h1>');
    expect(html).not.toContain('<section class="sx sx-hero"');
    // the next section follows at once: the canvas stays one long image
    expect(html).toMatch(/<\/figure>\n<section class="sx"><p class="tag">الجودة اللي تستحقها<\/p>/);
  });

  it('adds under a poster what it cannot carry: the comparison table', () => {
    const html = buildLandingHtml({ ...page, posterImages: [null, null, POSTER] });
    expect(html).toMatch(/<figure class="poster">[\s\S]*?<\/figure><section class="sx extra"><div class="compare">/);
  });

  it('only shows poster images that are image data or https', () => {
    const html = buildLandingHtml({ ...page, posterImages: [null, 'javascript:alert(1)'] });
    expect(html).not.toContain('javascript:alert(1)');
    expect(html).toContain('<p class="tag">الجودة اللي تستحقها</p>');
  });

  it('makes no poster for a section the page leaves out (a guarantee the seller does not offer)', () => {
    const guarantee = { title: 'حقك مضمون', guaranteeDetails: { title: 'ضمان 12 شهر' } };
    const html = buildLandingHtml({ ...page, sections: [...page.sections, guarantee], posterImages: [null, null, null, null, POSTER] });
    expect(html).not.toContain(POSTER);
    expect(html).not.toContain('حقك مضمون');
  });
});

describe('splitFeature', () => {
  it('splits "title: detail" and "title - detail" into the highlighted title and its line', () => {
    expect(splitFeature('Batterie longue durée : 12 heures sans recharge')).toEqual(['Batterie longue durée', '12 heures sans recharge']);
    expect(splitFeature('شحن سريع - ساعتين فقط')).toEqual(['شحن سريع', 'ساعتين فقط']);
  });

  it('takes the short first clause of a long feature as its title, and leaves short ones whole', () => {
    expect(splitFeature('Ultra léger, se glisse dans le sac sans peser du tout')).toEqual(['Ultra léger', 'se glisse dans le sac sans peser du tout']);
    expect(splitFeature('خفيف، محمول')).toEqual(['خفيف، محمول', '']);
    expect(splitFeature('  مقاومة للماء ')).toEqual(['مقاومة للماء', '']);
  });
});

describe('markHeadline', () => {
  it('highlights the last two words of a long title, the last one of a short one', () => {
    expect(markHeadline('تخلص من آلام الركبة نهائياً')).toBe('تخلص من آلام <mark>الركبة نهائياً</mark>');
    expect(markHeadline('Fini la fatigue')).toBe('Fini la <mark>fatigue</mark>');
    expect(markHeadline('Promo')).toBe('Promo');
  });

  it('keeps a spaced number in one piece and escapes the words', () => {
    expect(markHeadline('بـ 2 900 دج فقط')).toBe(`بـ 2${NBSP}900 <mark>دج فقط</mark>`);
    expect(markHeadline('<b>x</b> & <i>y</i>')).toBe('&lt;b&gt;x&lt;/b&gt; &amp; <mark>&lt;i&gt;y&lt;/i&gt;</mark>');
  });
});

describe('posterText', () => {
  it('takes the short image headline, its line, three features and the plain call to action', () => {
    expect(posterText(page.sections[1], TEXT.ar)).toEqual({ headline: 'الجودة اللي تستحقها', subline: 'مصنوعة لتدوم', labels: ['مقاومة للخدش', 'ستانلس ستيل', 'دقة متناهية'], button: 'تأكيد الطلب الآن' });
  });

  it('falls back to the title and the page\'s own button label', () => {
    expect(posterText({ title: 'Titre' }, TEXT.fr)).toEqual({ headline: 'Titre', subline: '', labels: [], button: 'Commander maintenant' });
  });
});

describe('pagePlan', () => {
  it('lists the shown sections, with the reviews where the AI\'s review section was', () => {
    expect(pagePlan(page.sections, { nationwide: true }).map((item) => (item.kind === 'reviews' ? 'reviews' : item.index))).toEqual([0, 1, 2, 'reviews']);
  });

  it('puts the reviews at the end when the copy has no review section', () => {
    expect(pagePlan(page.sections.slice(0, 2), {}).map((item) => (item.kind === 'reviews' ? 'reviews' : item.index))).toEqual([0, 1, 'reviews']);
  });
});
