import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicCache } from '../../src/lib/cache';

const findUnique = vi.fn();
vi.mock('../../src/lib/prisma', () => ({ prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } } }));

const { requireAdmin } = await import('../../src/lib/admin');

function run(user?: { sub?: string }) {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  const next = vi.fn();
  return { res, next, promise: requireAdmin({ user } as unknown as Request, res as unknown as Response, next as NextFunction) };
}

describe('requireAdmin', () => {
  beforeEach(() => { findUnique.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => {}); });

  it('refuses a request with no signed-in user', async () => {
    const { res, next, promise } = run(undefined);
    await promise;
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('refuses a signed-in user who is not an admin', async () => {
    findUnique.mockResolvedValue({ isAdmin: false });
    const { res, next, promise } = run({ sub: 'user-1' });
    await promise;
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('refuses a user that no longer exists', async () => {
    findUnique.mockResolvedValue(null);
    const { res, next, promise } = run({ sub: 'gone' });
    await promise;
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('lets an admin through, checking the database rather than trusting the cookie', async () => {
    findUnique.mockResolvedValue({ isAdmin: true });
    const { res, next, promise } = run({ sub: 'admin-1' });
    await promise;
    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'admin-1' }, select: { isAdmin: true } });
  });

  it('answers 500 when the lookup fails, without letting the request through', async () => {
    findUnique.mockRejectedValue(new Error('db down'));
    const { res, next, promise } = run({ sub: 'admin-1' });
    await promise;
    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('publicCache', () => {
  it('sets a shared-cache header and continues', () => {
    const headers: Record<string, string> = {};
    const res = { setHeader: (name: string, value: string) => { headers[name] = value; } };
    const next = vi.fn();
    publicCache()({} as Request, res as unknown as Response, next);
    expect(headers['Cache-Control']).toBe('public, max-age=30, s-maxage=60, stale-while-revalidate=300');
    expect(next).toHaveBeenCalledOnce();
  });

  it('takes custom lifetimes', () => {
    const headers: Record<string, string> = {};
    const res = { setHeader: (name: string, value: string) => { headers[name] = value; } };
    publicCache({ maxAge: 5, sMaxAge: 10, staleWhileRevalidate: 20 })({} as Request, res as unknown as Response, vi.fn());
    expect(headers['Cache-Control']).toBe('public, max-age=5, s-maxage=10, stale-while-revalidate=20');
  });
});
