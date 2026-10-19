/**
 * Builds a ready-to-publish landing page (one self-contained HTML file) from what the landing-page generator wrote:
 * the copy of each section, the colour palette and the product photos, plus a cash-on-delivery order form.
 * Orders are sent to the seller's WhatsApp and/or to a web address of their choice (e.g. a Google Sheets script).
 * Every piece of text is escaped: the copy comes from the AI and must never become markup.
 */
import { escapeHtml } from './html';
import { joinDigitGroups, keepNumbersTogether } from './numberSpacing';

export type PageLanguage = 'ar' | 'fr' | 'en';

export interface LpSection {
  title?: string;
  content?: string;
  benefits?: string[];
  testimonials?: { name?: string; text?: string; rating?: number }[];
  cta?: { variations?: { text?: string; type?: string }[]; subtext?: string };
  textOverlay?: { headline?: string; subtext?: string };
  comparisonTable?: { feature?: string; product?: string; competitor?: string }[];
  guaranteeDetails?: { title?: string; description?: string };
}

export interface LandingPageInput {
  productName: string;
  /** The language chosen in the tool ("Arabe / Darija Algérienne", "Français"...) or a page language code. */
  language?: string;
  sections: LpSection[];
  colorPalette?: string[];
  /** Product photos (data URLs), used for the hero and, when there are several, along the page. */
  photos: string[];
  /** AI images made for a section (same order as `sections`); they take the place of the photos. */
  sectionImages?: (string | null | undefined)[];
  price?: string;
  oldPrice?: string;
  /** Seller's WhatsApp number, international format (213...). */
  whatsapp?: string;
  /** Optional https address that receives each order as JSON (e.g. a Google Apps Script web app). */
  webhookUrl?: string;
}

export const WILAYAS = [
  '01 - Adrar - أدرار', '02 - Chlef - الشلف', '03 - Laghouat - الأغواط', '04 - Oum El Bouaghi - أم البواقي', '05 - Batna - باتنة',
  '06 - Béjaïa - بجاية', '07 - Biskra - بسكرة', '08 - Béchar - بشار', '09 - Blida - البليدة', '10 - Bouira - البويرة',
  '11 - Tamanrasset - تمنراست', '12 - Tébessa - تبسة', '13 - Tlemcen - تلمسان', '14 - Tiaret - تيارت', '15 - Tizi Ouzou - تيزي وزو',
  '16 - Alger - الجزائر', '17 - Djelfa - الجلفة', '18 - Jijel - جيجل', '19 - Sétif - سطيف', '20 - Saïda - سعيدة',
  '21 - Skikda - سكيكدة', '22 - Sidi Bel Abbès - سيدي بلعباس', '23 - Annaba - عنابة', '24 - Guelma - قالمة', '25 - Constantine - قسنطينة',
  '26 - Médéa - المدية', '27 - Mostaganem - مستغانم', "28 - M'Sila - المسيلة", '29 - Mascara - معسكر', '30 - Ouargla - ورقلة',
  '31 - Oran - وهران', '32 - El Bayadh - البيض', '33 - Illizi - إليزي', '34 - Bordj Bou Arréridj - برج بوعريريج', '35 - Boumerdès - بومرداس',
  '36 - El Tarf - الطارف', '37 - Tindouf - تندوف', '38 - Tissemsilt - تيسمسيلت', '39 - El Oued - الوادي', '40 - Khenchela - خنشلة',
  '41 - Souk Ahras - سوق أهراس', '42 - Tipaza - تيبازة', '43 - Mila - ميلة', '44 - Aïn Defla - عين الدفلى', '45 - Naâma - النعامة',
  '46 - Aïn Témouchent - عين تموشنت', '47 - Ghardaïa - غرداية', '48 - Relizane - غليزان', '49 - Timimoun - تيميمون', '50 - Bordj Badji Mokhtar - برج باجي مختار',
  '51 - Ouled Djellal - أولاد جلال', '52 - Béni Abbès - بني عباس', '53 - In Salah - عين صالح', '54 - In Guezzam - عين قزام', '55 - Touggourt - تقرت',
  '56 - Djanet - جانت', "57 - El M'Ghair - المغير", '58 - El Meniaa - المنيعة',
];

