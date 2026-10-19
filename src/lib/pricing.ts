import { useEffect, useState } from 'react';
import { Crown, Flame, Ticket, Zap, type LucideIcon } from 'lucide-react';
import type { PlanId } from '../context/AuthContext';

/** Server-side plan prices + currency (PlatformConfig singleton). */
export interface PricingConfig {
  currencyCode: string;
  currencySymbol: string;
  currencyPosition: 'before' | 'after';
  monthlyPrice: number;
  quarterlyPrice: number;
  lifetimePrice: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  currencyCode: 'DA',
  currencySymbol: 'DA',
  currencyPosition: 'after',
  monthlyPrice: 1500,
  quarterlyPrice: 3500,
  lifetimePrice: 15000,
};

export interface PlanOption {
  id: PlanId;
  label: string;
  tagline: string;
  price: string;
  note: string;
  per: string;
  popular?: boolean;
  accent?: string;
}

/** Icon per plan (replaces the emoji that used to stand in for icons). */
export const PLAN_ICON: Record<PlanId, LucideIcon> = { monthly: Zap, quarterly: Flame, lifetime: Crown, custom: Ticket };

// Static display copy per plan; price/note are derived from the active pricing.
const PLAN_META: Record<PlanId, Omit<PlanOption, 'price' | 'note'>> = {
  monthly: {
    id: 'monthly',
    label: '1 Mois',
    tagline: 'Pour tester',
    per: "30 jours d'accès",
  },
  quarterly: {
    id: 'quarterly',
    label: '3 Mois',
    tagline: 'Pour lancer',
    per: "90 jours d'accès",
    popular: true,
  },
  lifetime: {
    id: 'lifetime',
    label: 'À Vie',
    tagline: 'Paiement unique',
    per: 'Accès illimité à vie',
  },
  custom: {
    id: 'custom',
    label: 'Personnalisé',
    tagline: 'Durée au choix',
    per: 'Accès selon la durée accordée',
  },
};

// `price` already carries the currency symbol (e.g. "1 500 DA"), so the note
// only describes the billing period.
const PLAN_NOTE: Record<PlanId, string> = {
  monthly: '/ mois',
  quarterly: '/ 3 mois',
  lifetime: 'une fois',
  custom: 'personnalisé',
};

/** Formats an amount with the configured currency, e.g. "1 500 DA" or "$ 1 500". */
export function formatPrice(amount: number, pricing: PricingConfig): string {
  const grouped = String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return pricing.currencyPosition === 'before'
    ? `${pricing.currencySymbol} ${grouped}`
    : `${grouped} ${pricing.currencySymbol}`;
}

/** Turns a French display text into the visitor's language (the `tf` of useLanguage). */
export type DisplayTranslator = (frenchText: string) => string;

/**
 * Builds the full plan display list from the active pricing config.
 * Pass `translate` to get the texts in the visitor's language; without it they stay French (as the admin preview wants).
 */
export function buildPlans(pricing: PricingConfig, translate: DisplayTranslator = (text) => text): PlanOption[] {
  const priceOf: Record<PlanId, number> = {
    monthly: pricing.monthlyPrice,
    quarterly: pricing.quarterlyPrice,
    lifetime: pricing.lifetimePrice,
    custom: pricing.lifetimePrice, // unused — custom plans are admin-granted
  };
  return (['monthly', 'quarterly', 'lifetime'] as PlanId[]).map((id) => ({
    ...PLAN_META[id],
    label: translate(PLAN_META[id].label),
    tagline: translate(PLAN_META[id].tagline),
    per: translate(PLAN_META[id].per),
    price: formatPrice(priceOf[id], pricing),
    note: translate(PLAN_NOTE[id]),
  }));
}

/** Fallback plans used while pricing loads or when the endpoint is unreachable. */
export const DEFAULT_PLANS: PlanOption[] = buildPlans(DEFAULT_PRICING);

let cache: PricingConfig | null = null;
let inflight: Promise<PricingConfig> | null = null;

function normalize(d: unknown): PricingConfig | null {
  if (!d || typeof d !== 'object') return null;
  const obj = d as Record<string, unknown>;
  const okNum = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0;
  if (!okNum(obj.monthlyPrice) || !okNum(obj.quarterlyPrice) || !okNum(obj.lifetimePrice)) return null;
  if (typeof obj.currencyCode !== 'string' || typeof obj.currencySymbol !== 'string') return null;
  return {
    currencyCode: obj.currencyCode.trim() || DEFAULT_PRICING.currencyCode,
    currencySymbol: obj.currencySymbol.trim() || DEFAULT_PRICING.currencySymbol,
    currencyPosition: obj.currencyPosition === 'before' ? 'before' : 'after',
    monthlyPrice: obj.monthlyPrice,
    quarterlyPrice: obj.quarterlyPrice,
    lifetimePrice: obj.lifetimePrice,
  };
}

/** Fetches pricing once and caches it module-wide (shared by every consumer). */
export async function fetchPricing(): Promise<PricingConfig> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch('/api/platform/pricing', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        cache = normalize(d) ?? DEFAULT_PRICING;
        return cache;
      })
      .catch(() => {
        cache = DEFAULT_PRICING;
        return cache;
      });
  }
  return inflight;
}

/** React hook: current pricing config (defaults until the server responds). */
export function usePricing(): PricingConfig {
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING);
  useEffect(() => {
    let cancelled = false;
    fetchPricing().then((p) => {
      if (!cancelled) setPricing(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return pricing;
}
