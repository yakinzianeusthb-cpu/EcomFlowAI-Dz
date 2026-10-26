import { describe, expect, it, vi } from 'vitest';
import { createPaidAccessGuard, PLAN_REQUIRED_MESSAGE } from '../../src/lib/planGuard';

const DAY = 24 * 60 * 60 * 1000;

const run = async (account: unknown, session: unknown = { sub: 'u1' }) => {
  const loadAccount = vi.fn(async () => account as any);
  const guard = createPaidAccessGuard(loadAccount);
  const res: any = { statusCode: 200, body: undefined as unknown };
  res.status = vi.fn((c: number) => { res.statusCode = c; return res; });
  res.json = vi.fn((b: unknown) => { res.body = b; return res; });
  const next = vi.fn();
  await guard({ user: session } as any, res, next);
  return { res, next, loadAccount };
};

describe('createPaidAccessGuard', () => {
  it('answers 401 when nobody is logged in, without querying the database', async () => {
    const { res, next, loadAccount } = await run(null, null);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(loadAccount).not.toHaveBeenCalled();
  });

  it('lets a user with a live plan through', async () => {
    const { next, loadAccount } = await run({ planStatus: 'active', planExpiresAt: new Date(Date.now() + DAY) });
    expect(next).toHaveBeenCalledOnce();
    expect(loadAccount).toHaveBeenCalledWith('u1');
  });

  it('lets a lifetime plan through', async () => {
    const { next } = await run({ planStatus: 'active', planExpiresAt: null });
    expect(next).toHaveBeenCalledOnce();
  });

  it('lets an admin through without a plan', async () => {
    const { next } = await run({ isAdmin: true, planStatus: null });
    expect(next).toHaveBeenCalledOnce();
  });

  it('refuses a lapsed plan with a machine-readable code', async () => {
    const { res, next } = await run({ planStatus: 'active', planExpiresAt: new Date(Date.now() - DAY) });
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: PLAN_REQUIRED_MESSAGE, code: 'PLAN_REQUIRED' });
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses users without a plan, with a pending payment, or whose account no longer exists', async () => {
    for (const account of [{ planStatus: null }, { planStatus: 'pending' }, null]) {
      const { res, next } = await run(account);
      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('answers 500 instead of letting the request through when the lookup fails', async () => {
    const guard = createPaidAccessGuard(async () => { throw new Error('db down'); });
    const res: any = { statusCode: 200 };
    res.status = vi.fn((c: number) => { res.statusCode = c; return res; });
    res.json = vi.fn(() => res);
    const next = vi.fn();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await guard({ user: { sub: 'u1' } } as any, res, next);
    errorSpy.mockRestore();
    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});
