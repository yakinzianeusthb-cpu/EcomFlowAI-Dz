/**
 * What one AI image costs the seller, shown before they make it. Only Google's price is known here: about $0.04 for
 * an image at Gemini's default size (1K), billed on the seller's own key. The other services bill on the seller's
 * account at their own rate, which the app does not know, so no amount is shown for them.
 */
import type { ImageProvider } from './imageProviders';

/** US dollars per image, or null when the service sets its own price. */
export const IMAGE_COST_USD: Record<ImageProvider, number | null> = { gemini: 0.04, openai: null, fal: null, cloudflare: null, pollinations: null };

/** "0,04 $" / "$0.04", in the reader's locale; `count` images at once. */
export function formatImageCost(provider: ImageProvider, locale: string, count = 1): string | null {
  const unit = IMAGE_COST_USD[provider];
  if (unit === null) return null;
  const text = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(unit * count);
  // Arabic locales keep "US$" even with the narrow symbol
  return text.replace('US$', '$');
}
