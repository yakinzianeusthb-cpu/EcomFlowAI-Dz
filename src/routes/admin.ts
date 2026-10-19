import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { encryptSecret, maskSecret } from '../lib/crypto';
import { requireAuth } from '../lib/session';
import { requireAdmin } from '../lib/admin';
import { publicCache } from '../lib/cache';
import { isPlaceholderGuide } from '../lib/dashboardContent';

const router = Router();

// Subset of API_FIELDS that holds secrets (encrypted at rest, masked on read).
const SECRET_API_FIELDS = [
  'facebookAdsToken',
  'tiktokAdsToken',
  'googleAdsDeveloperToken',
  'snapAdsToken',
  'geminiApiKey',
  'customApiToken',
] as const;

function maskApiSettings(apiSettings: Record<string, any> | null | undefined) {
  if (!apiSettings) return apiSettings;
  const out = { ...apiSettings };
  for (const f of SECRET_API_FIELDS) {
    if (out[f]) out[f] = maskSecret(out[f]) ?? '';
  }
  return out;
}

/** Reads the singleton platform config, creating it with defaults on first use. */
async function getPlatformConfig() {
  const existing = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } });
  if (existing) return existing;
  return prisma.platformConfig.create({ data: { id: 'singleton' } });
}

/* ------------------------------------------------------------------ */
/* Public read endpoints (used by the app: checkout + dashboard)       */
/* ------------------------------------------------------------------ */

