/**
 * Rate-limit counts kept in Postgres (table rate_limit_hits), so every server instance shares them: on Vercel each
 * instance has its own memory, and an in-memory limit is only per instance. One atomic upsert per request.
 *
 * Keys are hashed before they are stored: the table never holds an address or an e-mail. If the table is missing
 * (the database was not updated yet) the query fails and createRateLimiter falls back to its memory counts.
 */
import { createHash } from "crypto";
import { prisma } from "./prisma";
import type { RateLimitStore, StoreHit } from "./rateLimit";

/** Expired windows are deleted now and then, by roughly one request in this many. */
const CLEANUP_ONE_IN = 200;

const hashKey = (name: string, key: string) => createHash("sha256").update(`${name}|${key}`).digest("hex");

function cleanUp() {
  prisma.$executeRaw`DELETE FROM "rate_limit_hits" WHERE "reset_at" < LOCALTIMESTAMP - INTERVAL '1 hour'`.catch(() => {});
}

/** A shared store for one limiter; `name` keeps its counts apart from the other limiters'. */
export function postgresRateLimitStore(name: string): RateLimitStore {
  return async (key, windowMs) => {
    const seconds = windowMs / 1000;
    const rows = await prisma.$queryRaw<{ count: number; ms_left: number }[]>`
      INSERT INTO "rate_limit_hits" ("key", "count", "reset_at")
      VALUES (${hashKey(name, key)}, 1, LOCALTIMESTAMP + make_interval(secs => ${seconds}::double precision))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "rate_limit_hits"."reset_at" <= LOCALTIMESTAMP THEN 1 ELSE "rate_limit_hits"."count" + 1 END,
        "reset_at" = CASE WHEN "rate_limit_hits"."reset_at" <= LOCALTIMESTAMP THEN EXCLUDED."reset_at" ELSE "rate_limit_hits"."reset_at" END
      RETURNING "count", CEIL(EXTRACT(EPOCH FROM ("reset_at" - LOCALTIMESTAMP)) * 1000)::int AS "ms_left"`;
    if (Math.random() * CLEANUP_ONE_IN < 1) cleanUp();
    const row = rows[0];
    if (!row) throw new Error("rate limit store returned no row");
    const hit: StoreHit = { count: Number(row.count), msLeft: Math.max(0, Number(row.ms_left)) };
    return hit;
  };
}
