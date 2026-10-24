/**
 * The files of each platform pack: spreadsheets of the texts and the zip that holds them with the pictures and the
 * guide. Pure. Spreadsheets are UTF-8 with a byte-order mark, so Excel and Google Ads Editor read Arabic correctly.
 */
import { strToU8, zipSync, type Zippable } from 'fflate';
import { csvCell, fileSlug } from './adExport';
import type { AdConcept, AdCta } from './adPack';
import { platformCta, youtubeCta, type PackPlatform, type PlatformCopy } from './adPlatforms';
import type { ProjectLanguage } from './projectRules';

const BOM = '﻿';
const toCsv = (rows: string[][], formula?: RegExp) => `${BOM}${rows.map((row) => row.map((cell) => csvCell(cell, formula)).join(',')).join('\r\n')}\r\n`;

/**
 * Google Ads Editor imports each cell as typed, so a leading ' would show up in the ad: only what a spreadsheet would
 * really run is escaped (= and @, and + or - before a letter), and "-30 %" or "+213…" keep their sign.
 */
const EDITOR_FORMULA_START = /^(?:[=@\t\r]|[+-](?![\d\s.,%]))/;
const conceptOf = (concepts: AdConcept[], id: string) => concepts.find((c) => c.id === id);

/** TikTok: one row per concept, to copy into TikTok Ads Manager. */
export function tiktokCsv(copy: PlatformCopy, concepts: AdConcept[], imageNames: string[]): string {
  const rows = [['concept', 'angle', 'ad_text', 'display_name', 'call_to_action', 'carousel_image']];
  copy.tiktok.forEach((ad, i) => {
    const concept = conceptOf(concepts, ad.conceptId);
    rows.push([String(i + 1), concept?.angle ?? '', ad.adText, copy.brandName, platformCta('tiktok', concept?.callToAction ?? 'SHOP_NOW'), imageNames[i] ?? '']);
  });
  return toCsv(rows);
}

/** Snapchat: one row per concept, with the picture that goes with it. */
export function snapchatCsv(copy: PlatformCopy, concepts: AdConcept[], imageNames: string[]): string {
  const rows = [['concept', 'brand_name', 'headline', 'call_to_action', 'image']];
  copy.snapchat.forEach((ad, i) => {
    const concept = conceptOf(concepts, ad.conceptId);
    rows.push([String(i + 1), copy.brandName, ad.headline, platformCta('snapchat', concept?.callToAction ?? 'SHOP_NOW'), imageNames[i] ?? '']);
  });
  return toCsv(rows);
}

/**
 * One responsive search ad for Google Ads Editor (Account > Import > From file). The headers are the names Editor
 * recognises (Google's "CSV file columns" reference); there are as many headline and description columns as texts.
 */
export function googleSearchCsv(copy: PlatformCopy, names: { campaign: string; adGroup: string }): string {
  const { headlines, descriptions, path1, path2 } = copy.google;
  const header = ['Campaign', 'Ad group', ...headlines.map((_, i) => `Headline ${i + 1}`), ...descriptions.map((_, i) => `Description ${i + 1}`), 'Path 1', 'Path 2', 'Final URL'];
  return toCsv([header, [names.campaign, names.adGroup, ...headlines, ...descriptions, path1, path2, copy.finalUrl.trim()]], EDITOR_FORMULA_START);
}

/** The texts of a responsive display ad and of a YouTube (Demand Gen) ad, one per line, to paste into Google Ads. */
export function googleAssetsCsv(copy: PlatformCopy, cta: AdCta, language: ProjectLanguage): string {
  const g = copy.google;
  const rows = [
    ['asset', 'text'],
    ...g.headlines.slice(0, 5).map((h) => ['Display headline', h]),
    ['Display long headline', g.longHeadline],
    ...g.descriptions.map((d) => ['Display description', d]),
    ['Business name', copy.brandName],
    ['YouTube headline', g.youtubeHeadline],
    ['YouTube long headline', g.longHeadline],
    ['YouTube call to action', youtubeCta(cta, language)],
    ['Final URL', copy.finalUrl.trim()],
  ];
  return toCsv(rows);
}

/** The step-by-step guide that goes in the zip (in the interface language). */
export function guideText(title: string, steps: string[], notes: string[] = []): string {
  const body = steps.map((step, i) => `${i + 1}. ${step}`).join('\r\n');
  return `${BOM}${title}\r\n\r\n${body}${notes.length ? `\r\n\r\n${notes.join('\r\n')}` : ''}\r\n`;
}

export interface PackFile {
  name: string;
  data: Uint8Array | string;
}

/** One zip for the pack: texts are compressed, pictures stored as they are (a JPEG is already compressed). */
export function zipPack(files: PackFile[]): Uint8Array {
  const entries: Zippable = {};
  for (const file of files) {
    entries[file.name] = typeof file.data === 'string' ? [strToU8(file.data), { level: 6 }] : [file.data, { level: 0 }];
  }
  return zipSync(entries);
}

export const packZipName = (productName: string, platform: PackPlatform) => `${fileSlug(productName)}-${platform}-pack.zip`;

/** The name of picture `n` (from 1) of a pack, e.g. "carousel/lampe-01.jpg". */
export const packImageName = (folder: string, productName: string, n: number, suffix = '') =>
  `${folder}/${fileSlug(productName)}-${String(n).padStart(2, '0')}${suffix ? `-${suffix}` : ''}.jpg`;
