/**
 * Points: a seller who does not bring a Gemini key pays for the AI on the platform's own key with points, bought in
 * packs (paid outside the app, approved by an admin like a plan). Shared by the server, which charges them, and the
 * browser, which shows the prices. Every number here is a default: an admin sets the real ones in /admin.
 *
 * Google's prices behind the defaults (standard tier, October 2026), at about 250 DA a dollar:
 * - text, Gemini 3 Flash: $0.50 in / $3 out per million tokens, so 5 000 tokens cost at most about 4 DA;
 * - an image, Nano Banana 2.1 at 1K: $0.034 (its backup, Gemini 3.1 Flash Image: $0.067), about 8 to 17 DA;
 * - AI video, Gemini Omni Flash at 720p: about $0.10 a second, about 25 DA.
 * With one point at 10 DA, the defaults charge about three times that.
 */

export interface CreditPack {
  /** short slug, kept with each purchase */
  id: string;
  points: number;
  /** in the platform's currency (see PricingConfig) */
  price: number;
}

export interface CreditSettings {
  /** points per started block of TEXT_BLOCK_TOKENS tokens (prompt, photos and answer together) */
  textCost: number;
  /** points per AI image */
  imageCost: number;
  /** points per second of AI video */
  videoSecondCost: number;
  packs: CreditPack[];
}

/** How a seller's AI calls are paid: their own key (free here), points on the platform's key, or not at all. */
export type AiAccessMode = 'own-key' | 'points' | 'none';

export const TEXT_BLOCK_TOKENS = 5000;
export const MAX_COST = 1000;
export const MAX_PACKS = 6;
const MAX_POINTS = 1_000_000;
const MAX_PRICE = 100_000_000;
const PACK_ID = /^[a-z0-9-]{1,32}$/;

export const DEFAULT_CREDIT_PACKS: readonly CreditPack[] = [
  { id: 'starter', points: 100, price: 1000 },
  { id: 'pro', points: 300, price: 2700 },
  { id: 'business', points: 1000, price: 8000 },
];

export const DEFAULT_CREDIT_SETTINGS: CreditSettings = { textCost: 1, imageCost: 5, videoSecondCost: 8, packs: [...DEFAULT_CREDIT_PACKS] };

/** French messages (translated on the way out, see src/i18n/serverMessages.ts). */
export const CREDIT_ERRORS = {
  notEnough: 'Pas assez de points pour cette action. Recharge tes points.',
  settings: 'Réglages des points invalides : des nombres entiers, et au moins un pack.',
  pack: 'Pack de points invalide.',
  pending: 'Tu as déjà un achat de points en attente de vérification.',
  purchase: 'Achat introuvable.',
  decided: 'Cet achat a déjà été traité.',
  grant: 'Nombre de points invalide.',
  user: 'Aucun compte avec cet email.',
} as const;

const isWhole = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

function isPack(value: unknown): value is CreditPack {
  const pack = value as Partial<CreditPack> | null;
  return !!pack && typeof pack.id === 'string' && PACK_ID.test(pack.id) && isWhole(pack.points, 1, MAX_POINTS) && isWhole(pack.price, 0, MAX_PRICE);
}

/** The valid packs in `value` (stored JSON), without repeated ids; the defaults when there are none. */
export function readPacks(value: unknown): CreditPack[] {
  const seen = new Set<string>();
  const packs = (Array.isArray(value) ? value : []).filter((pack): pack is CreditPack => {
    if (!isPack(pack) || seen.has(pack.id)) return false;
    seen.add(pack.id);
    return true;
  }).slice(0, MAX_PACKS).map(({ id, points, price }) => ({ id, points, price }));
  return packs.length ? packs : [...DEFAULT_CREDIT_PACKS];
}

/** The settings stored on PlatformConfig, each one falling back to its default when missing or out of range. */
export function creditSettingsFrom(row: { creditTextCost?: unknown; creditImageCost?: unknown; creditVideoSecondCost?: unknown; creditPacks?: unknown } | null | undefined): CreditSettings {
  const cost = (value: unknown, fallback: number) => (isWhole(value, 0, MAX_COST) ? value : fallback);
  return {
    textCost: cost(row?.creditTextCost, DEFAULT_CREDIT_SETTINGS.textCost),
    imageCost: cost(row?.creditImageCost, DEFAULT_CREDIT_SETTINGS.imageCost),
    videoSecondCost: cost(row?.creditVideoSecondCost, DEFAULT_CREDIT_SETTINGS.videoSecondCost),
    packs: readPacks(row?.creditPacks),
  };
}

/** An admin's new settings, refused whole when one value is wrong (nothing is silently replaced). */
export function parseCreditSettings(body: unknown): { ok: true; settings: CreditSettings } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const costs = [b.textCost, b.imageCost, b.videoSecondCost];
  const packs = Array.isArray(b.packs) ? b.packs : [];
  const ids = new Set(packs.map((pack) => (pack as CreditPack)?.id));
  if (!costs.every((cost) => isWhole(cost, 0, MAX_COST)) || !packs.length || packs.length > MAX_PACKS || !packs.every(isPack) || ids.size !== packs.length) {
    return { ok: false, error: CREDIT_ERRORS.settings };
  }
  return {
    ok: true,
    settings: {
      textCost: b.textCost as number,
      imageCost: b.imageCost as number,
      videoSecondCost: b.videoSecondCost as number,
      packs: (packs as CreditPack[]).map(({ id, points, price }) => ({ id, points, price })),
    },
  };
}

/** Points for a text call that used `totalTokens` tokens: one block at least, so a call is never free. */
export function textCharge(totalTokens: number | null | undefined, textCost: number): number {
  const tokens = Number.isFinite(totalTokens) && (totalTokens as number) > 0 ? (totalTokens as number) : 0;
  return Math.max(1, Math.ceil(tokens / TEXT_BLOCK_TOKENS)) * textCost;
}

/** Points for an AI video clip of `seconds` seconds. */
export const videoCharge = (seconds: number, videoSecondCost: number): number => Math.max(0, Math.round(seconds)) * videoSecondCost;

/** A points grant typed by an admin: a whole number, not zero (negative takes points back). */
export const isGrant = (value: unknown): value is number => isWhole(value, -MAX_POINTS, MAX_POINTS) && value !== 0;