/** Algerian mobile number: 05/06/07 followed by 8 digits, or the same with the 213 country code. */
export const DZ_PHONE = /^(?:0|\+?213)[567]\d{8}$/;

const TEXT: Record<PageLanguage, Record<string, string>> = {
  ar: {
    order: 'اطلب الآن', orderTitle: 'اطلب الآن — الدفع عند الاستلام', name: 'الاسم الكامل', phone: 'رقم الهاتف', wilaya: 'الولاية',
    chooseWilaya: 'اختر الولاية', address: 'البلدية / العنوان', quantity: 'الكمية', submit: 'تأكيد الطلب',
    thanks: 'شكراً! تم تسجيل طلبك، سنتصل بك قريباً لتأكيده.', badPhone: 'رقم الهاتف غير صحيح. مثال: 0555123456',
    missing: 'يرجى ملء جميع الحقول.', cod: 'الدفع عند الاستلام', delivery: 'توصيل إلى 58 ولاية', guarantee: 'ضمان الجودة',
    feature: 'الميزة', us: 'منتجنا', others: 'الآخرون', price: 'السعر', newOrder: 'طلب جديد',
  },
  fr: {
    order: 'Commander maintenant', orderTitle: 'Commandez — paiement à la livraison', name: 'Nom complet', phone: 'Téléphone', wilaya: 'Wilaya',
    chooseWilaya: 'Choisissez votre wilaya', address: 'Commune / adresse', quantity: 'Quantité', submit: 'Confirmer la commande',
    thanks: 'Merci ! Votre commande est enregistrée, nous vous appelons pour la confirmer.', badPhone: 'Numéro invalide. Exemple : 0555123456',
    missing: 'Merci de remplir tous les champs.', cod: 'Paiement à la livraison', delivery: 'Livraison dans les 58 wilayas', guarantee: 'Qualité garantie',
    feature: 'Critère', us: 'Notre produit', others: 'Les autres', price: 'Prix', newOrder: 'Nouvelle commande',
  },
  en: {
    order: 'Order now', orderTitle: 'Order now — pay on delivery', name: 'Full name', phone: 'Phone number', wilaya: 'Wilaya',
    chooseWilaya: 'Choose your wilaya', address: 'Town / address', quantity: 'Quantity', submit: 'Confirm my order',
    thanks: 'Thank you! Your order is in, we will call you to confirm it.', badPhone: 'Invalid phone number. Example: 0555123456',
    missing: 'Please fill in every field.', cod: 'Cash on delivery', delivery: 'Delivery to all 58 wilayas', guarantee: 'Quality guaranteed',
    feature: 'Feature', us: 'Our product', others: 'Others', price: 'Price', newOrder: 'New order',
  },
};

/** The page language: the one chosen in the tool, otherwise the language the copy is written in. */
export function pageLanguage(choice: string | undefined, samples: string[]): PageLanguage {
  const c = (choice ?? '').trim();
  if (c === 'ar' || c === 'fr' || c === 'en') return c;
  if (/arab|darija|عرب/i.test(c)) return 'ar';
  if (/fran/i.test(c)) return 'fr';
  if (/angl|english/i.test(c)) return 'en';
  return samples.some((s) => /[؀-ۿ]/.test(s)) ? 'ar' : 'fr';
}

/** A CSS colour from the palette, only if it is a plain hex colour (anything else could inject CSS). */
export function safeColor(value: string | undefined, fallback: string): string {
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test((value ?? '').trim()) ? (value as string).trim() : fallback;
}

