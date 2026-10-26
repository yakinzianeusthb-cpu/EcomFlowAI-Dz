import express, { Router } from "express";
import { prisma } from "../lib/prisma";
import { SessionPayload } from "../lib/session";
import { requireAuth } from "../lib/requireAuth";

const router = Router();

// GET /api/catalog — list the current user's products, newest first.
router.get("/api/catalog", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const products = await prisma.productCatalog.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
});

// POST /api/catalog — create a product.
router.post("/api/catalog", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const b = req.body || {};
  if (!b.name || !b.category) {
    return res.status(400).json({ error: "name et category sont requis." });
  }
  const product = await prisma.productCatalog.create({
    data: {
      userId: user.sub,
      name: b.name,
      category: b.category,
      purchasePrice: b.purchasePrice,
      sellingPrice: b.sellingPrice,
      targetCpa: b.targetCpa,
      stock: b.stock ?? 0,
      status: b.status ?? null,
      imageUrl: b.imageUrl,
      countries: b.countries ?? "DZ",
      description: b.description,
      euroRate: b.euroRate ?? 220,
      confRate: b.confRate ?? 0.8,
      delivRate: b.delivRate ?? 0.6,
      sales: b.sales ?? 0,
    },
  });
  res.json(product);
});

// PUT /api/catalog/:id — update a product owned by the current user.
router.put("/api/catalog/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const existing = await prisma.productCatalog.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.sub) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  const b = req.body || {};
  const data: any = {};
  if (b.name !== undefined) data.name = b.name;
  if (b.category !== undefined) data.category = b.category;
  if (b.purchasePrice !== undefined) data.purchasePrice = b.purchasePrice;
  if (b.sellingPrice !== undefined) data.sellingPrice = b.sellingPrice;
  if (b.targetCpa !== undefined) data.targetCpa = b.targetCpa;
  if (b.stock !== undefined) data.stock = b.stock;
  if (b.status !== undefined) data.status = b.status;
  if (b.imageUrl !== undefined) data.imageUrl = b.imageUrl;
  if (b.countries !== undefined) data.countries = b.countries;
  if (b.description !== undefined) data.description = b.description;
  if (b.euroRate !== undefined) data.euroRate = b.euroRate;
  if (b.confRate !== undefined) data.confRate = b.confRate;
  if (b.delivRate !== undefined) data.delivRate = b.delivRate;
  if (b.sales !== undefined) data.sales = b.sales;
  const product = await prisma.productCatalog.update({ where: { id }, data });
  res.json(product);
});

// DELETE /api/catalog/:id — delete a product owned by the current user.
router.delete("/api/catalog/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const existing = await prisma.productCatalog.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.sub) {
    return res.status(404).json({ error: "Produit introuvable." });
  }
  await prisma.productCatalog.delete({ where: { id } });
  res.json({ ok: true });
});

// GET /api/catalog/stats — product count + stock-alert count.
router.get("/api/catalog/stats", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const count = await prisma.productCatalog.count({
    where: { userId: user.sub },
  });
  const stockAlertCount = await prisma.productCatalog.count({
    where: {
      userId: user.sub,
      OR: [
        { stock: { lte: 5 } },
        { status: { in: ["low_stock", "out_of_stock"] } },
      ],
    },
  });
  res.json({ count, stockAlertCount });
});

export const catalogRouter = router;
