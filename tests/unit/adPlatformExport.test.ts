import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { AdConcept } from '../../src/lib/adPack';
import { normalizePlatformCopy, type PlatformCopy } from '../../src/lib/adPlatforms';
import { googleAssetsCsv, googleSearchCsv, guideText, packImageName, packZipName, snapchatCsv, tiktokCsv, zipPack } from '../../src/lib/adPlatformExport';

const concept = (n: number, extra: Partial<AdConcept> = {}): AdConcept => ({
  id: `c${n}`, angle: `Angle ${n}`, hook: 'Accroche', primaryText: 'Texte principal.', headline: `Titre ${n}`, description: '',
  callToAction: 'ORDER_NOW', overlay: 'Sur l’image', audience: '', ...extra,
});
const CONCEPTS = [concept(1), concept(2, { callToAction: 'SHOP_NOW' })];
const copy = (patch: Partial<PlatformCopy> = {}): PlatformCopy => ({
  ...normalizePlatformCopy({
    tiktok: [{ concept: 1, adText: 'Texte TikTok, avec virgule' }, { concept: 2, adText: '=SOMME(A1)' }],
    snapchat: [{ concept: 1, headline: 'Titre Snap' }, { concept: 2, headline: 'اطلب الآن' }],
    google: { headlines: ['Hachoir Pro', 'Livraison 58 wilayas', 'Paiement à la livraison'], descriptions: ['Description une.', 'Description deux.'], longHeadline: 'Le hachoir électrique', path1: 'hachoir', path2: 'promo', youtubeHeadline: 'Le hachoir qui coupe tout' },
  }, CONCEPTS, { brandName: 'Cuisine DZ', productName: 'Hachoir' }),
  finalUrl: 'https://boutique.example.dz/hachoir',
  ...patch,
});
const lines = (csv: string) => csv.replace(/^﻿/, '').trimEnd().split('\r\n');

