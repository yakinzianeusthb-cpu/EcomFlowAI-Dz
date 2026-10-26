/**
 * The amounts on a landing page, read from the prices the seller typed ("2 900 DA", "2900 دج", "2.900 DA"): the
 * saving shown next to the old price and the order total. Nothing is computed when a price has no amount.
 */

export interface MoneyFormat {
  value: number;
  /** what is written before and after the number, kept as typed ("DA", "دج") */
  prefix: string;
  suffix: string;
  /** the thousands separator used ("" when none); a plain space becomes a no-break space so a number never wraps */
  sep: string;
}

// a number with groups of three ("2 900", "12.500", "1,250,000"), or digits alone
const AMOUNT = /\d{1,3}(?:([   .,])\d{3})+(?!\d)|\d+/;

export function parsePrice(text: string | undefined): MoneyFormat | null {
  const typed = (text ?? '').trim();
  const match = AMOUNT.exec(typed);
  if (!match) return null;
  const value = Number(match[0].replace(/\D/g, ''));
  if (!Number.isFinite(value) || value <= 0) return null;
  const sep = match[1] === undefined ? '' : match[1] === ' ' ? ' ' : match[1];
  return { value, prefix: typed.slice(0, match.index), suffix: typed.slice(match.index + match[0].length), sep };
}

/** An amount written the way the seller wrote their price. */
export function formatMoney(format: MoneyFormat, value: number): string {
  const digits = String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, format.sep);
  return `${format.prefix}${digits}${format.suffix}`;
}

/** The saving in percent when the old price is higher than the price; null otherwise. */
export function discountPercent(price: string | undefined, oldPrice: string | undefined): number | null {
  const now = parsePrice(price)?.value;
  const before = parsePrice(oldPrice)?.value;
  if (!now || !before || before <= now) return null;
  const percent = Math.round((1 - now / before) * 100);
  return percent >= 1 && percent <= 95 ? percent : null;
}
