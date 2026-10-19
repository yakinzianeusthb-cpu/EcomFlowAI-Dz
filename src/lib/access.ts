/**
 * Plan-based access gating shared by the browser (locks the UI) and the server
 * (refuses the request), so both always apply the same rule.
 *
 * Free users (no active plan) can browse the dashboard and use the free
 * tools, but paid (AI) tools render a locked screen instead of running.
 */

// Tab ids that require an active plan. Keep in sync with the `NavItem` unions
// in AppShell.tsx / Sidebar.tsx.
export const PAID_TOOLS = new Set([
  'video',
  'landing',
  'ads',
  'assembler',
  'trends',
  'images',
  'darja',
  'analyzer',
  'scout',
  'calendar',
]);

export const isToolPaid = (tab: string): boolean => PAID_TOOLS.has(tab);

/** The plan fields this module needs. Dates arrive as `Date` on the server and ISO strings in the browser. */
export interface PlanFields {
  planStatus?: string | null;
  planExpiresAt?: Date | string | null;
  isAdmin?: boolean | null;
}

/**
 * True when the user holds a subscription that is active right now.
 * A missing expiry date means a lifetime plan. An expiry that is in the past, or that
 * cannot be parsed, means the plan has lapsed (fail closed).
 */
export function isPlanActive(u?: PlanFields | null, now: Date = new Date()): boolean {
  if (u?.planStatus !== 'active') return false;
  if (u.planExpiresAt == null) return true;
  const expiresAt = new Date(u.planExpiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt > now.getTime();
}

/** Kept as the name the UI already uses. */
export const hasActivePlan = (u?: PlanFields | null): boolean => isPlanActive(u);

/** Who may use the paid tools: admins always, everyone else only with a live plan. */
export function canUsePaidTools(u?: PlanFields | null, now: Date = new Date()): boolean {
  return u?.isAdmin === true || isPlanActive(u, now);
}
