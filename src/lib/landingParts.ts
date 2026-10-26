/**
 * What every landing-page layout shares: the section types, the escaping and image checks, which sections are
 * shown (and what the seller has not vouched for), and the small pieces of markup used by both the web layout
 * (landingHtml.ts) and the long-image layout (landingPoster.ts).
 */
import { escapeHtml } from './html';
import type { CopyKey } from './landingCopy';
import { icon } from './landingIcons';
import type { PosterText } from './landingImages';
import { discountPercent } from './landingMoney';
import { keepNumbersTogether } from './numberSpacing';

export interface LpSection {
  title?: string;
  content?: string;
  benefits?: string[];
  /** written by the AI, so invented: never published (see sectionRoles) */
  testimonials?: { name?: string; text?: string; rating?: number }[];
  cta?: { variations?: { text?: string; type?: string }[]; subtext?: string };
  textOverlay?: { headline?: string; subtext?: string };
  comparisonTable?: { feature?: string; product?: string; competitor?: string }[];
  guaranteeDetails?: { title?: string; description?: string };
}

/** How delivery is priced: confirmed by phone depending on the wilaya, free, or a fixed amount added to the total. */
export type DeliveryMode = 'by-wilaya' | 'free' | 'fixed';

/** The promises shown on the page; cash on delivery is always there (the form is a cash-on-delivery order). */
export interface PagePromises {
  nationwide?: boolean;
  inspection?: boolean;
  guarantee?: boolean;
}

export const DEFAULT_PROMISES: Required<PagePromises> = { nationwide: true, inspection: false, guarantee: false };

/** A review from a real customer, typed in by the seller. */
export interface SellerReview {
  name?: string;
  text?: string;
}

export type Copy = Record<CopyKey, string>;

/** Escapes text for the page; spaced numbers are joined so Arabic copy never shows "900 2". */
export const e = (value: unknown) => escapeHtml(keepNumbersTogether(String(value ?? '')));
export const paragraphs = (text?: string) => (text ?? '').split(/\n+/).map((p) => p.trim()).filter(Boolean).map((p) => `<p>${e(p)}</p>`).join('');
export const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
// a price keeps its own direction: "2 900 DA" reads left to right, "2900 دج" right to left
export const money = (text: string, cls: string, id = '') => `<bdi${cls ? ` class="${cls}"` : ''}${id ? ` id="${id}"` : ''}>${e(text)}</bdi>`;
export const noBreakSpaces = (text: string) => text.replace(/[  ]/g, ' ');
// letters and digits only, to tell when a section title merely repeats the big title
export const comparable = (text: string | undefined) => (text ?? '').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();

