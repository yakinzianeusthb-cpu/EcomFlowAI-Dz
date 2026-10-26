/**
 * Builds a ready-to-publish landing page (one self-contained HTML file) from what the landing-page generator wrote:
 * the copy of each section, the colour palette and the product photos, plus a cash-on-delivery order form with the
 * order total. Orders are sent to the seller's WhatsApp and/or to a web address of their choice (e.g. a Google
 * Sheets script). The look comes from one of the templates (landingTheme.ts, landingStyle.ts): a web page, or the
 * long-image page of posters (landingPoster.ts).
 *
 * Every piece of text is escaped: the copy comes from the AI and must never become markup. Only what the seller
 * vouches for is published as fact: customer reviews are the ones the seller adds (the reviews the AI writes for the
 * copy are invented, so their section is left out), and the delivery and guarantee promises are the seller's ticks.
 */
import { DZ_PHONE, TEXT, WILAYAS, pageLanguage, type PageLanguage } from './landingCopy';
import { icon, type IconName } from './landingIcons';
import { formatMoney, parsePrice, type MoneyFormat } from './landingMoney';
import {
  DEFAULT_PROMISES, comparable, compareTable, directCtaIndex, e, fill, guaranteeBox, markHeadline, money, noBreakSpaces, pagePlan, paragraphs,
  posterText, priceRow, reviewPieces, safeImageSrc, sectionRoles,
  type Copy, type DeliveryMode, type LpSection, type PagePromises, type SectionRole, type SellerReview,
} from './landingParts';
import { posterBody } from './landingPoster';
import { LANDING_PAGE_SCRIPT } from './landingScript';
import { landingCss } from './landingStyle';
import { THEMES, landingColors, toTemplate, type LandingTemplate } from './landingTheme';
import { joinDigitGroups } from './numberSpacing';

export { DEFAULT_PROMISES, DZ_PHONE, LANDING_PAGE_SCRIPT, WILAYAS, directCtaIndex, pageLanguage, posterText, safeImageSrc, sectionRoles };
export type { DeliveryMode, LandingTemplate, LpSection, PageLanguage, PagePromises, SectionRole, SellerReview };

export interface LandingPageInput {
  productName: string;
  /** The language chosen in the tool ("Arabe / Darija Algérienne", "Français"...) or a page language code. */
  language?: string;
  sections: LpSection[];
  colorPalette?: readonly string[];
  /** Product photos (data URLs), shown in the gallery at the top and, when there are several, along the page. */
  photos: string[];
  /** AI images made for a section (same order as `sections`); they take the place of the photos. */
  sectionImages?: (string | null | undefined)[];
  /** AI posters of the long-image template (same order as `sections`): the section's words drawn in the picture. */
  posterImages?: (string | null | undefined)[];
  price?: string;
  oldPrice?: string;
  /** Seller's WhatsApp number, international format (213...). */
  whatsapp?: string;
  /** Optional https address that receives each order as JSON (e.g. a Google Apps Script web app). */
  webhookUrl?: string;
  template?: LandingTemplate;
  /** The shop's name for the header and footer; the product name when empty. */
  storeName?: string;
  delivery?: { mode?: DeliveryMode; fee?: string };
  promises?: PagePromises;
  /** Reviews of real customers, and screenshots of them (image data URLs). */
  reviews?: SellerReview[];
  reviewShots?: string[];
}

interface SectionOptions {
  alt: boolean;
  flip: boolean;
  /** shown in place of the section's own title (null: no title, when it would repeat the big title) */
  title: string | undefined;
  /** the promises the seller ticked, under each button */
  reassurance: string;
}

function sectionHtml(section: LpSection, number: number, image: string | null, tx: Copy, productName: string, options: SectionOptions): string {
  const head = [`<div class="kicker">${String(number).padStart(2, '0')}</div>`];
  if (options.title) head.push(`<h2>${e(options.title)}</h2>`);
  const body: string[] = [];
  const prose = paragraphs(section.content);
  if (prose) body.push(`<div class="prose">${prose}</div>`);
  const benefits = (section.benefits ?? []).filter((b) => typeof b === 'string' && b.trim());
  if (benefits.length) body.push(`<ul class="checks">${benefits.map((b) => `<li><span class="mark">${icon('check')}</span><span>${e(b)}</span></li>`).join('')}</ul>`);
  body.push(compareTable(section, tx), guaranteeBox(section));
  if (section.cta) {
    const variations = section.cta.variations ?? [];
    const label = variations[directCtaIndex(variations)]?.text?.trim() || tx.order;
    // the AI's line under the button invents counts, ratings and stock: the seller's own promises stand there instead
    body.push(`<div class="sec-cta"><a class="btn" href="#order">${e(label)}${icon('arrow', 'go')}</a><p class="cta-sub">${e(options.reassurance)}</p></div>`);
  }
  const media = image ? `<figure class="sec-media rv"><img src="${image}" alt="${e(section.title || productName)}" loading="lazy" decoding="async"></figure>` : '';
  const layout = `${image ? 'media' : 'text'}${image && options.flip ? ' flip' : ''}`;
  return `<section class="sec${options.alt ? ' alt' : ''}"><div class="wrap sec-grid ${layout}">${media}<div class="sec-body rv"><div class="sec-title">${head.join('')}</div><div class="sec-rest">${body.join('')}</div></div></div></section>`;
}

