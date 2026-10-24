/**
 * Points (see src/lib/credits.ts): a seller's balance and packs, buying a pack with a payment proof, and the admin
 * side: the platform's Gemini key, the prices, approving purchases and granting points by hand.
 */
import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { encryptSecret, maskSecret, decryptSecret, isEncryptedSecret } from '../lib/crypto';
import { requireAuth } from '../lib/requireAuth';
import { requireAdmin } from '../lib/admin';
import { CREDIT_ERRORS, isGrant, parseCreditSettings } from '../lib/credits';
import { accessMode, addCreditsOnce, forgetPlatformCredits, grantCredits, platformCredits, resolveAiAccess } from '../lib/creditStore';
import { validateProof } from '../lib/paymentProof';

const router = Router();

const RECENT_ENTRIES = 15;
const STATS_DAYS = 30;
const DAY_MS = 86_400_000;
const MAX_KEY_LENGTH = 200;
/** Google API keys: letters, digits, "-" and "_" */
const GEMINI_KEY = /^[A-Za-z0-9_-]{20,200}$/;
const KEY_ERROR = 'Clé Gemini invalide.';

const publicPurchase = (p: { id: string; packId: string; points: number; price: number; method: string; status: string; createdAt: Date }) =>
  ({ id: p.id, packId: p.packId, points: p.points, price: p.price, method: p.method, status: p.status, createdAt: p.createdAt });