describe('spreadsheets', () => {
  it('start with a byte-order mark and use Windows line ends, so Excel reads Arabic', () => {
    for (const csv of [tiktokCsv(copy(), CONCEPTS, []), snapchatCsv(copy(), CONCEPTS, []), googleSearchCsv(copy(), { campaign: 'C', adGroup: 'G' }), googleAssetsCsv(copy(), 'ORDER_NOW', 'fr')]) {
      expect(csv.startsWith('﻿')).toBe(true);
      expect(csv.endsWith('\r\n')).toBe(true);
    }
  });

  it('TikTok: one row per concept with its text, name, button and image; quoted when needed; never a formula', () => {
    const [header, row1, row2] = lines(tiktokCsv(copy(), CONCEPTS, ['carousel/hachoir-01.jpg', 'carousel/hachoir-02.jpg']));
    expect(header).toBe('concept,angle,ad_text,display_name,call_to_action,carousel_image');
    expect(row1).toBe('1,Angle 1,"Texte TikTok, avec virgule",Cuisine DZ,Order now,carousel/hachoir-01.jpg');
    expect(row2).toBe("2,Angle 2,'=SOMME(A1),Cuisine DZ,Shop now,carousel/hachoir-02.jpg");
  });

  it('Snapchat: one row per concept, Arabic kept as it is', () => {
    const [header, , row2] = lines(snapchatCsv(copy(), CONCEPTS, ['a.jpg', 'b.jpg']));
    expect(header).toBe('concept,brand_name,headline,call_to_action,image');
    expect(row2).toBe('2,Cuisine DZ,اطلب الآن,Shop Now,b.jpg');
  });

  it('Google Ads Editor: the header names Editor recognises, one column per text, values in line with them', () => {
    const [header, row] = lines(googleSearchCsv(copy(), { campaign: 'Campagne hachoir', adGroup: 'Hachoir' }));
    expect(header).toBe('Campaign,Ad group,Headline 1,Headline 2,Headline 3,Description 1,Description 2,Path 1,Path 2,Final URL');
    expect(row).toBe('Campagne hachoir,Hachoir,Hachoir Pro,Livraison 58 wilayas,Paiement à la livraison,Description une.,Description deux.,hachoir,promo,https://boutique.example.dz/hachoir');
  });

  it('Google Ads Editor: keeps the sign of "-30 %" (Editor would show a leading apostrophe) but still escapes formulas', () => {
    const c = copy();
    const signed = { ...c, google: { ...c.google, headlines: ['-30% aujourd’hui', '+213 livraison', '=HYPERLINK("x")', '@cmd', '-cmd|calc'] } };
    const [, row] = lines(googleSearchCsv(signed, { campaign: 'C', adGroup: 'G' }));
    expect(row.startsWith('C,G,-30% aujourd’hui,+213 livraison,')).toBe(true);
    expect(row).toContain(`"'=HYPERLINK(""x"")"`);
    expect(row).toContain(",'@cmd,");
    expect(row).toContain(",'-cmd|calc,");
  });

  it('the human-facing spreadsheets keep the full formula guard', () => {
    const c = copy();
    const [, row1] = lines(tiktokCsv({ ...c, tiktok: [{ ...c.tiktok[0], adText: '-30% aujourd’hui' }] }, CONCEPTS, []));
    expect(row1).toContain(",'-30% aujourd’hui,");
  });

  it('Google Ads Editor: grows to 15 headlines and 4 descriptions', () => {
    const c = copy();
    const full = { ...c, google: { ...c.google, headlines: Array.from({ length: 15 }, (_, i) => `Titre ${i + 1}`), descriptions: ['a', 'b', 'c', 'd'] } };
    const [header] = lines(googleSearchCsv(full, { campaign: 'C', adGroup: 'G' }));
    expect(header).toContain('Headline 15,Description 1');
    expect(header).toContain('Description 4,Path 1');
  });

  it('Google display and YouTube texts: five display headlines at most, the YouTube button within 10 characters', () => {
    const c = copy();
    const many = { ...c, google: { ...c.google, headlines: Array.from({ length: 8 }, (_, i) => `Titre ${i + 1}`) } };
    const rows = lines(googleAssetsCsv(many, 'ORDER_NOW', 'ar'));
    expect(rows.filter((r) => r.startsWith('Display headline,'))).toHaveLength(5);
    expect(rows).toContain('Business name,Cuisine DZ');
    expect(rows).toContain('YouTube call to action,اطلب الآن');
    expect(rows).toContain('Final URL,https://boutique.example.dz/hachoir');
  });
});

describe('guideText', () => {
  it('numbers the steps and adds the notes', () => {
    const text = guideText('TikTok - Hachoir', ['Créer la campagne', 'Importer'], ['Note']);
    expect(text).toBe('﻿TikTok - Hachoir\r\n\r\n1. Créer la campagne\r\n2. Importer\r\n\r\nNote\r\n');
  });
});

describe('zipPack', () => {
  it('holds the texts and the pictures exactly as given', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 0xff, 0xd9]);
    const zip = zipPack([
      { name: 'tiktok-ad-texts.csv', data: '﻿concept,ad_text\r\n1,اطلب الآن\r\n' },
      { name: 'carousel/hachoir-01.jpg', data: jpeg },
    ]);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(['carousel/hachoir-01.jpg', 'tiktok-ad-texts.csv']);
    const csv = files['tiktok-ad-texts.csv'];
    // the byte-order mark is really in the file (a default decoder would hide it)
    expect([...csv.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(new TextDecoder('utf-8', { ignoreBOM: true }).decode(csv)).toBe('﻿concept,ad_text\r\n1,اطلب الآن\r\n');
    expect([...files['carousel/hachoir-01.jpg']]).toEqual([...jpeg]);
  });
});

describe('file names', () => {
  it('are plain ASCII, so every zip tool and ads manager accepts them', () => {
    expect(packZipName('Hachoir Pro 3000', 'tiktok')).toBe('hachoir-pro-3000-tiktok-pack.zip');
    expect(packZipName('مفرمة', 'google')).toBe('ad-google-pack.zip');
    expect(packImageName('carousel', 'Hachoir', 3)).toBe('carousel/hachoir-03.jpg');
    expect(packImageName('images', 'Hachoir', 1, 'landscape')).toBe('images/hachoir-01-landscape.jpg');
  });
});
