/**
 * The sign-in check every authenticated route uses: a valid session cookie whose account still exists and whose
 * password has not changed since sign-in (see createRequireAuth in session.ts).
 */
import { prisma } from "./prisma";
import { createRequireAuth } from "./session";

export const requireAuth = createRequireAuth((userId) =>
  prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
);
