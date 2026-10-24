/** What needs the user's attention on the dashboard, built only from the real state of the account. */

export interface AttentionInput {
  /** null while unknown */
  hasGeminiKey: boolean | null;
  plan: { active: boolean; pending: boolean; expiresAt: string | null };
  now?: Date;
}

export type AttentionItem =
  | { id: 'no-plan' | 'plan-pending' | 'no-key' }
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
  if (input.hasGeminiKey === false) items.push({ id: 'no-key' });
  return items;
}
