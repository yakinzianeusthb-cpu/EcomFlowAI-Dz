/** What a brand kit may contain. Its values end up in prompts and in generated pages, so each one is constrained. */

export const BRAND_STYLES = ['minimal', 'luxury', 'bold', 'playful', 'natural', 'tech', 'classic'] as const;
export type BrandStyle = (typeof BRAND_STYLES)[number];

export const BRAND_ERRORS = {
  colors: 'Couleurs invalides (6 codes hexadécimaux maximum).',
  font: 'Nom de police invalide.',
  styles: 'Style de marque invalide.',
  logo: 'Logo introuvable.',
  tooLong: 'Un des champs est trop long.',
} as const;

const TEXT_LIMITS = { brandName: 80, tone: 200, audience: 1000, instructions: 2000 } as const;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const FONT = /^[\p{L}\p{N} -]{0,60}$/u;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BrandKitInput {
  brandName?: string;
  colors?: string[];
  headingFont?: string;
  bodyFont?: string;
  tone?: string;
  audience?: string;
  instructions?: string;
  styles?: BrandStyle[];
  logoAssetId?: string | null;
}

/** Validates only the fields that are sent (the brand kit is always updated, never created from scratch). */
export function parseBrandKitInput(body: unknown): { data: BrandKitInput } | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const data: BrandKitInput = {};

  for (const key of Object.keys(TEXT_LIMITS) as (keyof typeof TEXT_LIMITS)[]) {
    if (b[key] === undefined) continue;
    const value = b[key];
    if (typeof value !== 'string' || value.trim().length > TEXT_LIMITS[key]) return { error: BRAND_ERRORS.tooLong };
    data[key] = value.trim();
  }
  if (b.colors !== undefined) {
    if (!Array.isArray(b.colors) || b.colors.length > 6 || !b.colors.every((c) => typeof c === 'string' && HEX.test(c))) return { error: BRAND_ERRORS.colors };
    data.colors = [...new Set((b.colors as string[]).map((c) => c.toLowerCase()))];
  }
  for (const key of ['headingFont', 'bodyFont'] as const) {
    if (b[key] === undefined) continue;
    if (typeof b[key] !== 'string' || !FONT.test(b[key] as string)) return { error: BRAND_ERRORS.font };
    data[key] = (b[key] as string).trim();
  }
  if (b.styles !== undefined) {
    if (!Array.isArray(b.styles) || b.styles.length > 5 || !b.styles.every((s) => (BRAND_STYLES as readonly unknown[]).includes(s))) return { error: BRAND_ERRORS.styles };
    data.styles = [...new Set(b.styles as BrandStyle[])];
  }
  if (b.logoAssetId !== undefined) {
    if (b.logoAssetId !== null && (typeof b.logoAssetId !== 'string' || !UUID.test(b.logoAssetId))) return { error: BRAND_ERRORS.logo };
    data.logoAssetId = b.logoAssetId as string | null;
  }
  return { data };
}
