/**
 * Minimal fixed-window rate limiter for Express.
 *
 * By default the counts live in memory: best-effort per warm serverless instance. Pass a `store` (see
 * rateLimitStore.ts) to share the counts between instances; if the store fails, the limiter falls back to its
 * in-memory counts for that request instead of refusing or letting everything through.
 */
import type { NextFunction, Request, Response } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/** A window as a shared store reports it after counting one more request. */
export interface StoreHit {
  count: number;
  /** milliseconds left in the window */
  msLeft: number;
}

/** Counts one request for `key` in a window of `windowMs`, shared by every server instance. */
export type RateLimitStore = (key: string, windowMs: number) => Promise<StoreHit>;

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Build a key from the request (default: client IP). */
  keyFn?: (req: Request) => string;
  message?: string;
  /** HTTP status to return when limited (default 429). */
  status?: number;
  /** Shared counts (default: this instance's memory only). */
  store?: RateLimitStore;
}

export function createRateLimiter(opts: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = "Trop de requêtes. Réessaie plus tard.",
    status = 429,
    store,
  } = opts;
  const keyFn =
    opts.keyFn ?? ((req: Request) => req.ip || req.socket?.remoteAddress || "unknown");
  const buckets = new Map<string, Bucket>();

  /** Counts the request in this instance's memory. */
  const countInMemory = (key: string): StoreHit => {
    const now = Date.now();
    const bucket = buckets.get(key);
    // Fresh window (also lazily prunes stale buckets).
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { count: 1, msLeft: windowMs };
    }
    bucket.count += 1;
    return { count: bucket.count, msLeft: bucket.resetAt - now };
  };

  const answer = (hit: StoreHit, res: Response, next: NextFunction) => {
    if (hit.count > max) {
      const retryAfter = Math.max(1, Math.ceil(hit.msLeft / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(status).json({ error: message });
    }
    next();
  };

  if (!store) {
    return function rateLimit(req: Request, res: Response, next: NextFunction) {
      answer(countInMemory(keyFn(req)), res, next);
    };
  }

  let warned = false;
  return async function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = keyFn(req);
    let hit: StoreHit;
    try {
      hit = await store(key, windowMs);
    } catch (err) {
      if (!warned) {
        warned = true;
        // Prisma's messages span several lines and start with a blank one: keep the reason readable on one line
        const reason = err instanceof Error ? err.message.replace(/\s+/g, " ").trim() : String(err);
        console.warn(`Shared rate limit unavailable, counting in memory: ${reason}`);
      }
      hit = countInMemory(key);
    }
    answer(hit, res, next);
  };
}
