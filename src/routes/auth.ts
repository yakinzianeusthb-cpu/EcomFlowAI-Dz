import crypto from "crypto";
import express, { Router } from "express";
import { prisma } from "../lib/prisma";
import { createRateLimiter } from "../lib/rateLimit";
import { publicCache } from "../lib/cache";
import { hashPassword, verifyPassword } from "../lib/password";
import { sendOtpEmail, sendContactEmail } from "../lib/email";
import { isPlanActive } from "../lib/access";
import { isEmailAddress } from "../lib/emailAddress";
import { metaConfig } from "../lib/meta";
import { issueOtp, verifyOtpCode, OtpRateLimitedError } from "../lib/otp";
import {
  clearSessionCookie,
  getCurrentUser,
  parseCookies,
  requireAuth,
  SessionPayload,
  setSessionCookie,
  signResetToken,
  signSession,
  verifyResetToken,
} from "../lib/session";

const router = Router();

// ---------------------------------------------------------------------------
// Env configuration
// ---------------------------------------------------------------------------
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APP_URL =
  process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@dzads.ai";
export const ADMIN_TELEGRAM = process.env.ADMIN_TELEGRAM || "DzAdsAdmin";

const STATE_COOKIE = "dzads_oauth_state";
const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

// ---- Rate limiters (brute-force protection) --------------------------------
const ipKey = (req: express.Request) =>
  req.ip || req.socket?.remoteAddress || "unknown";
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyFn: ipKey,
  message: "Trop de tentatives. Réessaie dans 15 minutes.",
});
const registerLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyFn: ipKey,
  message: "Trop de comptes créés depuis cette adresse. Réessaie plus tard.",
});
const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyFn: (req) => `${ipKey(req)}|${String(req.body?.email || "").toLowerCase().slice(0, 254)}`,
  message: "Trop de codes essayés. Réessaie dans 15 minutes.",
});
// Each contact message is an e-mail to the admin: a few per hour per account is plenty.
const contactLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyFn: (req) => (req.user as SessionPayload | undefined)?.sub ?? ipKey(req),
  message: "Trop de messages envoyés. Réessaie dans une heure.",
});
const resendLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyFn: ipKey,
  message: "Trop de demandes de code. Réessaie dans une minute.",
});

