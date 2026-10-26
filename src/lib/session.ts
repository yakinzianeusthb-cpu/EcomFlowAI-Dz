/**
 * HMAC-signed session cookie helpers + Express middleware.
 * Shared by all authenticated routes.
 */
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// Fail closed: in production the secret is mandatory. A missing/empty secret
// would otherwise let anyone forge sessions AND password-reset tokens.
const SESSION_SECRET = (() => {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set when NODE_ENV=production");
  }
  return "dzads-dev-session-secret"; // dev-only fallback
})();

export const SESSION_COOKIE = "dzads_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 3600 * 1000; // 30 days

// ---- Session payload -------------------------------------------------------

export interface SessionPayload {
  sub: string;     // user id
  email: string;
  name: string;
  avatar?: string;
  mock?: boolean;
  /** Expiry as epoch milliseconds. Tokens issued before this field existed have none. */
  exp?: number;
  /** Stamp of the password the session was opened with (see passwordStamp). Tokens issued before it existed have none. */
  pw?: string;
}

// Attach the verified session to `req.user` so authenticated route handlers
// can use `const user = req.user as SessionPayload;`.
declare global {
  namespace Express {
    interface Request {
      user?: SessionPayload;
    }
  }
}

// ---- Signing / verifying ---------------------------------------------------

/** HMAC of a value with the session secret (for other short-lived tokens, such as AI video jobs). */
export function signValue(value: string): string {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

/** A signer bound to one purpose: a token signed for one use (a login state, a video job) never verifies for another. */
export const purposeSigner = (purpose: string) => (value: string): string => signValue(`${purpose}:${value}`);

/**
 * A short, keyed fingerprint of the account's password hash (or of "no password"). Sessions and reset tokens carry
 * it, so changing the password ends every session opened before and voids reset tokens already used. The hash
 * itself never leaves the server.
 */
export function passwordStamp(passwordHash: string | null | undefined): string {
  return signValue(`password-stamp:${passwordHash ?? ""}`).slice(0, 16);
}

/** Signs a session token. Unless the caller sets one, it expires with the cookie (30 days). */
export function signSession(payload: SessionPayload): string {
  const stamped: SessionPayload = { ...payload, exp: payload.exp ?? Date.now() + SESSION_MAX_AGE_MS };
  const body = Buffer.from(JSON.stringify(stamped)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Returns the session when the signature is valid and the token has not expired.
 * Tokens issued before expiry existed (no `exp`) are still accepted; `requireAuth` upgrades them.
 */
export function verifySession(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
    if (!payload || typeof payload.sub !== "string") return null;
    if (typeof payload.exp === "number" && payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---- Cookie parsing --------------------------------------------------------

export function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function getCurrentUser(req: Request): SessionPayload | null {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySession(token);
}

// ---- Express middleware -----------------------------------------------------

/** The account fields a session is checked against. */
export interface SessionAccount {
  passwordHash: string | null;
}

/**
 * True when the session still belongs to the account as it is now: the password has not changed since it was
 * opened. A token issued before stamps existed has none and is accepted (requireAuth then stamps it).
 */
export function sessionMatchesAccount(session: SessionPayload, account: SessionAccount): boolean {
  return session.pw === undefined || session.pw === passwordStamp(account.passwordHash);
}

type SessionAccountLoader = (userId: string) => Promise<SessionAccount | null>;

/**
 * Builds the middleware that lets signed-in requests through (see requireAuth.ts for the real one). The signature
 * alone is not enough: the account must still exist and its password must not have changed since sign-in.
 */
export function createRequireAuth(loadAccount: SessionAccountLoader) {
  return async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const user = getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: "Authentification requise." });
    }
    let account: SessionAccount | null;
    try {
      account = await loadAccount(user.sub);
    } catch (err) {
      console.error("Session check failed:", err);
      return res.status(500).json({ error: "Erreur serveur." });
    }
    if (!account || !sessionMatchesAccount(user, account)) {
      return res.status(401).json({ error: "Authentification requise." });
    }
    req.user = user;
    // A token issued before expiry or stamps existed would otherwise stay valid forever, or survive a password
    // change: swap it for one that has both (keeping its expiry), so nobody is logged out by the change.
    // Rotating SESSION_SECRET invalidates every old token at once.
    if (user.exp === undefined || user.pw === undefined) {
      setSessionCookie(res, signSession({ ...user, pw: passwordStamp(account.passwordHash) }));
    }
    next();
  };
}

// ---- Cookie helpers --------------------------------------------------------

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // Never send the session cookie over plain HTTP in production.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

// ---- Password reset tokens --------------------------------------------------

const RESET_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** A reset token is tied to the password it replaces: once the password changes, the token no longer works. */
export function signResetToken(email: string, passwordHash: string | null | undefined): string {
  const payload = JSON.stringify({ purpose: 'password_reset', email: email.toLowerCase(), pw: passwordStamp(passwordHash), exp: Date.now() + RESET_TTL_MS });
  const body = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

/** `pw` is the stamp of the password the token may replace (undefined on tokens issued before stamps existed). */
export function verifyResetToken(token: string): { email: string; pw?: string } | null {
  try {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.purpose !== 'password_reset') return null;
    if (Date.now() > payload.exp) return null;
    return { email: payload.email, ...(typeof payload.pw === 'string' && { pw: payload.pw }) };
  } catch {
    return null;
  }
}