// GET /api/payment-methods — enabled payment methods for the checkout.
router.get('/api/payment-methods', publicCache(), async (_req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(methods);
  } catch (err) {
    console.error('Get payment methods error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/announcements/active — announcements live right now.
// The free-trial offer is built into the dashboard, translated; it is no longer created here in French.
router.get('/api/announcements/active', publicCache(), async (_req, res) => {
  try {
    const now = new Date();
    const items = await prisma.announcement.findMany({
      where: {
        active: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(items);
  } catch (err) {
    console.error('Get active announcements error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/hot-deals/active — featured products shown on the dashboard.
router.get('/api/hot-deals/active', publicCache(), async (_req, res) => {
  try {
    const items = await prisma.hotDeal.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 20,
    });
    res.json(items);
  } catch (err) {
    console.error('Get active hot deals error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/guides/active — video guides shown on the client dashboard.
router.get('/api/guides/active', publicCache(), async (_req, res) => {
  try {
    const items = await prisma.guide.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      take: 30,
    });
    res.json(items.filter((g) => !isPlaceholderGuide(g)));
  } catch (err) {
    console.error('Get active guides error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/platform/pricing — plan prices + currency (public: shown on the
// marketing landing page and in the checkout).
router.get('/api/platform/pricing', publicCache(), async (_req, res) => {
  try {
    const cfg = await getPlatformConfig();
    res.json({
      currencyCode: cfg.currencyCode,
      currencySymbol: cfg.currencySymbol,
      currencyPosition: cfg.currencyPosition,
      monthlyPrice: cfg.monthlyPrice,
      quarterlyPrice: cfg.quarterlyPrice,
      lifetimePrice: cfg.lifetimePrice,
    });
  } catch (err) {
    console.error('Get pricing error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — Overview / stats                                            */
/* ------------------------------------------------------------------ */

// GET /api/admin/stats
router.get('/api/admin/stats', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [totalUsers, activeSubs, pendingPayments, totalGenerations, paymentMethods, announcements, hotDeals] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { planStatus: 'active' } }),
        prisma.user.count({ where: { planStatus: 'pending' } }),
        prisma.generationHistory.count(),
        prisma.paymentMethod.count(),
        prisma.announcement.count(),
        prisma.hotDeal.count(),
      ]);
    res.json({ totalUsers, activeSubs, pendingPayments, totalGenerations, paymentMethods, announcements, hotDeals });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — Pending payments                                            */
/* ------------------------------------------------------------------ */

// GET /api/admin/pending-payments
router.get('/api/admin/pending-payments', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { planStatus: 'pending', plan: { not: null } },
      select: {
        id: true, name: true, email: true, plan: true, planStatus: true,
        paymentProof: true, paymentMethod: true, paymentSubmittedAt: true,
        planSelectedAt: true, planDays: true, createdAt: true,
      },
      orderBy: { planSelectedAt: 'desc' },
    });
    res.json(pendingUsers);
  } catch (err) {
    console.error('Get pending payments error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/approve/:userId
router.post('/api/admin/approve/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    if (user.planStatus !== 'pending') return res.status(400).json({ error: 'Pas en attente.' });

    const now = new Date();
    let expiresAt: Date | null = null;
    if (user.plan === 'monthly') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    else if (user.plan === 'quarterly') expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        planStatus: 'active',
        planActiveFrom: now,
        planExpiresAt: expiresAt,
        planDays: user.plan === 'quarterly' ? 90 : user.plan === 'monthly' ? 30 : null,
      },
    });
    res.json({ ok: true, message: `Plan activé pour ${user.email}.` });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/reject/:userId
router.post('/api/admin/reject/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    await prisma.user.update({
      where: { id: userId },
      data: { planStatus: null, plan: null, paymentProof: null, paymentMethod: null, paymentSubmittedAt: null },
    });
    res.json({ ok: true, message: `Paiement de ${user.email} rejeté.` });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — Users management                                            */
/* ------------------------------------------------------------------ */

// GET /api/admin/all-users
router.get('/api/admin/all-users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, plan: true, planStatus: true,
        isAdmin: true, paymentMethod: true, createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/admin/users/:userId — full detail (profile + api settings + usage).
// Uses an explicit select so passwordHash is never returned.
router.get('/api/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, avatarUrl: true,
        emailVerifiedAt: true, isAdmin: true, plan: true, planStatus: true,
        planSelectedAt: true, planActiveFrom: true, planExpiresAt: true, planDays: true,
        paymentProof: true, paymentMethod: true, paymentSubmittedAt: true, paymentNote: true,
        createdAt: true, updatedAt: true,
        apiSettings: true,
        userPreferences: true,
        _count: {
          select: {
            generationHistory: true,
            productCatalog: true,
            chatSessions: true,
            lpSessions: true,
            emailOtps: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ ...user, apiSettings: maskApiSettings(user.apiSettings) });
  } catch (err) {
    console.error('Get user detail error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/users/:userId/toggle-admin
router.post('/api/admin/users/:userId/toggle-admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (userId === req.user?.sub) return res.status(400).json({ error: 'Impossible de se retirer les droits admin.' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    const updated = await prisma.user.update({ where: { id: userId }, data: { isAdmin: !user.isAdmin } });
    res.json({ ok: true, isAdmin: updated.isAdmin });
  } catch (err) {
    console.error('Toggle admin error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/users/:userId/reset-plan — clear plan + payment fields.
router.post('/api/admin/users/:userId/reset-plan', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: null, planStatus: null, planSelectedAt: null, planActiveFrom: null,
        planExpiresAt: null, planDays: null, paymentProof: null, paymentMethod: null, paymentSubmittedAt: null, paymentNote: null,
      },
    });
    res.json({ ok: true, message: `Plan de ${user.email} réinitialisé.` });
  } catch (err) {
    console.error('Reset plan error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/users/:userId/set-plan — grant any plan duration (1 day, 7 days,
// 45 days, custom…). body: { plan: 'monthly'|'quarterly'|'lifetime'|'custom', days?: number }.
router.post('/api/admin/users/:userId/set-plan', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const { plan, days } = req.body || {};
    const valid = ['monthly', 'quarterly', 'lifetime', 'custom'];
    if (!valid.includes(plan)) return res.status(400).json({ error: 'Plan invalide.' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const now = new Date();
    const isLifetime = plan === 'lifetime';
    const grantedDays = isLifetime ? null : Math.floor(Number(days));
    if (!isLifetime && (!Number.isFinite(grantedDays) || grantedDays < 1 || grantedDays > 3650)) {
      return res.status(400).json({ error: 'Durée invalide (entre 1 et 3650 jours).' });
    }

    const expiresAt: Date | null = isLifetime
      ? null
      : new Date(now.getTime() + grantedDays * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: { plan, planStatus: 'active', planActiveFrom: now, planExpiresAt: expiresAt, planDays: grantedDays },
    });
    res.json({
      ok: true,
      message: isLifetime
        ? `Plan à vie activé pour ${user.email}.`
        : `Plan de ${grantedDays}j activé pour ${user.email}.`,
    });
  } catch (err) {
    console.error('Set plan error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/users/:userId
router.delete('/api/admin/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    if (userId === req.user?.sub) return res.status(400).json({ error: 'Impossible de supprimer son propre compte.' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    await prisma.user.delete({ where: { id: userId } });
    res.json({ ok: true, message: `${user.email} supprimé.` });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — API settings management (per user) + platform config        */
/* ------------------------------------------------------------------ */

const API_FIELDS = [
  'facebookAdsToken', 'facebookAccountId',
  'tiktokAdsToken', 'tiktokAccountId',
  'googleAdsCustomerId', 'googleAdsDeveloperToken',
  'snapAdsToken', 'snapAccountId',
  'geminiApiKey', 'workspaceName', 'customApiToken',
] as const;

// GET /api/admin/api-settings — every user + which integrations they connected.
router.get('/api/admin/api-settings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, isAdmin: true,
        apiSettings: { select: { id: true, ...API_FIELDS.reduce((acc, f) => ({ ...acc, [f]: true }), {}) } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users.map(u => ({ ...u, apiSettings: maskApiSettings(u.apiSettings) })));
  } catch (err) {
    console.error('Get api settings error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/api-settings/:userId — upsert a user's API settings.
// Secret fields are encrypted before storage. A masked value (server-generated,
// contains "•") is treated as "unchanged"; empty/null clears the field.
router.put('/api/admin/api-settings/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    const body = req.body || {};
    const provided = API_FIELDS.filter((f) => body[f] !== undefined);
    if (provided.length === 0) return res.status(400).json({ error: 'Aucune donnée à enregistrer.' });

    const data: Record<string, any> = {};
    for (const f of provided) {
      const raw = body[f];
      if (SECRET_API_FIELDS.includes(f as any)) {
        if (raw == null || raw === '') {
          data[f] = null; // explicit clear
        } else if (typeof raw === 'string' && raw.includes('•')) {
          continue; // server-issued mask → leave existing value untouched
        } else {
          data[f] = encryptSecret(String(raw));
        }
      } else {
        data[f] = raw == null || raw === '' ? null : raw;
      }
    }

    let settings;
    if (Object.keys(data).length === 0) {
      // Only masked (unchanged) values were sent — nothing to write.
      settings = await prisma.apiSettings.findUnique({ where: { userId } });
    } else {
      settings = await prisma.apiSettings.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
      });
    }
    res.json({ ok: true, settings: maskApiSettings(settings as any) });
  } catch (err) {
    console.error('Update api settings error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/api-settings/:userId
router.delete('/api/admin/api-settings/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    await prisma.apiSettings.deleteMany({ where: { userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete api settings error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/admin/platform-config — masked env / infra status.
router.get('/api/admin/platform-config', requireAuth, requireAdmin, async (_req, res) => {
  const env = process.env;
  const cfg = await prisma.platformConfig.findUnique({ where: { id: 'singleton' } }).catch(() => null);
  res.json({
    appUrl: env.APP_URL || `http://localhost:${env.PORT || 3000}`,
    adminEmail: cfg?.adminEmail || env.ADMIN_EMAIL || 'admin@dzads.ai',
    adminTelegram: cfg?.adminTelegram || env.ADMIN_TELEGRAM || 'DzAdsAdmin',
    email: env.RESEND_API_KEY ? 'resend' : env.SMTP_HOST ? 'smtp' : 'console',
    smtpHost: env.SMTP_HOST || null,
    googleOauth: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    telegramScout: Boolean(env.TELEGRAM_API_ID && env.TELEGRAM_API_HASH && env.TELEGRAM_SESSION),
    nodeEnv: env.NODE_ENV || 'development',
  });
});

// GET /api/admin/pricing — current plan prices + currency.
router.get('/api/admin/pricing', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const cfg = await getPlatformConfig();
    res.json({
      currencyCode: cfg.currencyCode,
      currencySymbol: cfg.currencySymbol,
      currencyPosition: cfg.currencyPosition,
      monthlyPrice: cfg.monthlyPrice,
      quarterlyPrice: cfg.quarterlyPrice,
      lifetimePrice: cfg.lifetimePrice,
    });
  } catch (err) {
    console.error('Admin get pricing error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/pricing — update plan prices + currency.
router.put('/api/admin/pricing', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const clampPrice = (v: unknown) =>
      typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100_000_000;
    if (!clampPrice(b.monthlyPrice) || !clampPrice(b.quarterlyPrice) || !clampPrice(b.lifetimePrice)) {
      return res.status(400).json({ error: 'Prix invalides (entiers positifs requis).' });
    }
    const code = typeof b.currencyCode === 'string' ? b.currencyCode.trim() : '';
    const symbol = typeof b.currencySymbol === 'string' ? b.currencySymbol.trim() : '';
    if (!code || code.length > 16 || !symbol || symbol.length > 16) {
      return res.status(400).json({ error: 'Code ou symbole de devise invalide.' });
    }
    if (b.currencyPosition !== 'before' && b.currencyPosition !== 'after') {
      return res.status(400).json({ error: 'Position de la devise invalide.' });
    }

    const data = {
      currencyCode: code,
      currencySymbol: symbol,
      currencyPosition: b.currencyPosition,
      monthlyPrice: b.monthlyPrice,
      quarterlyPrice: b.quarterlyPrice,
      lifetimePrice: b.lifetimePrice,
    };
    const cfg = await prisma.platformConfig.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    res.json({
      ok: true,
      currencyCode: cfg.currencyCode,
      currencySymbol: cfg.currencySymbol,
      currencyPosition: cfg.currencyPosition,
      monthlyPrice: cfg.monthlyPrice,
      quarterlyPrice: cfg.quarterlyPrice,
      lifetimePrice: cfg.lifetimePrice,
    });
  } catch (err) {
    console.error('Admin update pricing error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/admin/contact-settings — current admin contact info (DB, env fallback).
router.get('/api/admin/contact-settings', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const cfg = await getPlatformConfig();
    res.json({
      whatsappNumber: cfg.whatsappNumber || '',
      adminTelegram: cfg.adminTelegram || process.env.ADMIN_TELEGRAM || 'DzAdsAdmin',
      adminEmail: cfg.adminEmail || process.env.ADMIN_EMAIL || 'admin@dzads.ai',
    });
  } catch (err) {
    console.error('Admin get contact-settings error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/contact-settings — update admin contact info.
router.put('/api/admin/contact-settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const str = (v: unknown, max: number) =>
      typeof v === 'string' ? v.trim().slice(0, max) : '';

    const whatsappNumber = str(b.whatsappNumber, 20).replace(/[^0-9]/g, '');
    if (whatsappNumber && (whatsappNumber.length < 8 || whatsappNumber.length > 15)) {
      return res.status(400).json({ error: 'Numéro WhatsApp invalide (8 à 15 chiffres, format international).' });
    }

    const adminTelegram = str(b.adminTelegram, 64);
    if (adminTelegram && !/^[a-zA-Z0-9_]{4,64}$/.test(adminTelegram)) {
      return res.status(400).json({ error: "Nom d'utilisateur Telegram invalide." });
    }

    const adminEmail = str(b.adminEmail, 128);
    if (adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide.' });
    }

    const data = { whatsappNumber, adminTelegram, adminEmail };
    const cfg = await prisma.platformConfig.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });
    res.json({
      ok: true,
      whatsappNumber: cfg.whatsappNumber,
      adminTelegram: cfg.adminTelegram,
      adminEmail: cfg.adminEmail,
    });
  } catch (err) {
    console.error('Admin update contact-settings error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — Payment methods                                             */
/* ------------------------------------------------------------------ */

// GET /api/admin/payment-methods
router.get('/api/admin/payment-methods', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const methods = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(methods);
  } catch (err) {
    console.error('Admin list payment methods error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/payment-methods
router.post('/api/admin/payment-methods', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { code, name, description, emoji, type, instructions, details, enabled, sortOrder } = req.body || {};
    if (!code || !name) return res.status(400).json({ error: 'Code et nom requis.' });
    const method = await prisma.paymentMethod.create({
      data: {
        code: String(code).trim().toLowerCase().replace(/\s+/g, '-'),
        name: String(name).trim(),
        description: description || null,
        emoji: emoji || '💳',
        type: type || 'manual',
        instructions: Array.isArray(instructions) ? instructions : [],
        details: details || undefined,
        enabled: enabled !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });
    res.json(method);
  } catch (err: any) {
    console.error('Create payment method error:', err);
    if (err?.code === 'P2002') return res.status(400).json({ error: 'Ce code existe déjà.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/payment-methods/:id
router.put('/api/admin/payment-methods/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = req.body || {};
    const data: Record<string, any> = {};
    for (const k of ['name', 'description', 'emoji', 'type', 'sortOrder', 'enabled', 'code']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.instructions !== undefined) data.instructions = Array.isArray(body.instructions) ? body.instructions : [];
    if (body.details !== undefined) data.details = body.details;
    const method = await prisma.paymentMethod.update({ where: { id }, data });
    res.json(method);
  } catch (err: any) {
    console.error('Update payment method error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Méthode introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/payment-methods/:id
router.delete('/api/admin/payment-methods/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.paymentMethod.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete payment method error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Méthode introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — Announcements                                               */
/* ------------------------------------------------------------------ */

// GET /api/admin/announcements
router.get('/api/admin/announcements', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const items = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) {
    console.error('Admin list announcements error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/announcements
router.post('/api/admin/announcements', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, message, emoji, kind, active, startsAt, expiresAt } = req.body || {};
    if (!title || !message) return res.status(400).json({ error: 'Titre et message requis.' });
    const item = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        message: String(message).trim(),
        emoji: emoji || '📢',
        kind: ['info', 'warning', 'success', 'promo'].includes(kind) ? kind : 'info',
        active: active !== false,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    res.json(item);
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/announcements/:id
router.put('/api/admin/announcements/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = req.body || {};
    const data: Record<string, any> = {};
    for (const k of ['title', 'message', 'emoji', 'kind', 'active']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const item = await prisma.announcement.update({ where: { id }, data });
    res.json(item);
  } catch (err: any) {
    console.error('Update announcement error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Annonce introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/api/admin/announcements/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete announcement error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Annonce introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* ------------------------------------------------------------------ */
/* Admin — Hot deals / featured                                        */
/* ------------------------------------------------------------------ */

// GET /api/admin/hot-deals
router.get('/api/admin/hot-deals', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const items = await prisma.hotDeal.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    res.json(items);
  } catch (err) {
    console.error('Admin list hot deals error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/hot-deals
router.post('/api/admin/hot-deals', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, emoji, badge, price, link, active, sortOrder } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Titre requis.' });
    const item = await prisma.hotDeal.create({
      data: {
        title: String(title).trim(),
        description: description || null,
        emoji: emoji || '🔥',
        badge: badge || null,
        price: price || null,
        link: link || null,
        active: active !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });
    res.json(item);
  } catch (err) {
    console.error('Create hot deal error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/hot-deals/:id
router.put('/api/admin/hot-deals/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = req.body || {};
    const data: Record<string, any> = {};
    for (const k of ['title', 'description', 'emoji', 'badge', 'price', 'link', 'active', 'sortOrder']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    const item = await prisma.hotDeal.update({ where: { id }, data });
    res.json(item);
  } catch (err: any) {
    console.error('Update hot deal error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Offre introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/hot-deals/:id
router.delete('/api/admin/hot-deals/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.hotDeal.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete hot deal error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Offre introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

/* Admin — Video Guides                                                 */

// GET /api/admin/guides
router.get('/api/admin/guides', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const items = await prisma.guide.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(items);
  } catch (err) {
    console.error('Admin list guides error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/guides
router.post('/api/admin/guides', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, youtubeUrl, description, active, sortOrder } = req.body || {};
    if (!title || !youtubeUrl) return res.status(400).json({ error: 'Titre et lien YouTube requis.' });
    const item = await prisma.guide.create({
      data: {
        title: String(title).trim(),
        youtubeUrl: String(youtubeUrl).trim(),
        description: description ? String(description).trim() : null,
        active: active !== false,
        sortOrder: Number(sortOrder) || 0,
      },
    });
    res.json(item);
  } catch (err) {
    console.error('Create guide error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/guides/:id
router.put('/api/admin/guides/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = String(req.params.id);
    const body = req.body || {};
    const data: Record<string, any> = {};
    for (const k of ['title', 'youtubeUrl', 'description', 'active', 'sortOrder']) {
      if (body[k] !== undefined) data[k] = body[k];
    }
    const item = await prisma.guide.update({ where: { id }, data });
    res.json(item);
  } catch (err: any) {
    console.error('Update guide error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Guide introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/admin/guides/:id
router.delete('/api/admin/guides/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.guide.delete({ where: { id: String(req.params.id) } });
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete guide error:', err);
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Guide introuvable.' });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