/** An image address safe to put in src: an image data URL or an https URL, nothing else. */
export function safeImageSrc(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)) return v;
  if (/^https:\/\/[^\s"'<>]+$/.test(v)) return v;
  return null;
}

/**
 * Which of a section's button texts is published: the plain call to action the AI writes ("direct"). Its urgency and
 * benefit lines tend to invent stock, deadlines, discounts or free delivery. -1 when there is none.
 */
export function directCtaIndex(variations: { type?: string }[] | undefined): number {
  return (variations ?? []).findIndex((v) => v?.type === 'direct');
}

export const guaranteed = (promises: PagePromises) => Boolean(promises.guarantee || promises.inspection);

/** What becomes of a generated section on the page. */
export type SectionRole = 'shown' | 'reviews' | 'hidden';

/**
 * For each generated section: shown; the place of the reviews (the AI's review section, whose reviews are invented,
 * takes the seller's real ones or disappears); or hidden (empty, or about a guarantee the seller does not offer).
 * The publisher uses it too, so no AI image is made for a section the page leaves out.
 *
 * The review section is the one with clearly the most reviews: the AI often adds a review to every section, and
 * those sections keep their other content (no review is ever published). With no clear one, there is none.
 */
export function sectionRoles(sections: LpSection[], promises: PagePromises = DEFAULT_PROMISES): SectionRole[] {
  const counts = sections.map((s) => s.testimonials?.length ?? 0);
  const most = Math.max(0, ...counts);
  const reviewIndex = most > 0 && counts.filter((c) => c === most).length === 1 ? counts.indexOf(most) : -1;
  return sections.map((s, i) => {
    if (i === reviewIndex) return 'reviews';
    const other = s.comparisonTable?.length || s.benefits?.length;
    if (s.guaranteeDetails && !guaranteed(promises) && !other) return 'hidden';
    const body = s.title || s.content?.trim() || other || (s.guaranteeDetails && guaranteed(promises));
    return body ? 'shown' : 'hidden';
  });
}

export type PlanItem = { kind: 'section'; index: number; section: LpSection } | { kind: 'reviews' };

/**
 * The page's sections in order: each shown section (its guarantee box removed unless the seller offers one), and the
 * place of the seller's reviews (where the AI's review section was, else at the end).
 */
export function pagePlan(sections: LpSection[], promises: PagePromises): PlanItem[] {
  const roles = sectionRoles(sections, promises);
  const plan: PlanItem[] = [];
  let reviewsPlaced = false;
  sections.forEach((section, i) => {
    if (roles[i] === 'reviews') {
      if (!reviewsPlaced) plan.push({ kind: 'reviews' });
      reviewsPlaced = true;
      return;
    }
    if (roles[i] === 'hidden') return;
    plan.push({ kind: 'section', index: i, section: section.guaranteeDetails && !guaranteed(promises) ? { ...section, guaranteeDetails: undefined } : section });
  });
  if (!reviewsPlaced) plan.push({ kind: 'reviews' });
  return plan;
}

/** The words a poster of this section carries: its own (editable) copy, and its plain call to action. */
export function posterText(section: LpSection, tx: Copy): PosterText {
  const variations = section.cta?.variations ?? [];
  return {
    headline: section.textOverlay?.headline?.trim() || section.title?.trim() || '',
    subline: section.textOverlay?.subtext?.trim() || '',
    labels: (section.benefits ?? []).filter((b) => typeof b === 'string' && b.trim()).map((b) => b.trim()).slice(0, 3),
    button: variations[directCtaIndex(variations)]?.text?.trim() || tx.order,
  };
}

/**
 * A poster headline with its last words on a highlight band, the way these ads mark the problem or the promise:
 * the last two words of a long headline, the last one of a short one. Numbers stay in one piece.
 */
export function markHeadline(text: string): string {
  // split on plain spaces only: the no-break spaces inside a number keep it whole
  const words = keepNumbersTogether(text.trim()).split(/[^\S  ]+/).filter(Boolean);
  if (words.length < 2) return escapeHtml(words.join(''));
  const marked = words.length >= 4 ? 2 : 1;
  const plain = words.slice(0, words.length - marked).map(escapeHtml).join(' ');
  return `${plain} <mark>${words.slice(words.length - marked).map(escapeHtml).join(' ')}</mark>`;
}

export function priceRow(price: string, oldPrice: string, tx: Copy): string {
  if (!price) return '';
  const saving = discountPercent(price, oldPrice);
  return `<div class="price-row">${money(price, 'price-now')}${oldPrice ? `<s class="price-old">${money(oldPrice, 'old')}</s>` : ''}${saving ? `<span class="save" dir="ltr"><span class="sr">${e(tx.save)} </span>-${saving}%</span>` : ''}</div>`;
}

export function compareTable(section: LpSection, tx: Copy): string {
  if (!section.comparisonTable?.length) return '';
  const rows = section.comparisonTable.map((r) => `<tr><td>${e(r.feature)}</td><td class="us">${e(r.product)}</td><td>${e(r.competitor)}</td></tr>`).join('');
  return `<div class="compare"><table><thead><tr><th scope="col">${e(tx.feature)}</th><th scope="col" class="us">${e(tx.us)}</th><th scope="col">${e(tx.others)}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function guaranteeBox(section: LpSection): string {
  if (!section.guaranteeDetails?.title && !section.guaranteeDetails?.description) return '';
  return `<div class="guarantee">${icon('shield')}<div><strong>${e(section.guaranteeDetails.title)}</strong><p>${e(section.guaranteeDetails.description)}</p></div></div>`;
}

/** The seller's real reviews as quotes and screenshot images (empty lists when there are none). */
export function reviewPieces(reviews: SellerReview[], shots: string[], tx: Copy): { quotes: string[]; images: string[] } {
  const quotes = reviews
    .filter((r) => r.text?.trim())
    .slice(0, 12)
    .map((r) => `<figure class="review">${icon('quote')}<blockquote>${e(r.text?.trim())}</blockquote>${r.name?.trim() ? `<figcaption>${e(r.name.trim())}</figcaption>` : ''}</figure>`);
  const images = shots
    .map(safeImageSrc)
    .filter((src): src is string => src !== null)
    .slice(0, 8)
    .map((src) => `<img src="${src}" alt="${e(tx.reviewShot)}" loading="lazy" decoding="async">`);
  return { quotes, images };
}
