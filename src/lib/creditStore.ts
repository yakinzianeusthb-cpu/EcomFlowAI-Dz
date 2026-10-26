/**
 * Points on the server: the platform's key and prices (from PlatformConfig, cached briefly), who pays for an AI call,
 * and every change to a balance. A balance only moves inside a transaction that also writes its CreditEntry, and a
 * spend is a conditional update ("credits >= n"), so two calls at once can never spend the same points.
 */
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { creditSettingsFrom, type AiAccessMode, type CreditSettings } from './credits';
import { decryptSecret, isEncryptedSecret } from './crypto';

const CACHE_MS = 30_000;
let cached: { at: number; settings: CreditSettings; key: string | null } | null = null;

const reveal = (blob: string | null | undefined): string | null => {
  if (!blob || !isEncryptedSecret(blob)) return null;
  try {
    return decryptSecret(blob);
  } catch (err) {
    console.error('Failed to decrypt a stored Gemini key:', err);
    return null;
  }
};

/** The platform's Gemini key (null when the admin has not set one) and the prices in points. */
export async function platformCredits(): Promise<{ settings: CreditSettings; key: string | null }> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached;
  const row = await prisma.platformConfig.findUnique({
    where: { id: 'singleton' },
    select: { platformGeminiKey: true, creditTextCost: true, creditImageCost: true, creditVideoSecondCost: true, creditPacks: true },
  });
  cached = { at: Date.now(), settings: creditSettingsFrom(row), key: reveal(row?.platformGeminiKey) };
  return cached;
}

/** Called after an admin changes the key or the prices. */
export const forgetPlatformCredits = () => { cached = null; };

export type AiAccess =
  | { mode: 'own-key'; apiKey: string }
  /** `free`: administrators use the platform's key without spending points */
  | { mode: 'points'; apiKey: string; free: boolean; settings: CreditSettings }
  | { mode: 'none' };

/** Who pays for this user's AI: their own key when they set one, otherwise points on the platform's key. */
export async function resolveAiAccess(userId: string): Promise<AiAccess> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, apiSettings: { select: { geminiApiKey: true } } } });
  const own = reveal(user?.apiSettings?.geminiApiKey);
  if (own) return { mode: 'own-key', apiKey: own };
  const platform = await platformCredits();
  if (!platform.key) return { mode: 'none' };
  return { mode: 'points', apiKey: platform.key, free: !!user?.isAdmin, settings: platform.settings };
}

export const accessMode = (access: AiAccess): AiAccessMode => access.mode;

const balanceOf = async (tx: Prisma.TransactionClient, userId: string) =>
  (await tx.user.findUnique({ where: { id: userId }, select: { credits: true } }))?.credits ?? 0;

/** Takes `points` if the balance covers them; the new balance, or null when it does not. */
export async function spendCredits(userId: string, points: number, reason: string, ref: string): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    const done = await tx.user.updateMany({ where: { id: userId, credits: { gte: points } }, data: { credits: { decrement: points } } });
    if (!done.count) return null;
    await tx.creditEntry.create({ data: { userId, delta: -points, reason, ref } });
    return balanceOf(tx, userId);
  });
}

/** Takes up to `points` (never below zero): the rest of a text call that turned out longer than its first block. */
export async function spendUpTo(userId: string, points: number, reason: string, ref: string): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const take = Math.min(points, await balanceOf(tx, userId));
    if (take > 0) {
      const done = await tx.user.updateMany({ where: { id: userId, credits: { gte: take } }, data: { credits: { decrement: take } } });
      if (done.count) await tx.creditEntry.create({ data: { userId, delta: -take, reason, ref } });
    }
    return balanceOf(tx, userId);
  });
}

const isDuplicate = (err: unknown) => err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

/**
 * Adds `points` once per reason and reference (a purchase, a refund): a second call with the same pair changes
 * nothing. Returns the balance.
 */
export async function addCreditsOnce(userId: string, points: number, reason: string, ref: string): Promise<number> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.creditEntry.create({ data: { userId, delta: points, reason, ref } });
      await tx.user.update({ where: { id: userId }, data: { credits: { increment: points } } });
      return balanceOf(tx, userId);
    });
  } catch (err) {
    if (isDuplicate(err)) return prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }).then((u) => u?.credits ?? 0);
    throw err;
  }
}

/** An admin's grant: adds points, or takes them back (never below zero). Returns the balance. */
export async function grantCredits(userId: string, points: number): Promise<number> {
  const ref = randomUUID();
  return points > 0 ? addCreditsOnce(userId, points, 'grant', ref) : spendUpTo(userId, -points, 'grant', ref);
}

/**
 * The points of one AI call on the platform's key: reserved before the call, topped up after a long text answer,
 * given back if the call fails. A free call (an administrator) reserves nothing.
 */
export function openBill(userId: string, free: boolean) {
  const ref = randomUUID();
  let reserved = 0;
  let balance: number | null = null;
  return {
    ref,
    get balance() { return balance; },
    /** false when the balance does not cover `points` */
    async reserve(points: number, reason: string): Promise<boolean> {
      if (free || points <= 0) return true;
      const left = await spendCredits(userId, points, reason, ref);
      if (left === null) return false;
      reserved = points;
      balance = left;
      return true;
    },
    async topUp(points: number, reason: string) {
      if (free || points <= 0) return;
      balance = await spendUpTo(userId, points, reason, `${ref}:more`);
    },
    async refund() {
      if (!reserved) return;
      balance = await addCreditsOnce(userId, reserved, 'refund', ref);
      reserved = 0;
    },
  };
}

export type Bill = ReturnType<typeof openBill>;
