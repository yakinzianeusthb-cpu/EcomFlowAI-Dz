import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../lib/requireAuth";

const router = Router();

// GET /api/dashboard/summary — aggregated KPIs from product catalog
router.get("/api/dashboard/summary", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;

    // Get all products for this user
    const products = await prisma.productCatalog.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        category: true,
        purchasePrice: true,
        sellingPrice: true,
        stock: true,
        sales: true,
        status: true,
        confRate: true,
        delivRate: true,
        targetCpa: true,
        euroRate: true,
      },
    });

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active' || !p.status).length;
    const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
    const stockAlertCount = products.filter(p => (p.stock || 0) <= 5 || p.status === 'low_stock' || p.status === 'out_of_stock').length;

    // Calculate estimated revenue (from sales × selling price)
    const estimatedRevenue = products.reduce((sum, p) => {
      const sales = p.sales || 0;
      const price = Number(p.sellingPrice) || 0;
      return sum + (sales * price);
    }, 0);

    // Calculate estimated delivered revenue (accounting for delivery rate)
    const estimatedDeliveredRevenue = products.reduce((sum, p) => {
      const sales = p.sales || 0;
      const price = Number(p.sellingPrice) || 0;
      const delivRate = Number(p.delivRate) || 0.6;
      return sum + (sales * price * delivRate);
    }, 0);

    // Average confirmation rate (weighted by sales)
    const totalConfWeight = products.reduce((sum, p) => sum + (p.sales || 0), 0);
    const avgConfRate = totalConfWeight > 0
      ? products.reduce((sum, p) => sum + (Number(p.confRate) || 0.8) * (p.sales || 0), 0) / totalConfWeight
      : 0.8;

    // Average delivery rate (weighted by sales)
    const avgDelivRate = totalConfWeight > 0
      ? products.reduce((sum, p) => sum + (Number(p.delivRate) || 0.6) * (p.sales || 0), 0) / totalConfWeight
      : 0.6;

    // Top products by sales
    const topProducts = [...products]
      .sort((a, b) => (b.sales || 0) - (a.sales || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        sales: p.sales || 0,
        sellingPrice: Number(p.sellingPrice) || 0,
        stock: p.stock || 0,
        estimatedRevenue: (p.sales || 0) * (Number(p.sellingPrice) || 0),
      }));

    // Sales by category
    const categoryMap = new Map<string, { count: number; sales: number; revenue: number }>();
    for (const p of products) {
      const cat = p.category || 'Autre';
      const existing = categoryMap.get(cat) || { count: 0, sales: 0, revenue: 0 };
      existing.count++;
      existing.sales += p.sales || 0;
      existing.revenue += (p.sales || 0) * (Number(p.sellingPrice) || 0);
      categoryMap.set(cat, existing);
    }
    const salesByCategory = [...categoryMap.entries()]
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.sales - a.sales);

    // Low stock products
    const lowStockProducts = products
      .filter(p => (p.stock || 0) <= 5)
      .map(p => ({ id: p.id, name: p.name, stock: p.stock || 0, category: p.category }));

    res.json({
      totalProducts,
      activeProducts,
      totalSales,
      stockAlertCount,
      estimatedRevenue,
      estimatedDeliveredRevenue,
      avgConfRate,
      avgDelivRate,
      topProducts,
      salesByCategory,
      lowStockProducts,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/dashboard/ai-usage — real usage counts for the 4 sidebar AI tools
// (video scripts, landing pages, assembled LP sessions, total generations).
router.get("/api/dashboard/ai-usage", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const [videoScripts, landingPages, lpSessions, totalGenerations] = await Promise.all([
      prisma.generationHistory.count({ where: { userId, type: "script" } }),
      prisma.generationHistory.count({ where: { userId, type: "landing_page" } }),
      prisma.lpSession.count({ where: { userId } }),
      prisma.generationHistory.count({ where: { userId } }),
    ]);
    res.json({ videoScripts, landingPages, lpSessions, totalGenerations });
  } catch (err) {
    console.error("AI usage summary error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
