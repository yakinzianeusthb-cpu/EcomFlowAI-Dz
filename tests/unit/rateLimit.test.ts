import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from '../../src/lib/rateLimit';

function fakeReq(ip = '1.2.3.4'): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

function fakeRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: string) { this.headers[name] = value; return this; },
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res;
}

/** Sends one request through the limiter and reports whether it was let through. */
function hit(limiter: ReturnType<typeof createRateLimiter>, ip?: string) {
  const res = fakeRes();
  let passed = false;
  limiter(fakeReq(ip), res as unknown as Response, () => { passed = true; });
  return { passed, res };
}

describe('createRateLimiter', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-03-05T12:00:00Z')); });
  afterEach(() => { vi.useRealTimers(); });

  it('lets requests through up to the limit, then answers 429 with Retry-After', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect([1, 2, 3].map(() => hit(limiter).passed)).toEqual([true, true, true]);

    const blocked = hit(limiter);
    expect(blocked.passed).toBe(false);
    expect(blocked.res.statusCode).toBe(429);
    expect(blocked.res.headers['Retry-After']).toBe('60');
    expect(blocked.res.body).toEqual({ error: 'Trop de requêtes. Réessaie plus tard.' });
  });

  it('reports how long is left in the window', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    hit(limiter);
    vi.advanceTimersByTime(45_000);
    expect(hit(limiter).res.headers['Retry-After']).toBe('15');
  });

  it('starts a fresh window once the previous one is over', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(hit(limiter).passed).toBe(true);
    expect(hit(limiter).passed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(hit(limiter).passed).toBe(true);
  });

  it('counts each client separately', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(hit(limiter, '10.0.0.1').passed).toBe(true);
    expect(hit(limiter, '10.0.0.2').passed).toBe(true);
    expect(hit(limiter, '10.0.0.1').passed).toBe(false);
  });

  it('accepts a custom key, message and status', () => {
    const limiter = createRateLimiter({
      windowMs: 1000, max: 1, status: 403, message: 'Stop', keyFn: () => 'same-key-for-everyone',
    });
    expect(hit(limiter, '10.0.0.1').passed).toBe(true);

    const blocked = hit(limiter, '10.0.0.2'); // a different IP, but the same custom key
    expect(blocked.passed).toBe(false);
    expect(blocked.res.statusCode).toBe(403);
    expect(blocked.res.body).toEqual({ error: 'Stop' });
  });

  it('falls back to the socket address when the request has no ip', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    const req = { socket: { remoteAddress: '9.9.9.9' } } as unknown as Request;
    let passed = 0;
    limiter(req, fakeRes() as unknown as Response, () => { passed++; });
    limiter(req, fakeRes() as unknown as Response, () => { passed++; });
    expect(passed).toBe(1);
  });
});
