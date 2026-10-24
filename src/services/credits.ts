/**
 * The seller's points in the browser (see src/lib/credits.ts): one shared snapshot from GET /api/credits, refreshed
 * when an AI call answers with its new balance (X-Credits-Left) and after a purchase, so every screen agrees.
 */
import { useEffect, useSyncExternalStore } from 'react';
import type { AiAccessMode, CreditSettings } from '../lib/credits';

export interface CreditPurchase {
  id: string;
  packId: string;
  points: number;
  price: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface CreditsState {
  balance: number;
  mode: AiAccessMode;
  /** the admin has set the platform's key, so points can be bought and spent */
  available: boolean;
  settings: CreditSettings;
  pending: CreditPurchase | null;
  entries: { delta: number; reason: string; createdAt: string }[];
}

export const CREDITS_OPEN_EVENT = 'dz_open_credits';
/** Opens the points dialog (mounted in AppShell). */
export const openCredits = () => window.dispatchEvent(new CustomEvent(CREDITS_OPEN_EVENT));

let snapshot: CreditsState | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

async function readError(res: Response, fallback: string): Promise<Error> {
  const data = await res.json().catch(() => ({}));
  return new Error(typeof data?.error === 'string' ? data.error : fallback);
}

/** Loads the points again (after a purchase, an approval, a key added in Paramètres...). */
export function refreshCredits(): Promise<void> {
  loading ??= fetch('/api/credits')
    .then(async (res) => {
      if (res.ok) {
        snapshot = await res.json();
        emit();
      }
    })
    .catch(() => { /* offline or signed out: keep what we had */ })
    .finally(() => { loading = null; });
  return loading;
}

/** Called with the X-Credits-Left header of an AI answer; asks the server again when the balance runs out. */
export function noteCreditsLeft(header: string | null) {
  if (header === null || !snapshot) return;
  const balance = Number(header);
  if (!Number.isFinite(balance)) return;
  snapshot = { ...snapshot, balance };
  emit();
}

/** An AI call refused for lack of points opens the points dialog. */
export function handleCreditsRefusal(status: number, code: unknown) {
  if (status === 402 && code === 'CREDITS_REQUIRED') {
    void refreshCredits();
    openCredits();
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The points snapshot (null until loaded); loads it on first use. */
export function useCredits(): CreditsState | null {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => null);
  useEffect(() => {
    if (!snapshot) void refreshCredits();
  }, []);
  return state;
}

/** Sends a pack purchase with its payment proof; the admin approves it in /admin. */
export async function buyCredits(input: { packId: string; method: string; proof: string }): Promise<CreditPurchase> {
  const res = await fetch('/api/credits/purchase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw await readError(res, 'Erreur serveur.');
  const { purchase } = await res.json();
  await refreshCredits();
  return purchase;
}

/** "5 pts" for an action paid in points; null when the seller pays with their own key (or has no way to pay yet). */
export function pointsLabel(state: CreditsState | null, points: number, short = 'pts'): string | null {
  return state?.mode === 'points' ? `${points} ${short}` : null;
}