// GET /api/credits — the seller's balance, how their AI is paid, the prices and packs, a pending purchase and recent changes.
router.get('/api/credits', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const [user, access, platform, pending, entries] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }),
      resolveAiAccess(userId),
      platformCredits(),
      prisma.creditPurchase.findFirst({ where: { userId, status: 'pending' }, orderBy: { createdAt: 'desc' } }),
      prisma.creditEntry.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: RECENT_ENTRIES, select: { delta: true, reason: true, createdAt: true } }),
    ]);
    res.json({
      balance: user?.credits ?? 0,
      mode: accessMode(access),
      // points can be bought only once the admin has set the platform's key
      available: platform.key !== null,
      settings: platform.settings,
      pending: pending ? publicPurchase(pending) : null,
      entries,
    });
  } catch (err) {
    console.error('Credits error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/credits/purchase — a pack paid outside the app, with its proof; an admin approves it.
router.post('/api/credits/purchase', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const { packId, method, proof } = req.body || {};
    const { settings, key } = await platformCredits();
    const pack = settings.packs.find((p) => p.id === packId);
    if (!key || !pack) return res.status(400).json({ error: CREDIT_ERRORS.pack });
    if (typeof method !== 'string' || !method) return res.status(400).json({ error: 'Méthode de paiement requise.' });
    const paymentMethod = await prisma.paymentMethod.findFirst({ where: { code: method, enabled: true }, select: { code: true } });
    if (!paymentMethod) return res.status(400).json({ error: 'Méthode de paiement invalide.' });
    if (proof == null || proof === '') return res.status(400).json({ error: 'Preuve de paiement requise.' });
    const check = validateProof(proof);
    if (!check.ok) return res.status(400).json({ error: (check as { error: string }).error });
    if (await prisma.creditPurchase.findFirst({ where: { userId, status: 'pending' }, select: { id: true } })) {
      return res.status(409).json({ error: CREDIT_ERRORS.pending });
    }
    const purchase = await prisma.creditPurchase.create({
      data: { userId, packId: pack.id, points: pack.points, price: pack.price, method, proof: check.dataUrl },
    });
    res.json({ purchase: publicPurchase(purchase) });
  } catch (err) {
    console.error('Credit purchase error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/admin/credits — the key (masked), prices, purchases waiting for approval and the last 30 days.
router.get('/api/admin/credits', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const since = new Date(Date.now() - STATS_DAYS * DAY_MS);
    const [config, platform, pending, sold, used] = await Promise.all([
      prisma.platformConfig.findUnique({ where: { id: 'singleton' }, select: { platformGeminiKey: true } }),
      platformCredits(),
      prisma.creditPurchase.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        select: { id: true, packId: true, points: true, price: true, method: true, status: true, createdAt: true, user: { select: { email: true, name: true, credits: true } } },
      }),
      prisma.creditPurchase.aggregate({ where: { status: 'approved', decidedAt: { gte: since } }, _sum: { points: true, price: true }, _count: true }),
      prisma.creditEntry.groupBy({ by: ['reason'], where: { createdAt: { gte: since }, reason: { in: ['text', 'image', 'video', 'refund'] } }, _sum: { delta: true } }),
    ]);
    const blob = config?.platformGeminiKey;
    const usedBy = Object.fromEntries(used.map((u) => [u.reason, Math.abs(u._sum.delta ?? 0)]));
    res.json({
      settings: platform.settings,
      key: blob && isEncryptedSecret(blob) ? { set: true, mask: maskSecret(decryptSecret(blob)) } : { set: false, mask: null },
      pending: pending.map((p) => ({ ...publicPurchase(p), user: p.user })),
      stats: {
        days: STATS_DAYS,
        purchases: sold._count,
        pointsSold: sold._sum.points ?? 0,
        revenue: sold._sum.price ?? 0,
        // points spent on the platform's key, refunds taken off
        pointsUsed: Math.max(0, (usedBy.text ?? 0) + (usedBy.image ?? 0) + (usedBy.video ?? 0) - (usedBy.refund ?? 0)),
      },
    });
  } catch (err) {
    console.error('Admin credits error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/admin/credits/settings — prices and packs; `platformKey` sets the key (a string) or removes it (null).
router.put('/api/admin/credits/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const parsed = parseCreditSettings(req.body);
    if (!parsed.ok) return res.status(400).json({ error: (parsed as { error: string }).error });
    const { platformKey } = req.body || {};
    let keyUpdate: { platformGeminiKey?: string | null } = {};
    if (platformKey === null) keyUpdate = { platformGeminiKey: null };
    else if (platformKey !== undefined && platformKey !== '') {
      const text = typeof platformKey === 'string' ? platformKey.trim() : '';
      if (text.length > MAX_KEY_LENGTH || !GEMINI_KEY.test(text)) return res.status(400).json({ error: KEY_ERROR });
      keyUpdate = { platformGeminiKey: encryptSecret(text) };
    }
    const { textCost, imageCost, videoSecondCost, packs } = parsed.settings;
    const data = { creditTextCost: textCost, creditImageCost: imageCost, creditVideoSecondCost: videoSecondCost, creditPacks: packs as unknown as Prisma.InputJsonValue, ...keyUpdate };
    await prisma.platformConfig.upsert({ where: { id: 'singleton' }, update: data, create: { id: 'singleton', ...data } });
    forgetPlatformCredits();
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin credit settings error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/admin/credits/purchases/:id/proof — the proof, loaded only when the admin opens it (it can weigh megabytes).
router.get('/api/admin/credits/purchases/:id/proof', requireAuth, requireAdmin, async (req, res) => {
  const purchase = await prisma.creditPurchase.findUnique({ where: { id: String(req.params.id) }, select: { proof: true } }).catch(() => null);
  if (!purchase) return res.status(404).json({ error: CREDIT_ERRORS.purchase });
  res.json({ proof: purchase.proof });
});

// POST /api/admin/credits/purchases/:id/:decision — approve (the points are added once) or reject.
router.post('/api/admin/credits/purchases/:id/:decision', requireAuth, requireAdmin, async (req, res) => {
  try {
    const decision = req.params.decision;
    if (decision !== 'approve' && decision !== 'reject') return res.status(404).json({ error: CREDIT_ERRORS.purchase });
    const id = String(req.params.id);
    const purchase = await prisma.creditPurchase.findUnique({ where: { id }, select: { userId: true, points: true, status: true } });
    if (!purchase) return res.status(404).json({ error: CREDIT_ERRORS.purchase });
    // only a pending purchase moves, and only once, even if two admins click at the same time
    const moved = await prisma.creditPurchase.updateMany({
      where: { id, status: 'pending' },
      data: { status: decision === 'approve' ? 'approved' : 'rejected', decidedAt: new Date() },
    });
    if (!moved.count) return res.status(409).json({ error: CREDIT_ERRORS.decided });
    const balance = decision === 'approve' ? await addCreditsOnce(purchase.userId, purchase.points, 'purchase', id) : undefined;
    res.json({ ok: true, balance });
  } catch (err) {
    console.error('Admin credit decision error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/admin/credits/grant — add points to an account by hand (negative takes them back, never below zero).
router.post('/api/admin/credits/grant', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { email, points } = req.body || {};
    if (!isGrant(points)) return res.status(400).json({ error: CREDIT_ERRORS.grant });
    const address = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const user = address ? await prisma.user.findUnique({ where: { email: address }, select: { id: true } }) : null;
    if (!user) return res.status(404).json({ error: CREDIT_ERRORS.user });
    res.json({ ok: true, balance: await grantCredits(user.id, points) });
  } catch (err) {
    console.error('Admin credit grant error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export const creditsRouter = router;
