import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A small in-memory stand-in for the emailOtp table: it understands the few filters otp.ts uses.
interface Row { id: string; userId: string; codeHash: string; reason: string; used: boolean; attempts: number; createdAt: Date; expiresAt: Date }
let rows: Row[] = [];

type Condition = unknown;
function matches(row: Row, where: Record<string, Condition>): boolean {
  return Object.entries(where).every(([field, condition]) => {
    const value = (row as unknown as Record<string, unknown>)[field];
    if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
      const c = condition as { gte?: Date; gt?: Date; in?: unknown[] };
      if (c.gte && !((value as Date) >= c.gte)) return false;
      if (c.gt && !((value as Date) > c.gt)) return false;
      if (c.in && !c.in.includes(value)) return false;
      return true;
    }
    return value === condition;
  });
}

const emailOtp = {
  findFirst: async ({ where }: { where: Record<string, Condition> }) =>
    [...rows].filter((r) => matches(r, where)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
  count: async ({ where }: { where: Record<string, Condition> }) => rows.filter((r) => matches(r, where)).length,
  create: async ({ data }: { data: Partial<Row> & { id: string } }) => {
    const row = { attempts: 0, used: false, createdAt: new Date(), ...data } as Row;
    rows.push(row);
    return row;
  },
  update: async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
    const row = rows.find((r) => r.id === where.id)!;
    Object.assign(row, data);
    return row;
  },
};
vi.mock('../../src/lib/prisma', () => ({ prisma: { emailOtp } }));

const { generateOtpCode, issueOtp, OtpRateLimitedError, OTP_TTL_MS, verifyOtpCode } = await import('../../src/lib/otp');

const USER = 'user-1';

describe('generateOtpCode', () => {
  it('always gives exactly six digits, keeping leading zeros', () => {
    const codes = Array.from({ length: 300 }, () => generateOtpCode());
    expect(codes.every((c) => /^\d{6}$/.test(c))).toBe(true);
    expect(new Set(codes).size).toBeGreaterThan(250);
  });
});

describe('OTP issue and verification', () => {
  beforeEach(() => { rows = []; vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-05T12:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });

  it('stores only a hash of the code, with a ten-minute lifetime', async () => {
    const issued = await issueOtp(USER);

    expect(issued.code).toMatch(/^\d{6}$/);
    expect(issued.expiresInSec).toBe(600);
    expect(rows).toHaveLength(1);
    expect(rows[0].codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].codeHash).not.toContain(issued.code);
    expect(rows[0].expiresAt.getTime() - rows[0].createdAt.getTime()).toBe(OTP_TTL_MS);
  });

  it('accepts the right code once, then refuses a replay', async () => {
    const { code } = await issueOtp(USER);
    expect(await verifyOtpCode(USER, code)).toBe(true);
    expect(rows[0].used).toBe(true);
    expect(await verifyOtpCode(USER, code)).toBe(false);
  });

  it('refuses a wrong code and counts the attempt', async () => {
    const { code } = await issueOtp(USER);
    const wrong = code === '000000' ? '000001' : '000000';
    expect(await verifyOtpCode(USER, wrong)).toBe(false);
    expect(rows[0].attempts).toBe(1);
    expect(rows[0].used).toBe(false);
    expect(await verifyOtpCode(USER, code)).toBe(true);
  });

  it('burns the code after five wrong guesses, so even the right one no longer works', async () => {
    const { code } = await issueOtp(USER);
    const wrong = code === '000000' ? '000001' : '000000';
    for (let i = 0; i < 5; i++) expect(await verifyOtpCode(USER, wrong)).toBe(false);

    expect(rows[0].used).toBe(true);
    expect(await verifyOtpCode(USER, code)).toBe(false);
  });

  it('refuses a code once it has expired', async () => {
    const { code } = await issueOtp(USER);
    vi.advanceTimersByTime(OTP_TTL_MS + 1000);
    expect(await verifyOtpCode(USER, code)).toBe(false);
  });

  it('refuses malformed codes without touching the database', async () => {
    await issueOtp(USER);
    const spy = vi.spyOn(emailOtp, 'findFirst');
    for (const bad of ['', '12345', '1234567', 'abcdef', '12 345', '١٢٣٤٥٦']) expect(await verifyOtpCode(USER, bad)).toBe(false);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('only accepts a code for the reasons it was asked to check', async () => {
    const { code } = await issueOtp(USER, 'password_reset');
    expect(await verifyOtpCode(USER, code)).toBe(false); // default: verification and login
    expect(await verifyOtpCode(USER, code, { reasons: ['password_reset'] })).toBe(true);
  });

  it('does not accept one user\'s code for another user', async () => {
    const { code } = await issueOtp(USER);
    expect(await verifyOtpCode('someone-else', code)).toBe(false);
  });

  it('asks the user to wait when a code was sent less than a minute ago', async () => {
    await issueOtp(USER);
    vi.advanceTimersByTime(30_000);
    const attempt = issueOtp(USER);
    await expect(attempt).rejects.toBeInstanceOf(OtpRateLimitedError);
    await expect(attempt).rejects.toMatchObject({ status: 429, message: 'Un code a déjà été envoyé. Réessaie dans une minute.' });
  });

  it('allows a new code after the cooldown', async () => {
    await issueOtp(USER);
    vi.advanceTimersByTime(61_000);
    await expect(issueOtp(USER)).resolves.toMatchObject({ expiresInSec: 600 });
  });

  it('stops after six codes in an hour', async () => {
    for (let i = 0; i < 6; i++) {
      await issueOtp(USER);
      vi.advanceTimersByTime(61_000);
    }
    await expect(issueOtp(USER)).rejects.toMatchObject({ status: 429, message: 'Trop de codes envoyés. Réessaie dans une heure.' });
  });
});