/** The seller's real reviews: quotes and screenshots. Nothing when there are none. */
function reviewsHtml(reviews: SellerReview[], shots: string[], tx: Copy, alt: boolean): string {
  const { quotes, images } = reviewPieces(reviews, shots, tx);
  if (!quotes.length && !images.length) return '';
  return `<section class="sec${alt ? ' alt' : ''}" aria-labelledby="reviews-title"><div class="wrap"><div class="sec-head"><h2 id="reviews-title">${e(tx.reviewsTitle)}</h2></div>${quotes.length ? `<div class="reviews rv">${quotes.join('')}</div>` : ''}${images.length ? `<div class="shots rv">${images.join('')}</div>` : ''}</div></section>`;
}

interface Delivery {
  mode: DeliveryMode;
  fee: number;
  /** what the summary and the order say about delivery */
  text: string;
}

function deliveryOf(input: LandingPageInput, format: MoneyFormat | null, tx: Copy): Delivery {
  const mode = input.delivery?.mode ?? 'by-wilaya';
  if (mode === 'free') return { mode, fee: 0, text: tx.free };
  const fee = parsePrice(input.delivery?.fee);
  // a fixed price needs an amount, and a page price to add it to; otherwise delivery is confirmed by phone
  if (mode === 'fixed' && fee && format) return { mode, fee: fee.value, text: formatMoney({ ...format, value: fee.value }, fee.value) };
  return { mode: 'by-wilaya', fee: 0, text: tx.byWilaya };
}

function summaryHtml(format: MoneyFormat | null, delivery: Delivery, tx: Copy): string {
  const deliveryRow = `<div><span>${e(tx.deliveryLabel)}</span><span>${e(delivery.text)}</span></div>`;
  if (!format) return `<div class="summary">${deliveryRow}</div>`;
  const total = format.value + delivery.fee;
  // the amount and the "+ delivery" note are separate, so each keeps its own direction in an Arabic page
  const plus = delivery.mode === 'by-wilaya' ? `<span class="plus">${e(tx.plusDelivery)}</span>` : '';
  return `<div class="summary" aria-live="polite"><div><span>${e(tx.subtotal)} × <span id="sum-qty">1</span></span>${money(formatMoney(format, format.value), '', 'sum-sub')}</div>${deliveryRow}<div class="total"><span>${e(tx.total)}</span><span>${money(formatMoney(format, total), '', 'sum-total')}${plus}</span></div></div>`;
}

