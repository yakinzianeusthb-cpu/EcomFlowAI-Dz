/**
 * An AI service's refusal for the server logs: its status and the start of its answer, with anything that looks like
 * a key blanked out (an answer may quote part of the key it refused). Never sent to the seller.
 */
export function refusalForLog(error: unknown): string {
  const e = (error ?? {}) as { status?: unknown; name?: unknown; text?: unknown };
  const head = String(e.status ?? e.name ?? 'unknown');
  const body = String(e.text ?? '').slice(0, 240).replace(/[A-Za-z0-9_-]{20,}/g, '[…]');
  return `${head} ${body}`.trim();
}