/** An image address safe to put in src: an image data URL or an https URL, nothing else. */
export function safeImageSrc(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  if (/^https:\/\/[^\s"'<>]+$/.test(v)) return v;
  return null;
}

/** Escapes text for the page; spaced numbers are joined so Arabic copy never shows "900 2". */
const e = (value: unknown) => escapeHtml(keepNumbersTogether(String(value ?? '')));
const paragraphs = (text?: string) => (text ?? '').split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${e(p)}</p>`).join('');
const img = (src: string | null, alt: string, cls = '') => (src ? `<img class="${cls}" src="${src}" alt="${e(alt)}" loading="lazy">` : '');

function sectionHtml(section: LpSection, image: string | null, tx: Record<string, string>, productName: string): string {
  const parts: string[] = [];
  if (image) parts.push(img(image, section.title || productName, 'section-img'));
  if (section.title) parts.push(`<h2>${e(section.title)}</h2>`);
  parts.push(paragraphs(section.content));
  if (section.benefits?.length) parts.push(`<ul class="benefits">${section.benefits.filter(Boolean).map((b) => `<li>${e(b)}</li>`).join('')}</ul>`);
  if (section.comparisonTable?.length) {
    const rows = section.comparisonTable.map((r) => `<tr><td>${e(r.feature)}</td><td class="us">${e(r.product)}</td><td>${e(r.competitor)}</td></tr>`).join('');
    parts.push(`<table class="compare"><thead><tr><th>${e(tx.feature)}</th><th>${e(tx.us)}</th><th>${e(tx.others)}</th></tr></thead><tbody>${rows}</tbody></table>`);
  }
  if (section.guaranteeDetails?.title || section.guaranteeDetails?.description) {
    parts.push(`<div class="guarantee"><strong>${e(section.guaranteeDetails.title)}</strong><p>${e(section.guaranteeDetails.description)}</p></div>`);
  }
  if (section.testimonials?.length) {
    parts.push(`<div class="reviews">${section.testimonials.map((r) => {
      const stars = '★'.repeat(Math.max(1, Math.min(5, Math.round(r.rating ?? 5))));
      return `<figure class="review"><div class="stars" aria-hidden="true">${stars}</div><blockquote>${e(r.text)}</blockquote><figcaption>${e(r.name)}</figcaption></figure>`;
    }).join('')}</div>`);
  }
  const ctaText = section.cta?.variations?.find((v) => v.text)?.text;
  if (ctaText) parts.push(`<a class="btn" href="#order">${e(ctaText)}</a>${section.cta?.subtext ? `<p class="cta-sub">${e(section.cta.subtext)}</p>` : ''}`);
  return `<section class="block">${parts.join('')}</section>`;
}

/**
 * The order form's script, the same in every page (the page's data sits in the JSON block before it). Kept as one
 * constant so the app's content security policy can allow exactly this script, by its hash, in the live preview.
 */
export const LANDING_PAGE_SCRIPT = `
(function () {
  var cfg = JSON.parse(document.getElementById('lp-config').textContent);
  var form = document.getElementById('order-form');
  var error = document.getElementById('order-error');
  var thanks = document.getElementById('order-thanks');
  var phoneOk = new RegExp(cfg.phonePattern);
  form.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = form.elements.quantity;
      q.value = Math.max(1, Math.min(20, (parseInt(q.value, 10) || 1) + parseInt(b.getAttribute('data-step'), 10)));
    });
  });
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var f = form.elements;
    var order = { product: cfg.product, price: cfg.price, name: f.name.value.trim(), phone: f.phone.value.replace(/[\\s.-]/g, ''), wilaya: f.wilaya.value, address: f.address.value.trim(), quantity: parseInt(f.quantity.value, 10) || 1, date: new Date().toISOString() };
    error.hidden = true;
    if (!order.name || !order.phone || !order.wilaya || !order.address) { error.textContent = cfg.messages.missing; error.hidden = false; return; }
    if (!phoneOk.test(order.phone)) { error.textContent = cfg.messages.badPhone; error.hidden = false; return; }
    if (cfg.webhook) {
      fetch(cfg.webhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(order) }).catch(function () {});
    }
    if (cfg.whatsapp) {
      var l = cfg.labels;
      var text = l.newOrder + ': ' + order.product + '\\n' + l.name + ': ' + order.name + '\\n' + l.phone + ': ' + order.phone + '\\n' + l.wilaya + ': ' + order.wilaya + '\\n' + l.address + ': ' + order.address + '\\n' + l.quantity + ': ' + order.quantity + (order.price ? '\\n' + l.price + ': ' + cfg.priceText : '');
      window.open('https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(text), '_blank');
    }
    form.hidden = true;
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
`;

export function buildLandingHtml(input: LandingPageInput): string {
  const sections = input.sections ?? [];
  const lang = pageLanguage(input.language, sections.flatMap((s) => [s.title ?? '', s.content ?? '']));
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const tx = TEXT[lang];
  const photos = (input.photos ?? []).map(safeImageSrc).filter((p): p is string => p !== null);
  const primary = safeColor(input.colorPalette?.[0], '#1d4ed8');
  const accent = safeColor(input.colorPalette?.[1], '#f59e0b');
  const name = input.productName?.trim() || tx.order;
  const hero = sections[0] ?? {};
  const headline = hero.textOverlay?.headline || hero.title || name;
  const subline = hero.textOverlay?.subtext || '';
  const price = input.price?.trim() ?? '';
  const oldPrice = input.oldPrice?.trim() ?? '';
  const priceHtml = price ? `<div class="price"><bdi dir="ltr"><b>${e(price)}</b></bdi>${oldPrice ? ` <bdi dir="ltr"><s class="old">${e(oldPrice)}</s></bdi>` : ''}</div>` : '';

  const imageFor = (i: number): string | null => {
    const ai = safeImageSrc(input.sectionImages?.[i]);
    if (ai) return ai;
    return photos.length > 1 && i % 2 === 0 ? photos[(i + 1) % photos.length] : null;
  };

  const config = {
    whatsapp: (input.whatsapp ?? '').replace(/\D/g, ''),
    webhook: /^https:\/\/[^\s"'<>]+$/.test((input.webhookUrl ?? '').trim()) ? input.webhookUrl!.trim() : '',
    product: name,
    // as typed for the order address; "2900" in the WhatsApp message, whose redirect drops no-break spaces
    price,
    priceText: joinDigitGroups(price),
    labels: { name: tx.name, phone: tx.phone, wilaya: tx.wilaya, address: tx.address, quantity: tx.quantity, price: tx.price, newOrder: tx.newOrder },
    messages: { thanks: tx.thanks, badPhone: tx.badPhone, missing: tx.missing },
    phonePattern: DZ_PHONE.source,
  };
  // "<" is written as < so no value can close the <script> element early
  const configJson = JSON.stringify(config).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(name)}</title>
<meta name="description" content="${e(subline || headline)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root { --primary: ${primary}; --accent: ${accent}; --text: #111827; --muted: #4b5563; --line: #e5e7eb; --bg: #ffffff; --soft: #f8fafc; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Cairo', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: var(--text); background: var(--soft); line-height: 1.7; }
main { max-width: 600px; margin: 0 auto; background: var(--bg); padding-bottom: 96px; }
img { max-width: 100%; display: block; }
.topbar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 16px; background: var(--bg); border-bottom: 1px solid var(--line); max-width: 600px; margin: 0 auto; }
.topbar strong { font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 22px; border-radius: 999px; background: var(--primary); color: #fff; font-weight: 800; font-size: 17px; text-decoration: none; border: 0; cursor: pointer; box-shadow: 0 8px 22px rgba(0,0,0,.18); }
.topbar .btn { padding: 8px 16px; font-size: 14px; box-shadow: none; }
.hero { padding: 0 0 24px; text-align: center; }
.hero img { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
.hero h1 { font-size: 28px; line-height: 1.35; margin: 18px 16px 6px; }
.hero .sub { color: var(--muted); margin: 0 16px 12px; font-size: 17px; }
.price { margin: 10px 0 16px; font-size: 30px; color: var(--accent); }
.price b { font-weight: 800; }
.price .old { color: #9ca3af; font-size: 20px; margin-inline-start: 8px; }
.trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin: 14px 16px 0; padding: 0; list-style: none; }
.trust li { background: var(--soft); border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; font-size: 13px; font-weight: 600; }
.block { padding: 28px 18px; border-top: 1px solid var(--line); }
.block h2 { font-size: 23px; line-height: 1.4; margin: 0 0 10px; }
.block p { margin: 0 0 10px; color: var(--muted); font-size: 16px; }
.section-img { border-radius: 16px; margin-bottom: 16px; width: 100%; }
.benefits { list-style: none; padding: 0; margin: 10px 0; }
.benefits li { padding: 8px 0; padding-inline-start: 30px; position: relative; font-weight: 600; }
.benefits li::before { content: '✓'; position: absolute; inset-inline-start: 0; top: 7px; width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 13px; display: grid; place-items: center; }
.compare { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 14px; }
.compare th, .compare td { border: 1px solid var(--line); padding: 8px; text-align: center; }
.compare th { background: var(--soft); }
.compare .us { color: var(--primary); font-weight: 800; }
.guarantee { border: 2px dashed var(--primary); border-radius: 14px; padding: 14px; margin: 12px 0; text-align: center; }
.reviews { display: grid; gap: 12px; margin: 12px 0; }
.review { margin: 0; padding: 14px; border-radius: 14px; background: var(--soft); border: 1px solid var(--line); }
.review blockquote { margin: 6px 0; }
.review figcaption { font-size: 14px; color: var(--muted); font-weight: 600; }
.stars { color: #f59e0b; letter-spacing: 2px; }
.cta-sub { font-size: 13px; margin-top: 6px; }
.block .btn { margin-top: 8px; width: 100%; }
.order { padding: 28px 18px; background: var(--soft); border-top: 4px solid var(--primary); }
.order h2 { text-align: center; margin: 0 0 4px; }
.order .price { text-align: center; }
form { display: grid; gap: 12px; }
label { display: grid; gap: 4px; font-weight: 600; font-size: 15px; }
input, select { font: inherit; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 12px; background: #fff; width: 100%; }
input:focus, select:focus { outline: 2px solid var(--primary); outline-offset: 1px; }
.qty { display: flex; align-items: center; gap: 10px; }
.qty button { width: 44px; height: 44px; border-radius: 12px; border: 1px solid #d1d5db; background: #fff; font-size: 22px; cursor: pointer; }
.qty input { text-align: center; width: 80px; }
.msg { padding: 12px; border-radius: 12px; font-weight: 600; text-align: center; }
.msg.error { background: #fef2f2; color: #b91c1c; }
.msg.ok { background: #ecfdf5; color: #047857; }
[hidden] { display: none !important; }
footer { max-width: 600px; margin: 0 auto; padding: 24px 16px 110px; text-align: center; color: var(--muted); font-size: 13px; }
.sticky-cta { position: fixed; inset-inline: 0; bottom: 0; margin: 0 auto; max-width: 600px; padding: 10px 14px calc(10px + env(safe-area-inset-bottom)); background: rgba(255,255,255,.96); border-top: 1px solid var(--line); z-index: 20; }
.sticky-cta .btn { width: 100%; }
</style>
</head>
<body>
<header class="topbar"><strong>${e(name)}</strong><a class="btn" href="#order">${e(tx.order)}</a></header>
<main>
<section class="hero">
${img(photos[0] ?? safeImageSrc(input.sectionImages?.[0]), name)}
<h1>${e(headline)}</h1>
${subline ? `<p class="sub">${e(subline)}</p>` : ''}
${priceHtml}
<a class="btn" href="#order">${e(tx.order)}</a>
<ul class="trust"><li>✓ ${e(tx.cod)}</li><li>✓ ${e(tx.delivery)}</li><li>✓ ${e(tx.guarantee)}</li></ul>
</section>
${sections.map((s, i) => sectionHtml(s, imageFor(i), tx, name)).join('\n')}
<section class="order" id="order">
<h2>${e(tx.orderTitle)}</h2>
${priceHtml}
<form id="order-form" novalidate>
<label>${e(tx.name)}<input name="name" autocomplete="name" required></label>
<label>${e(tx.phone)}<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="0555123456" required></label>
<label>${e(tx.wilaya)}<select name="wilaya" required><option value="">${e(tx.chooseWilaya)}</option>${WILAYAS.map((w) => `<option value="${e(w)}">${e(w)}</option>`).join('')}</select></label>
<label>${e(tx.address)}<input name="address" autocomplete="address-level2" required></label>
<label>${e(tx.quantity)}<span class="qty"><button type="button" data-step="-1" aria-label="-">−</button><input name="quantity" type="number" min="1" max="20" value="1" inputmode="numeric"><button type="button" data-step="1" aria-label="+">+</button></span></label>
<div class="msg error" id="order-error" role="alert" hidden></div>
<button class="btn" type="submit">${e(tx.submit)}</button>
</form>
<div class="msg ok" id="order-thanks" role="status" hidden>${e(tx.thanks)}</div>
</section>
</main>
<footer>${e(tx.cod)} · ${e(tx.delivery)} · ${e(tx.guarantee)}</footer>
<div class="sticky-cta"><a class="btn" href="#order">${e(tx.order)}${price ? ` — <bdi dir="ltr">${e(price)}</bdi>` : ''}</a></div>
<script type="application/json" id="lp-config">${configJson}</script>
<script>${LANDING_PAGE_SCRIPT}</script>
</body>
</html>
`;
}
