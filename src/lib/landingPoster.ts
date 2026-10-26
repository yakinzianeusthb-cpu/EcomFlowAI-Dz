/**
 * The long-image layout ("Affiche"): the page is one continuous canvas, like the long images Algerian shops publish,
 * with the order form on the same canvas. One gradient from top to bottom and no section blocks: photos that melt
 * into the canvas, round feature badges and the yellow button laid over the bottom of the first photo, titles on
 * brush bands, feature boxes over strips of the product photos. A section the AI drew as a poster is shown as that
 * image. The words are the seller's editable copy (posterText).
 */
import { icon, iconsFor, type IconName } from './landingIcons';
import { discountPercent } from './landingMoney';
import { compareTable, e, guaranteeBox, markHeadline, money, pagePlan, paragraphs, posterText, reviewPieces, type Copy, type LpSection, type PagePromises, type SellerReview } from './landingParts';

export interface PosterPage {
  tx: Copy;
  name: string;
  headline: string;
  subline: string;
  price: string;
  oldPrice: string;
  /** the opening picture: the first product photo, or the first section's AI image when there is no photo */
  heroImage: string | null;
  /** the product photos, for the picture strips under the feature boxes */
  photos: string[];
  promiseItems: { icon: IconName; text: string }[];
  reassurance: string;
  sections: LpSection[];
  promises: Required<PagePromises>;
  /** the picture of a section drawn by the page: its AI scene or a product photo */
  imageFor: (index: number) => string | null;
  /** the AI poster of a section (its words drawn in), if one was made */
  posterFor: (index: number) => string | null;
  reviews: SellerReview[];
  shots: string[];
}

/** round badges hold short labels only; longer ones become feature boxes */
const BADGE_MAX = 22;
/** a feature title longer than this is set smaller, so its box stays a few lines tall */
const LONG_FEATURE = 34;
/** feature boxes get photo strips from this many photos on (with fewer, every strip would show the same photo) */
const STRIP_PHOTOS = 2;

const button = (label: string, id = '') => `<a class="btn btn-cta" href="#order"${id ? ` id="${id}"` : ''}>${e(label)}<span class="cart">${icon('cart')}</span></a>`;
const cta = (label: string, p: PosterPage, id = '') => `${button(label, id)}<p class="cta-sub">${e(p.reassurance)}</p>`;

function badges(labels: string[]): string {
  const icons = iconsFor(labels);
  return `<ul class="badges">${labels.map((l, i) => `<li><span class="badge-ico">${icon(icons[i])}</span><span class="badge-label">${e(l)}</span></li>`).join('')}</ul>`;
}

/** "Titre : détail" becomes a highlighted title and its line, the way these posters write their features. */
export function splitFeature(label: string): [string, string] {
  const text = label.trim();
  const match = /^(.{2,40}?)\s*(?::|\s[-–—])\s+(.+)$/.exec(text);
  if (match) return [match[1].trim(), match[2].trim()];
  // a long feature with a short first clause: that clause is the title ("Léger, se glisse dans le sac")
  const clause = text.length > LONG_FEATURE ? /^([^،,]{4,30})[،,]\s*(.+)$/.exec(text) : null;
  return clause ? [clause[1].trim(), clause[2].trim()] : [text, ''];
}

/** Feature boxes; with `strips`, each laid over a strip of a product photo, the photos taken in turn from `start`. */
function rows(labels: string[], strips: string[] = [], start = 0): string {
  if (!labels.length) return '';
  const icons = iconsFor(labels);
  const items = labels.map((label, i) => {
    const [title, detail] = splitFeature(label);
    const box = `<span class="row-box"><span class="row-ico">${icon(icons[i])}</span><span class="row-text"><strong>${e(title)}</strong>${detail ? `<span>${e(detail)}</span>` : ''}</span></span>`;
    // the photo repeats one shown elsewhere on the page: decorative here
    const strip = strips.length ? `<img class="row-pic" src="${strips[(start + i) % strips.length]}" alt="" loading="lazy" decoding="async">` : '';
    return `<li${title.length > LONG_FEATURE ? ' class="long"' : ''}>${box}${strip}</li>`;
  });
  return `<ul class="rows${strips.length ? ' strips' : ''}">${items.join('')}</ul>`;
}

/** The price on a round sticker, with the saving when there is one. */
function priceSticker(p: PosterPage): string {
  if (!p.price) return '';
  const saving = discountPercent(p.price, p.oldPrice);
  return `<div class="sticker">${money(p.price, 'now')}${p.oldPrice ? `<s>${money(p.oldPrice, '')}</s>` : ''}${saving ? `<span class="cut" dir="ltr"><span class="sr">${e(p.tx.save)} </span>-${saving}%</span>` : ''}</div>`;
}

/** An AI poster: the image (its words are in it, and in its description for screen readers), a link to the form. */
function posterFigure(src: string, section: LpSection, p: PosterPage, hero: boolean): string {
  const words = posterText(section, p.tx);
  const description = [words.headline, words.subline, ...words.labels].filter(Boolean).join(' — ');
  const heading = hero ? `<h1 class="sr" id="hero-title">${e(p.headline)}</h1>` : words.headline ? `<h2 class="sr">${e(words.headline)}</h2>` : '';
  const text = (section.content ?? '').trim();
  return `<figure class="poster${hero ? ' hero-poster' : ''}">${heading}<a href="#order"><img src="${src}" alt="${e(description || p.name)}"${hero ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></a>${text ? `<figcaption class="sr">${e(text)}</figcaption>` : ''}</figure>`;
}

