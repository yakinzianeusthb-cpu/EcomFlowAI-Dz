/** Exports for an ad pack: the copy as a spreadsheet, and file names for downloaded creatives. */
import type { AdPack } from './adPack';
import type { AdFormat } from './adCreative';

const COLUMNS = ['concept', 'angle', 'hook', 'primary_text', 'headline', 'description', 'call_to_action', 'overlay', 'audience'] as const;

function cell(value: string): string {
  // a cell starting with = + - @ would run as a formula when the file is opened
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** The ad copy as CSV (UTF-8 with a byte-order mark, so Excel shows Arabic correctly). */
export function adPackToCsv(pack: AdPack): string {
  const rows = pack.concepts.map((c, i) =>
    [String(i + 1), c.angle, c.hook, c.primaryText, c.headline, c.description, c.callToAction, c.overlay, c.audience].map(cell).join(','),
  );
  return `﻿${[COLUMNS.join(','), ...rows].join('\r\n')}\r\n`;
}

export function creativeFileName(productName: string, conceptNumber: number, format: AdFormat): string {
  const slug = productName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'ad';
  return `${slug}-concept-${conceptNumber}-${format}.jpg`;
}
