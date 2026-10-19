import crypto from 'node:crypto';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const SECRET = 'unit-test-secret';
const DAY = 24 * 60 * 60 * 1000;
const PAYLOAD = { sub: 'user-1', email: 'a@b.co', name: 'Test User' };

type SessionModule = typeof import('../../src/lib/session');
let session: SessionModule;

// Builds a token the way the app did before sessions had an expiry (no `exp` claim).
const legacyToken = (payload: Record<string, unknown>) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
};

const fakeRes = () => {
  const res: any = { statusCode: 200, body: undefined as unknown, cookies: [] as unknown[][] };
  res.status = vi.fn((code: number) => { res.statusCode = code; return res; });
  res.json = vi.fn((b: unknown) => { res.body = b; return res; });
  res.cookie = vi.fn((...args: unknown[]) => { res.cookies.push(args); return res; });
  return res;
};
const reqWith = (token?: string) => ({ headers: { cookie: token ? `dzads_session=${token}` : '' } }) as any;

beforeAll(async () => {
  vi.stubEnv('SESSION_SECRET', SECRET);
  session = await import('../../src/lib/session');
});

describe('signSession / verifySession', () => {
  it('stamps a 30-day expiry on new tokens', () => {
    const before = Date.now();
    const verified = session.verifySession(session.signSession(PAYLOAD));
    expect(verified?.sub).toBe('user-1');
    expect(verified?.exp).toBeGreaterThanOrEqual(before + 30 * DAY - 1000);
    expect(verified?.exp).toBeLessThanOrEqual(Date.now() + 30 * DAY + 1000);
  });

  it('keeps an explicit expiry', () => {
    const exp = Date.now() + DAY;
    expect(session.verifySession(session.signSession({ ...PAYLOAD, exp }))?.exp).toBe(exp);
  });

  it('rejects an expired token', () => {
    const token = session.signSession({ ...PAYLOAD, exp: Date.now() - 1000 });
    expect(session.verifySession(token)).toBeNull();
  });

  it('still accepts legacy tokens that have no expiry', () => {
    const verified = session.verifySession(legacyToken(PAYLOAD));
    expect(verified?.sub).toBe('user-1');
    expect(verified?.exp).toBeUndefined();
  });

  it('rejects tampered, malformed and foreign tokens', () => {
    const token = session.signSession(PAYLOAD);
    const [body, sig] = token.split('.');
    const forgedBody = Buffer.from(JSON.stringify({ ...PAYLOAD, sub: 'admin' })).toString('base64url');
    expect(session.verifySession(`${forgedBody}.${sig}`)).toBeNull();
    expect(session.verifySession(`${body}.${sig.slice(0, -2)}`)).toBeNull();
    expect(session.verifySession('garbage')).toBeNull();
    expect(session.verifySession('a.b.c')).toBeNull();
    expect(session.verifySession('')).toBeNull();
  });

  it('rejects a correctly signed token whose payload has no user id', () => {
    expect(session.verifySession(legacyToken({ email: 'a@b.co' }))).toBeNull();
  });
});

describe('requireAuth', () => {
  it('answers 401 without a cookie', () => {
    const res = fakeRes();
    const next = vi.fn();
    session.requireAuth(reqWith(), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('answers 401 for an expired session', () => {
    const res = fakeRes();
    const next = vi.fn();
    session.requireAuth(reqWith(session.signSession({ ...PAYLOAD, exp: Date.now() - 1000 })), res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('lets a current token through without touching the cookie', () => {
    const res = fakeRes();
    const next = vi.fn();
    const req = reqWith(session.signSession(PAYLOAD));
    session.requireAuth(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user.sub).toBe('user-1');
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('upgrades a legacy token to one with an expiry instead of logging the user out', () => {
    const res = fakeRes();
    const next = vi.fn();
    session.requireAuth(reqWith(legacyToken(PAYLOAD)), res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.cookie).toHaveBeenCalledOnce();
    const [name, value] = res.cookies[0] as [string, string];
    expect(name).toBe('dzads_session');
    expect(session.verifySession(value)?.exp).toBeGreaterThan(Date.now());
  });
});

describe('cookie helpers', () => {
  it('parses cookies, including url-encoded values', () => {
    const req = { headers: { cookie: 'a=1; dzads_session=x%20y; broken' } } as any;
    expect(session.parseCookies(req)).toEqual({ a: '1', dzads_session: 'x y' });
  });

  it('sets an http-only, lax session cookie that lasts 30 days', () => {
    const res = fakeRes();
    session.setSessionCookie(res, 'token');
    const [name, value, options] = res.cookies[0] as [string, string, Record<string, unknown>];
    expect(name).toBe('dzads_session');
    expect(value).toBe('token');
    expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 30 * DAY });
  });
});

describe('password reset tokens', () => {
  it('round-trips and lowercases the email', () => {
    expect(session.verifyResetToken(session.signResetToken('Mixed@Case.com'))).toEqual({ email: 'mixed@case.com' });
  });

  it('rejects session tokens, tampered tokens and garbage', () => {
    expect(session.verifyResetToken(session.signSession(PAYLOAD))).toBeNull();
    const [body, sig] = session.signResetToken('a@b.co').split('.');
    expect(session.verifyResetToken(`${body}x.${sig}`)).toBeNull();
    expect(session.verifyResetToken('nope')).toBeNull();
  });

  it('rejects an expired reset token', () => {
    vi.useFakeTimers();
    try {
      const token = session.signResetToken('a@b.co');
      vi.advanceTimersByTime(11 * 60 * 1000);
      expect(session.verifyResetToken(token)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('purposeSigner', () => {
  it('signs the same value differently for each purpose, so a token made for one use fails every other check', () => {
    const state = session.purposeSigner('meta-oauth-state');
    const job = session.purposeSigner('video-job');
    expect(state('abc')).toBe(state('abc'));
    expect(state('abc')).not.toBe(job('abc'));
    expect(state('abc')).not.toBe(session.signValue('abc'));
  });

  it('never produces a valid session token', () => {
    const body = Buffer.from(JSON.stringify({ ...PAYLOAD, exp: Date.now() + DAY })).toString('base64url');
    expect(session.verifySession(`${body}.${session.purposeSigner('video-job')(body)}`)).toBeNull();
    expect(session.verifySession(`${body}.${session.signValue(body)}`)).not.toBeNull();
  });
});
