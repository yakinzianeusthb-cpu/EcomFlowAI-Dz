import { describe, expect, it } from 'vitest';
import { DATE_LOCALE, formatDate, formatDateTime, formatRelative } from '../../src/i18n/dates';

// 5 March 2026, 14:07 UTC. Everything is formatted in UTC so the result does not depend on the machine's time zone.
const WHEN = '2026-03-05T14:07:00Z';
// Arabic output carries invisible direction marks; they are irrelevant to what the user reads.
const clean = (s: string) => s.replace(/[‎‏؜]/g, '');

describe('formatDate', () => {
  it('uses day/month/year order in French and English (UK)', () => {
    expect(formatDate(WHEN, 'fr', { timeZone: 'UTC' })).toBe('05/03/2026');
    expect(formatDate(WHEN, 'en', { timeZone: 'UTC' })).toBe('05/03/2026');
  });

  it('keeps Latin digits in Arabic, as Algerian users expect', () => {
    const text = clean(formatDate(WHEN, 'ar', { timeZone: 'UTC' }));
    expect(text).toMatch(/^0?5\/0?3\/2026$/);
  });

  it('writes the month in the language of the interface', () => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } as const;
    expect(formatDate(WHEN, 'fr', options)).toBe('5 mars 2026');
    expect(formatDate(WHEN, 'en', options)).toBe('5 March 2026');
    expect(clean(formatDate(WHEN, 'ar', options))).toContain('مارس');
  });

  it('accepts a Date, a timestamp or an ISO string', () => {
    const options = { timeZone: 'UTC' } as const;
    const expected = formatDate(WHEN, 'fr', options);
    expect(formatDate(new Date(WHEN), 'fr', options)).toBe(expected);
    expect(formatDate(Date.parse(WHEN), 'fr', options)).toBe(expected);
  });

  it('shows a dash for a missing or invalid date instead of throwing', () => {
    expect(formatDate(null, 'fr')).toBe('—');
    expect(formatDate(undefined, 'ar')).toBe('—');
    expect(formatDate('not a date', 'en')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('adds the time, in 24-hour format for French', () => {
    expect(formatDateTime(WHEN, 'fr', { timeZone: 'UTC' })).toMatch(/^05\/03\/2026,? 14:07$/);
  });

  it('shows a dash for an invalid value', () => {
    expect(formatDateTime('nope', 'fr')).toBe('—');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-03-05T14:07:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it('says how long ago, in the language of the interface', () => {
    expect(formatRelative(ago(5 * 60_000), 'fr', now)).toBe('il y a 5 minutes');
    expect(formatRelative(ago(5 * 60_000), 'en', now)).toBe('5 minutes ago');
    expect(formatRelative(ago(3 * 3_600_000), 'en', now)).toBe('3 hours ago');
    expect(formatRelative(ago(2 * 86_400_000), 'en', now)).toBe('2 days ago');
    expect(formatRelative(ago(5 * 60_000), 'ar', now)).toMatch(/[؀-ۿ]/);
  });

  it('says "now" for the last minute and gives the date after a week', () => {
    expect(formatRelative(ago(20_000), 'en', now)).toBe('now');
    expect(formatRelative(ago(10 * 86_400_000), 'fr', now)).toBe(formatDate(ago(10 * 86_400_000), 'fr', { dateStyle: 'medium' }));
  });

  it('shows a dash for an invalid value', () => {
    expect(formatRelative('nope', 'fr', now)).toBe('—');
  });
});

describe('DATE_LOCALE', () => {
  it('covers every interface language', () => {
    expect(Object.keys(DATE_LOCALE).sort()).toEqual(['ar', 'en', 'fr']);
  });
});