export function buildLandingHtml(input: LandingPageInput): string {
  const sections = input.sections ?? [];
  const lang = pageLanguage(input.language, sections.flatMap((s) => [s.title ?? '', s.content ?? '']));
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tx = TEXT[lang];
  const template = toTemplate(input.template);
  const colors = landingColors(input.colorPalette, template);
  const photos = (input.photos ?? []).map(safeImageSrc).filter((p): p is string => p !== null);
  const name = input.productName?.trim() || tx.order;
  const shop = input.storeName?.trim() || name;
  const hero = sections[0] ?? {};
  const headline = hero.textOverlay?.headline || hero.title || name;
  const subline = hero.textOverlay?.subtext || '';
  const price = input.price?.trim() ?? '';
  const oldPrice = input.oldPrice?.trim() ?? '';
  const format = parsePrice(price);
  const delivery = deliveryOf(input, format, tx);
  const promises = { ...DEFAULT_PROMISES, ...input.promises };
  const whatsapp = (input.whatsapp ?? '').replace(/\D/g, '');
  const reviews = input.reviews ?? [];
  const shots = input.reviewShots ?? [];

  // the gallery shows the product photos; without any, the first section's AI image (then not repeated below)
  const firstAi = safeImageSrc(input.sectionImages?.[0]);
  const gallery = photos.length ? photos : firstAi ? [firstAi] : [];
  const sceneFor = (i: number) => {
    const ai = safeImageSrc(input.sectionImages?.[i]);
    return ai && !(i === 0 && !photos.length) ? ai : null;
  };
  // web page: a photo on every other section; long-image page: a big photo on every other section (the photos in
  // turn after the opening one), the sections between laying their features over strips of the photos
  const webImageFor = (i: number): string | null => sceneFor(i) ?? (photos.length > 1 && i % 2 === 0 ? photos[(i + 1) % photos.length] : null);
  const posterImageFor = (i: number): string | null => sceneFor(i) ?? (i % 2 === 1 && photos.length ? photos[((i + 1) / 2) % photos.length] : null);

  const promiseItems: { icon: IconName; text: string }[] = [
    { icon: 'cash', text: tx.cod },
    ...(delivery.mode === 'free' ? [{ icon: 'gift' as const, text: tx.freeDelivery }] : []),
    ...(promises.nationwide ? [{ icon: 'truck' as const, text: tx.nationwide }] : []),
    ...(promises.inspection ? [{ icon: 'eye' as const, text: tx.inspection }] : []),
    ...(promises.guarantee ? [{ icon: 'shield' as const, text: tx.guarantee }] : []),
  ];
  const reassurance = promiseItems.slice(0, 2).map((p) => p.text).join(' · ');

  const galleryHtml = gallery.length
    ? `<div class="gallery"><div class="slides" id="slides"${gallery.length > 1 ? ` tabindex="0" role="region" aria-label="${e(tx.gallery)}"` : ''}>${gallery.map((src, i) => `<figure class="slide"><img src="${src}" alt="${e(i === 0 ? name : `${name} — ${fill(tx.photo, { n: i + 1 })}`)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></figure>`).join('')}</div>${gallery.length > 1 ? `<div class="dots">${gallery.map((_, i) => `<button type="button" class="dot" data-slide="${i}" aria-label="${e(fill(tx.photo, { n: i + 1 }))}" aria-current="${i === 0}"></button>`).join('')}</div>` : ''}</div>`
    : '';

  let body: string;
  if (template === 'poster') {
    body = posterBody({
      tx, name, headline, subline, price, oldPrice, promiseItems, reassurance, sections, promises, reviews, shots, photos,
      heroImage: gallery[0] ?? null,
      imageFor: posterImageFor,
      posterFor: (i) => safeImageSrc(input.posterImages?.[i]),
    });
  } else {
    // the sections, in order. The AI's review section (invented reviews) gives its place to the seller's real ones,
    // and its guarantee section (invented terms) shows only when the seller says they offer one.
    const blocks: string[] = [];
    let shown = 0;
    let withMedia = 0;
    for (const item of pagePlan(sections, promises)) {
      if (item.kind === 'reviews') {
        const real = reviewsHtml(reviews, shots, tx, blocks.length % 2 === 1);
        if (real) blocks.push(real);
        continue;
      }
      const image = webImageFor(item.index);
      const repeatsHeadline = item.index === 0 && comparable(item.section.title).startsWith(comparable(headline));
      blocks.push(sectionHtml(item.section, ++shown, image, tx, name, {
        alt: blocks.length % 2 === 1,
        flip: image ? withMedia++ % 2 === 1 : false,
        title: repeatsHeadline ? undefined : item.section.title,
        reassurance,
      }));
    }
    body = `<section class="hero" aria-labelledby="hero-title">
<div class="wrap hero-grid${gallery.length ? '' : ' solo'}">
${galleryHtml}
<div class="hero-info">
${headline !== name ? `<p class="eyebrow">${e(name)}</p>` : ''}
<h1 id="hero-title">${e(headline)}</h1>
${subline ? `<p class="lead">${e(subline)}</p>` : ''}
${priceRow(price, oldPrice, tx)}
<a class="btn" id="hero-cta" href="#order">${e(tx.order)}${icon('arrow', 'go')}</a>
<ul class="assure">${promiseItems.map((p) => `<li>${icon(p.icon)}<span>${e(p.text)}</span></li>`).join('')}</ul>
</div>
</div>
</section>
${blocks.join('\n')}`;
  }

  const config = {
    whatsapp,
    webhook: /^https:\/\/[^\s"'<>]+$/.test((input.webhookUrl ?? '').trim()) ? input.webhookUrl!.trim() : '',
    product: name,
    // as typed for the order address; "2900" in the WhatsApp message, whose redirect drops no-break spaces
    price,
    priceText: joinDigitGroups(price),
    deliveryText: noBreakSpaces(delivery.text),
    labels: { name: tx.name, phone: tx.phone, wilaya: tx.wilaya, address: tx.address, quantity: tx.quantity, price: tx.price, newOrder: tx.newOrder, total: tx.total, delivery: tx.deliveryLabel },
    messages: { thanks: tx.thanks, badPhone: tx.badPhone, missing: tx.missing },
    phonePattern: DZ_PHONE.source,
    money: format
      ? { unit: format.value, prefix: format.prefix, suffix: format.suffix, sep: format.sep, fee: delivery.fee, feeMode: delivery.mode, plusDelivery: tx.plusDelivery }
      : { unit: null, prefix: '', suffix: '', sep: '', fee: 0, feeMode: delivery.mode, plusDelivery: tx.plusDelivery },
  };
  // "<" is written as < so no value can close the <script> element early
  const configJson = JSON.stringify(config).replace(/</g, '\\u003c');
  const year = new Date().getFullYear();
  const isPoster = template === 'poster';
  const footer = `<footer class="foot"><div class="wrap"><strong>${e(shop)}</strong><p>${promiseItems.map((p) => e(p.text)).join(' · ')}</p><p>© ${year} ${e(shop)} — ${e(tx.rights)}</p></div></footer>`;

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${e(input.storeName?.trim() ? `${name} — ${shop}` : name)}</title>
<meta name="description" content="${e(subline || headline)}">
<meta name="theme-color" content="${isPoster ? colors.canvas : colors.brand}">
<meta property="og:type" content="product">
<meta property="og:title" content="${e(headline)}">
<meta property="og:description" content="${e(subline || name)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${THEMES[template].fonts.href}" rel="stylesheet">
<style>
${landingCss(template, colors)}
</style>
</head>
<body class="t-${template}">
<aside class="announce" aria-label="${e(tx.promisesLabel)}"><div class="wrap">${promiseItems.slice(0, 2).map((p) => `<span>${icon(p.icon)}${e(p.text)}</span>`).join('')}</div></aside>
<header class="top"><div class="wrap"><strong class="brand-name">${e(shop)}</strong><a class="btn btn-sm" href="#order">${e(tx.orderShort)}</a></div></header>
<main>
${body}
<section class="order-sec" id="order" aria-labelledby="order-title">
<div class="wrap">
<div class="sec-head"><h2 id="order-title">${isPoster ? markHeadline(tx.orderTitle) : e(tx.orderTitle)}</h2></div>
<ol class="steps"><li><span class="ico">${icon('pencil')}</span>${e(tx.step1)}</li><li><span class="ico">${icon('phone')}</span>${e(tx.step2)}</li><li><span class="ico">${icon('cash')}</span>${e(tx.step3)}</li></ol>
<div class="order-card">
<div class="order-head"><strong>${e(name)}</strong>${price ? `<span>${money(price, 'price-now')}${oldPrice ? ` <s class="price-old">${money(oldPrice, 'old')}</s>` : ''}</span>` : ''}</div>
<form id="order-form" novalidate>
<label class="field">${e(tx.name)}<input name="name" autocomplete="name" required></label>
<label class="field">${e(tx.phone)}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0555123456" dir="ltr" required></label>
<div class="pair">
<label class="field">${e(tx.wilaya)}<select name="wilaya" required><option value="">${e(tx.chooseWilaya)}</option>${WILAYAS.map((w) => `<option value="${e(w)}">${e(w)}</option>`).join('')}</select></label>
<label class="field">${e(tx.address)}<input name="address" autocomplete="address-level2" required></label>
</div>
<div class="field qty-row"><label for="qty">${e(tx.quantity)}</label><span class="qty"><button type="button" data-step="-1" aria-label="−1">−</button><input id="qty" name="quantity" type="number" min="1" max="20" value="1" inputmode="numeric"><button type="button" data-step="1" aria-label="+1">+</button></span></div>
${summaryHtml(format, delivery, tx)}
<div class="msg error" id="order-error" role="alert" hidden></div>
<button class="btn btn-block" type="submit">${e(tx.submit)}</button>
<p class="fine">${icon('shield')}<span>${e(tx.codNote)}</span></p>
</form>
<div class="msg ok" id="order-thanks" role="status" hidden>${e(tx.thanks)}</div>
${whatsapp ? `<a class="wa" href="https://wa.me/${whatsapp}?text=${encodeURIComponent(name)}" target="_blank" rel="noopener">${icon('message')}${e(tx.questions)}</a>` : ''}
</div>
</div>
</section>
${isPoster ? `${footer}\n` : ''}</main>
${isPoster ? '' : `${footer}\n`}<aside class="sticky away" id="sticky" aria-label="${e(tx.order)}"><div class="sticky-in">${price ? money(price, 'sticky-price') : ''}<a class="btn" href="#order">${e(tx.order)}</a></div></aside>
<script type="application/json" id="lp-config">${configJson}</script>
<script>${LANDING_PAGE_SCRIPT}</script>
</body>
</html>
`;
}
