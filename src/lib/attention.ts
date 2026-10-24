/** What needs the user's attention on the dashboard, built only from the real state of the account. */

export interface AttentionInput {
  /** null while unknown */
  hasGeminiKey: boolean | null;
  plan: { active: boolean; pending: boolean; expiresAt: string | null };
  /** points on the platform's key (see src/lib/credits.ts): whether they can be used, the balance, and when it is "low" */
  points?: { available: boolean; balance: number; lowBelow: number } | null;
  now?: Date;
}

export type AttentionItem =
  | { id: 'no-plan' | 'plan-pending' | 'no-key' }
  | { id: 'low-points'; balance: number }
  | { id: 'plan-ending'; days: number };

const DAY = 86_400_000;

export function attentionItems(input: AttentionInput): AttentionItem[] {
  const now = (input.now ?? new Date()).getTime();
  const items: AttentionItem[] = [];

  if (!input.plan.active) items.push({ id: input.plan.pending ? 'plan-pending' : 'no-plan' });
  else if (input.plan.expiresAt) {
    const left = Math.ceil((Date.parse(input.plan.expiresAt) - now) / DAY);
    if (left >= 0 && left <= 7) items.push({ id: 'plan-ending', days: left });
  }
  if (input.hasGeminiKey === false) {
    // without a key, points keep the AI running: a key is asked for only when points cannot be bought
    if (!input.points?.available) items.push({ id: 'no-key' });
    else if (input.points.balance < input.points.lowBelow) items.push({ id: 'low-points', balance: input.points.balance });
  }
  return items;
}
