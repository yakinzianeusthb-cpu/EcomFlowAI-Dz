/**
 * Per-account storage rules on the server: quotas depend on the plan, and a quota check plus the insert it
 * guards run under a per-account lock, so two requests sent at once cannot both squeeze under the limit.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { canUsePaidTools } from "./access";

/** Admins and accounts with a live plan get the full quotas; other accounts get the free ones. */
export async function hasPaidAccess(userId: string): Promise<boolean> {
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, planStatus: true, planExpiresAt: true } });
  return canUsePaidTools(account);
}

/** Runs `work` in a transaction holding a lock for this account (released when the transaction ends). */
export function withAccountLock<T>(userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
      return work(tx);
    },
    { timeout: 20_000 },
  );
}
