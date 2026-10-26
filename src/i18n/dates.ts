import type { Language } from './types';

/** Locale used to format dates in each interface language. Algerian Arabic (ar-DZ) writes Latin digits. */
export const DATE_LOCALE: Record<Language, string> = { fr: 'fr-FR', ar: 'ar-DZ', en: 'en-GB' };

const NO_DATE = '—';

type DateInput = string | number | Date | null | undefined;

function toValidDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A date in the language of the interface; "—" when the value is missing or not a date. */
export function formatDate(value: DateInput, language: Language, options?: Intl.DateTimeFormatOptions): string {
  const date = toValidDate(value);
  return date ? new Intl.DateTimeFormat(DATE_LOCALE[language], options).format(date) : NO_DATE;
}

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['minute', 60_000],
  ['hour', 3_600_000],
  ['day', 86_400_000],
];

/** "5 minutes ago" in the language of the interface; the plain date once it is more than a week old. */
export function formatRelative(value: DateInput, language: Language, now: Date = new Date()): string {
  const date = toValidDate(value);
  if (!date) return NO_DATE;
  const elapsed = now.getTime() - date.getTime();
  if (elapsed >= 7 * 86_400_000) return formatDate(date, language, { dateStyle: 'medium' });
  const rtf = new Intl.RelativeTimeFormat(DATE_LOCALE[language], { numeric: 'auto' });
  if (elapsed < 60_000) return rtf.format(0, 'second');
  for (let i = RELATIVE_STEPS.length - 1; i >= 0; i--) {
    const [unit, size] = RELATIVE_STEPS[i];
    if (elapsed >= size) return rtf.format(-Math.floor(elapsed / size), unit);
  }
  return rtf.format(0, 'second');
}

/** A date and time (hours and minutes) in the language of the interface. */
export function formatDateTime(value: DateInput, language: Language, options?: Intl.DateTimeFormatOptions): string {
  return formatDate(value, language, { dateStyle: 'short', timeStyle: 'short', ...options });
}
