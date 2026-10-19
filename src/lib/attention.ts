/** What needs the user's attention on the dashboard, built only from the real state of the account. */

type Kind = 'landing' | 'video' | 'ads';

export interface AttentionInput {
  /** null while unknown */
  hasGeminiKey: boolean | null;
  plan: { active: boolean; pending: boolean; expiresAt: string | null };
  brand: { brandName: string; colors: string[]; logoAssetId: string | null } | null;
  projects: { id: string; name: string; status: string; outputs: Partial<Record<string, unknown>> }[];
  meta: { configured: boolean; connected: boolean; expired: boolean } | null;
  now?: Date;
}

export type AttentionItem =
  | { id: 'no-plan' | 'plan-pending' | 'no-key' | 'brand-empty' | 'meta-connect' | 'meta-expired' }
  | { id: 'plan-ending'; days: number }
  | { id: 'missing-outputs'; projectId: string; projectName: string; missing: Kind[] };

const DAY = 86_400_000;
const KINDS: Kind[] = ['landing', 'video', 'ads'];

export function attentionItems(input: AttentionInput): AttentionItem[] {
  const now = (input.now ?? new Date()).getTime();
  const items: AttentionItem[] = [];

  if (!input.plan.active) items.push({ id: input.plan.pending ? 'plan-pending' : 'no-plan' });
  else if (input.plan.expiresAt) {
    const left = Math.ceil((Date.parse(input.plan.expiresAt) - now) / DAY);
    if (left >= 0 && left <= 7) items.push({ id: 'plan-ending', days: left });
  }
  if (input.hasGeminiKey === false) items.push({ id: 'no-key' });

  // the most recent campaign that still lacks something (the list arrives newest first)
  const incomplete = input.projects.find((p) => p.status !== 'archived' && KINDS.some((k) => !p.outputs[k]));
  if (incomplete) items.push({ id: 'missing-outputs', projectId: incomplete.id, projectName: incomplete.name, missing: KINDS.filter((k) => !incomplete.outputs[k]) });

  if (input.brand && !input.brand.brandName && input.brand.colors.length === 0 && !input.brand.logoAssetId) items.push({ id: 'brand-empty' });
  if (input.meta?.configured) {
    if (input.meta.connected && input.meta.expired) items.push({ id: 'meta-expired' });
    else if (!input.meta.connected) items.push({ id: 'meta-connect' });
  }
  return items;
}