/** Laid over the bottom of the picture above (`lifted`), or simply under the text. */
function overlay(content: string, lifted: boolean): string {
  return content ? `<div class="${lifted ? 'lift' : 'flat'}">${content}</div>` : '';
}

/** The opening: big title, its line, the first photo with the price, badges and the button over its bottom, the text. */
function heroBlock(p: PosterPage): string {
  const first = p.sections[0] ?? {};
  const labels = posterText(first, p.tx).labels;
  const intro = paragraphs(first.content);
  const media = p.heroImage ? `<div class="hero-media"><img src="${p.heroImage}" alt="${e(p.name)}" fetchpriority="high" decoding="async">${priceSticker(p)}</div>` : '';
  const features = labels.length ? (labels.every((l) => l.length <= BADGE_MAX) ? badges(labels) : rows(labels)) : '';
  const parts = [
    p.headline !== p.name && `<p class="tag name">${e(p.name)}</p>`,
    `<h1 id="hero-title" class="headline">${markHeadline(p.headline)}</h1>`,
    p.subline && `<p class="pill">${e(p.subline)}</p>`,
    media || priceSticker(p),
    overlay(features + cta(p.tx.order, p, 'hero-cta'), Boolean(media)),
    intro && `<div class="prose">${intro}</div>`,
  ];
  return `<section class="sx sx-hero" aria-labelledby="hero-title">${parts.filter(Boolean).join('')}</section>`;
}

/** A section of the canvas: its title on a brush band, its line and text, its picture, the features over it, the button. */
function sectionBlock(index: number, section: LpSection, image: string | null, p: PosterPage): string {
  const words = posterText(section, p.tx);
  const heading = section.title?.trim() || words.headline;
  // the short image headline the AI wrote becomes a sticker above a longer title
  const tag = words.headline && words.headline !== heading ? words.headline : '';
  const prose = paragraphs(section.content);
  const benefits = (section.benefits ?? []).filter((b) => typeof b === 'string' && b.trim()).map((b) => b.trim());
  // a section without a picture of its own lays its features over strips of the product photos
  const strips = !image && p.photos.length >= STRIP_PHOTOS && benefits.length >= 2 ? p.photos : [];
  const features = rows(benefits, strips, index);
  const extras = compareTable(section, p.tx) + guaranteeBox(section);
  const action = section.cta ? cta(words.button, p) : '';
  // the button floats over the picture's bottom when nothing else goes there; otherwise it closes the section
  const actionFirst = !features && !extras;
  const parts = [
    tag && `<p class="tag">${e(tag)}</p>`,
    heading && `<h2 class="banner">${markHeadline(heading)}</h2>`,
    words.subline && `<p class="pill">${e(words.subline)}</p>`,
    prose && `<div class="prose">${prose}</div>`,
    image && `<figure class="sx-shot rv"><img src="${image}" alt="${e(heading || p.name)}" loading="lazy" decoding="async"></figure>`,
    overlay(features || (actionFirst ? action : ''), Boolean(image)),
    extras,
    !actionFirst && overlay(action, false),
  ].filter(Boolean);
  return parts.length ? `<section class="sx">${parts.join('')}</section>` : '';
}

/** What a poster image cannot carry: the comparison table and the guarantee, under it. */
function extrasBlock(section: LpSection, p: PosterPage): string {
  const extras = compareTable(section, p.tx) + guaranteeBox(section);
  return extras ? `<section class="sx extra">${extras}</section>` : '';
}

function reviewsBlock(p: PosterPage): string {
  const { quotes, images } = reviewPieces(p.reviews, p.shots, p.tx);
  if (!quotes.length && !images.length) return '';
  return `<section class="sx reviews-sx" aria-labelledby="reviews-title"><h2 id="reviews-title" class="banner">${markHeadline(p.tx.reviewsTitle)}</h2>${quotes.length ? `<div class="reviews rv">${quotes.join('')}</div>` : ''}${images.length ? `<div class="shots rv">${images.join('')}</div>` : ''}</section>`;
}

/** The canvas, from the opening to the last section; the order form follows on the same canvas. */
export function posterBody(p: PosterPage): string {
  const out: string[] = [];
  const plan = pagePlan(p.sections, p.promises);
  const first = plan.find((item) => item.kind === 'section' && item.index === 0);
  const heroPoster = first ? p.posterFor(0) : null;
  out.push(heroPoster && first?.kind === 'section' ? posterFigure(heroPoster, first.section, p, true) : heroBlock(p));
  for (const item of plan) {
    if (item.kind === 'reviews') {
      out.push(reviewsBlock(p));
      continue;
    }
    if (item.index === 0) {
      // the opening already carries this section's words; what it cannot carry follows
      out.push(extrasBlock(item.section, p));
      continue;
    }
    const poster = p.posterFor(item.index);
    out.push(poster ? posterFigure(poster, item.section, p, false) + extrasBlock(item.section, p) : sectionBlock(item.index, item.section, p.imageFor(item.index), p));
  }
  return `<div class="strip">${out.filter(Boolean).join('\n')}</div>`;
}
