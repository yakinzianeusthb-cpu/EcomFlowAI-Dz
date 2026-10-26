import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRIMARY_NAV, TAB_TITLES } from '../../src/lib/nav';
import { SECTION_ART, sectionPicture, type SectionId } from '../../src/lib/sections';

const DIR = path.resolve(__dirname, '../../src/assets/sections');

describe('section pictures', () => {
  it('gives every page and every menu entry its own picture', () => {
    const ids = [...Object.keys(TAB_TITLES), ...PRIMARY_NAV.map((entry) => entry.id), 'admin'] as SectionId[];
    for (const id of ids) expect(sectionPicture(id), id).toMatch(/\.webp/);
    // the menu entries never share a picture
    const files = PRIMARY_NAV.map((entry) => SECTION_ART[entry.id].file);
    expect(new Set(files).size).toBe(files.length);
  });

  it('ships a WebP file for every picture, no unused file, and the licence of the set', () => {
    const used = new Set(Object.values(SECTION_ART).map((art) => `${art.file}.webp`));
    const shipped = fs.readdirSync(DIR).filter((f) => f.endsWith('.webp'));
    expect(shipped.sort()).toEqual([...used].sort());
    for (const file of shipped) {
      const bytes = fs.readFileSync(path.join(DIR, file));
      expect(bytes.toString('ascii', 0, 4) + bytes.toString('ascii', 8, 12), file).toBe('RIFFWEBP');
      // small enough for the menu to stay light
      expect(bytes.length, file).toBeLessThan(8 * 1024);
    }
    expect(fs.readFileSync(path.join(DIR, 'LICENSE.txt'), 'utf8')).toMatch(/MIT License[\s\S]*Copyright \(c\) Microsoft Corporation/);
  });

  it('gives each picture a halo colour written as a hex colour', () => {
    for (const [id, art] of Object.entries(SECTION_ART)) expect(art.glow, id).toMatch(/^#[0-9a-f]{6}$/);
  });
});