export function getGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// ---------------------------------------------------------------------------
// Google OAuth helpers (same flow as the original server-auth.ts)
// ---------------------------------------------------------------------------
function getGoogleAuthURL(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForProfile(
  code: string,
): Promise<{ email: string; name: string; avatar?: string }> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed (${tokenRes.status})`);
  const token = await tokenRes.json();

  const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!infoRes.ok) throw new Error("Failed to fetch Google user info");
  const info = await infoRes.json();
  return { email: info.email, name: info.name || info.email, avatar: info.picture };
}

// ---------------------------------------------------------------------------
// Prisma-backed user upsert
// ---------------------------------------------------------------------------
async function upsertUser(profile: { email: string; name: string; avatar?: string }) {
  return prisma.user.upsert({
    where: { email: profile.email.toLowerCase() },
    create: {
      email: profile.email,
      name: profile.name || profile.email,
      avatarUrl: profile.avatar,
    },
    update: { name: profile.name || undefined, avatarUrl: profile.avatar || undefined },
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/auth/google — start Google OAuth, or run the dev mock when Google
// credentials are missing so the full flow stays testable without them.
router.get("/api/auth/google", async (req, res) => {
  try {
    if (!getGoogleConfigured()) {
      // Dev-only mock: never auto-login in production, where anyone could
      // claim the demo account or bypass Google verification.
      if (process.env.NODE_ENV === "production") {
        return res.status(503).send("Authentification Google non configurée.");
      }
      const user = await upsertUser({ email: "demo@dzads.ai", name: "Ahmed (Demo)" });
      const token = signSession({
        sub: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatarUrl ?? undefined,
        mock: true,
      });
      setSessionCookie(res, token);
      return res.redirect("/");
    }

    const state = crypto.randomUUID();
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: STATE_MAX_AGE_MS,
    });
    return res.redirect(getGoogleAuthURL(state));
  } catch (err: any) {
    console.error("Google auth error:", err);
    return res.status(500).send("Échec de la connexion. Réessayez.");
  }
});

// GET /api/auth/google/callback — verify state, exchange the code, log the user in.
router.get("/api/auth/google/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const cookies = parseCookies(req);
  if (!code || !state || state !== cookies[STATE_COOKIE]) {
    return res.status(400).send("Paramètres OAuth invalides. Réessayez.");
  }
  try {
    const profile = await exchangeCodeForProfile(code);
    const user = await upsertUser(profile);
    const token = signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl ?? undefined,
    });
    res.clearCookie(STATE_COOKIE, { path: "/" });
    setSessionCookie(res, token);
    return res.redirect("/");
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return res.status(500).send("Échec de la connexion Google. Réessayez.");
  }
});

// ---------------------------------------------------------------------------
// Email / password authentication with 6-digit OTP verification
// ---------------------------------------------------------------------------


function rateLimitError(err: unknown): boolean {
  return err instanceof OtpRateLimitedError;
}

/** Strips sensitive fields (password hash) before sending a user to the client. */
function publicUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

// POST /api/auth/register — name + email + password. Creates the account and
// sends a verification OTP to the email. The account only activates on verify.
router.post("/api/auth/register", registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const displayName = String(name || "").trim();

    if (!displayName) {
      return res.status(400).json({ error: "Le nom est requis." });
    }
    if (!isEmailAddress(normalizedEmail)) {
      return res.status(400).json({ error: "Adresse email invalide." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ error: "Le mot de passe doit contenir au moins 8 caractères." });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing && existing.emailVerifiedAt) {
      // Enumeration-safe: same response as a fresh signup, but nothing is
      // created or sent. The user will just log in instead.
      return res.status(201).json({
        ok: true,
        email: normalizedEmail,
        mode: "verification",
        dev: false,
        expiresInSec: 600,
      });
    }

    // Create the account, or refresh an unverified account re-registering.
    let user = existing;
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          passwordHash: hashPassword(password),
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: displayName, passwordHash: hashPassword(password) },
      });
    }

    const otp = await issueOtp(user.id, "verification");
    const sent = await sendOtpEmail(user.email, otp.code, {
      reason: "verification",
      expiresMinutes: Math.ceil(otp.expiresInSec / 60),
    });

    return res.status(201).json({
      ok: true,
      email: user.email,
      mode: "verification",
      dev: sent.dev,
      expiresInSec: otp.expiresInSec,
    });
  } catch (err: any) {
    if (rateLimitError(err)) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Register error:", err);
    return res
      .status(500)
      .json({ error: "Erreur lors de la création du compte." });
  }
});

// POST /api/auth/login — email + password. Sends a 6-digit OTP (verification
// if the email is unverified, login otherwise) that must be confirmed.
router.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      // Same message for unknown email / wrong password — don't leak accounts.
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const reason: "verification" | "login" = user.emailVerifiedAt
      ? "login"
      : "verification";
    const otp = await issueOtp(user.id, reason);
    const sent = await sendOtpEmail(user.email, otp.code, {
      reason,
      expiresMinutes: Math.ceil(otp.expiresInSec / 60),
    });

    return res.json({
      ok: true,
      email: user.email,
      mode: reason,
      dev: sent.dev,
      expiresInSec: otp.expiresInSec,
    });
  } catch (err: any) {
    if (rateLimitError(err)) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Login error:", err);
    return res.status(500).json({ error: "Erreur lors de la connexion." });
  }
});

// POST /api/auth/verify-otp — confirm the 6-digit code, activate the email
// (if needed) and create the session.
router.post("/api/auth/verify-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const { email, code } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail || !code) {
      return res.status(400).json({ error: "Code et email requis." });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return res.status(400).json({ error: "Code invalide ou expiré." });
    }

    const ok = await verifyOtpCode(user.id, String(code));
    if (!ok) {
      return res.status(400).json({ error: "Code invalide ou expiré." });
    }

    if (!user.emailVerifiedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    const token = signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatarUrl ?? undefined,
    });
    setSessionCookie(res, token);

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    return res.json({ user: publicUser(fresh!) });
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ error: "Erreur lors de la vérification." });
  }
});

// POST /api/auth/resend-otp — send a fresh code (rate-limited).
router.post("/api/auth/resend-otp", resendLimiter, async (req, res) => {
  try {
    const { email, reason } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email requis." });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      // Enumeration-safe: same success shape, no email sent.
      return res.json({
        ok: true,
        email: normalizedEmail,
        dev: false,
        expiresInSec: 600,
      });
    }

    const otpReason: "verification" | "login" | "password_reset" =
      reason === "login" || reason === "password_reset" ? reason : "verification";
    const otp = await issueOtp(user.id, otpReason);
    const sent = await sendOtpEmail(user.email, otp.code, {
      reason: otpReason,
      expiresMinutes: Math.ceil(otp.expiresInSec / 60),
    });

    return res.json({
      ok: true,
      email: user.email,
      dev: sent.dev,
      expiresInSec: otp.expiresInSec,
    });
  } catch (err: any) {
    if (rateLimitError(err)) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error("Resend OTP error:", err);
    return res.status(500).json({ error: "Erreur lors de l'envoi du code." });
  }
});

// GET /api/auth/me — the current session's user (Prisma-backed).
router.get("/api/auth/me", async (req, res) => {
  const session = getCurrentUser(req);
  if (!session) return res.status(401).json({ user: null });
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return res.status(401).json({ user: null });
  return res.json({ user: publicUser(user), isMock: Boolean(session.mock) });
});

// POST /api/auth/plan — select a subscription plan for the user. The plan is
// NOT activated here: it is recorded as "pending" and only the admin approve
// endpoint flips it to "active" once the manual payment is verified.
const PLAN_IDS = ["monthly", "quarterly", "lifetime"] as const;
router.post("/api/auth/plan", requireAuth, async (req, res) => {
  const session = req.user as SessionPayload;
  const { plan } = req.body || {};
  if (typeof plan !== "string" || !PLAN_IDS.includes(plan as (typeof PLAN_IDS)[number])) {
    return res.status(400).json({ error: "Plan invalide." });
  }

  const current = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { planStatus: true, planExpiresAt: true },
  });
  // Never downgrade/lock a live subscription by re-selecting. A plan that has run out is not live,
  // so its owner can pick a plan again to renew.
  if (isPlanActive(current)) {
    return res.status(400).json({ error: "Un plan est déjà actif." });
  }

  const user = await prisma.user.update({
    where: { id: session.sub },
    data: {
      plan,
      planStatus: "pending",
      planSelectedAt: new Date(),
    },
  });
  res.json({ user: publicUser(user) });
});

// POST /api/auth/logout — clear the session cookie.
router.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// GET /api/config — public config (admin payment contacts), DB-backed with env fallback.
// metaPublishing says whether this site has a Meta app configured (the home page only mentions publishing then).
router.get("/api/config", publicCache(), async (_req, res) => {
  const metaPublishing = metaConfig().missing.length === 0;
  try {
    const cfg = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
    res.json({
      adminEmail: cfg?.adminEmail || ADMIN_EMAIL,
      adminTelegram: cfg?.adminTelegram || ADMIN_TELEGRAM,
      whatsappNumber: cfg?.whatsappNumber || "",
      metaPublishing,
    });
  } catch (err) {
    console.error("Get config error:", err);
    res.json({ adminEmail: ADMIN_EMAIL, adminTelegram: ADMIN_TELEGRAM, whatsappNumber: "", metaPublishing });
  }
});

// POST /api/contact — send a contact form message to the admin by email.
router.post("/api/contact", requireAuth, contactLimiter, async (req, res) => {
  try {
    const b = req.body || {};
    const name = typeof b.name === "string" ? b.name.trim() : "";
    const email = typeof b.email === "string" ? b.email.trim() : "";
    const subject = typeof b.subject === "string" ? b.subject.trim() : "";
    const message = typeof b.message === "string" ? b.message.trim() : "";

    if (!name || name.length > 120) {
      return res.status(400).json({ error: "Nom invalide." });
    }
    if (!email || email.length > 128 || !isEmailAddress(email)) {
      return res.status(400).json({ error: "Email invalide." });
    }
    if (!subject || subject.length > 120) {
      return res.status(400).json({ error: "Sujet invalide." });
    }
    if (!message || message.length < 10 || message.length > 5000) {
      return res.status(400).json({ error: "Le message doit contenir entre 10 et 5000 caractères." });
    }

    // Resolve admin email from DB (env fallback)
    const cfg = await prisma.platformConfig.findUnique({ where: { id: "singleton" } }).catch(() => null);
    const adminEmail = cfg?.adminEmail || ADMIN_EMAIL;

    await sendContactEmail(adminEmail, {
      fromName: name,
      fromEmail: email,
      subject,
      message,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi. Réessaie." });
  }
});

// ---------------------------------------------------------------------------
// Password reset flow
// ---------------------------------------------------------------------------

// POST /api/auth/forgot-password — send a password-reset OTP. Enumeration-safe:
// always returns the same shape whether or not the email has an account.
router.post("/api/auth/forgot-password", resendLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string")
      return res.status(400).json({ error: "Email requis." });
    const normalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    // Always return the same shape regardless of whether user exists (enumeration-safe)
    const dummyResponse = { ok: true, email: normalized, expiresInSec: 600 };

    if (!user || !user.passwordHash) {
      // User not found or Google-only account — return success but don't send
      return res.json(dummyResponse);
    }

    const otp = await issueOtp(user.id, "password_reset");
    const sent = await sendOtpEmail(user.email, otp.code, {
      reason: "password_reset",
      expiresMinutes: 10,
    });
    return res.json({
      ok: true,
      email: normalized,
      dev: sent.dev,
      expiresInSec: otp.expiresInSec,
    });
  } catch (err: any) {
    if (err instanceof OtpRateLimitedError)
      return res
        .status(429)
        .json({ error: "Trop de demandes. Réessaie dans une minute." });
    console.error("forgot-password error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/auth/verify-reset-otp — confirm the password-reset code and issue
// a short-lived reset token.
router.post("/api/auth/verify-reset-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email et code requis." });
    const normalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) return res.status(400).json({ error: "Code invalide ou expiré." });

    const ok = await verifyOtpCode(user.id, code, { reasons: ["password_reset"] });
    if (!ok) return res.status(400).json({ error: "Code invalide ou expiré." });

    const resetToken = signResetToken(user.email);
    return res.json({ ok: true, email: normalized, resetToken, expiresInSec: 600 });
  } catch (err: any) {
    console.error("verify-reset-otp error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/auth/reset-password — set a new password using a verified reset token.
router.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, resetToken, password } = req.body;
    if (!email || !resetToken || !password)
      return res.status(400).json({ error: "Tous les champs sont requis." });
    if (typeof password !== "string" || password.length < 8)
      return res
        .status(400)
        .json({ error: "Le mot de passe doit contenir au moins 8 caractères." });

    const normalized = email.trim().toLowerCase();
    const payload = verifyResetToken(resetToken);
    if (!payload || payload.email !== normalized)
      return res.status(400).json({ error: "Lien expiré ou invalide. Recommence." });

    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) return res.status(400).json({ error: "Utilisateur introuvable." });

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("reset-password error:", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/user/payment-proof — submit payment proof
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB decoded
const PROOF_MIME = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/i;

function validateProof(
  proof: unknown,
): { ok: true; dataUrl: string } | { ok: false; error: string } {
  if (proof == null || proof === "") return { ok: true, dataUrl: "" };
  if (typeof proof !== "string" || !proof.startsWith("data:")) {
    return { ok: false, error: "Preuve invalide." };
  }
  const header = proof.match(/^data:([^;]+);base64,/);
  if (!header || !PROOF_MIME.test(header[1])) {
    return { ok: false, error: "Format de preuve non supporté (image ou PDF)." };
  }
  const approxBytes = Math.ceil(((proof.length - header[0].length) * 3) / 4);
  if (approxBytes > MAX_PROOF_BYTES) {
    return { ok: false, error: "La preuve dépasse 5 Mo." };
  }
  return { ok: true, dataUrl: proof };
}

router.post("/api/user/payment-proof", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { proof, method } = req.body || {};

    if (typeof method !== "string" || !method) {
      return res.status(400).json({ error: "Méthode de paiement requise." });
    }
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { code: method, enabled: true },
      select: { code: true },
    });
    if (!paymentMethod) {
      return res.status(400).json({ error: "Méthode de paiement invalide." });
    }

    if (proof == null || proof === "") {
      return res.status(400).json({ error: "Preuve de paiement requise." });
    }

    const check = validateProof(proof);
    if (!check.ok) {
      return res.status(400).json({ error: (check as { error: string }).error });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        paymentProof: check.dataUrl || null,
        paymentMethod: method,
        paymentSubmittedAt: new Date(),
      },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Payment proof error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export const authRouter = router;

