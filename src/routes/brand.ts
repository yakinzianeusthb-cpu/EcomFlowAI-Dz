import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, SessionPayload } from "../lib/session";
import { BRAND_ERRORS, parseBrandKitInput } from "../lib/brandRules";

/** The brand kit: one per account, reused as context by every generation. */
const router = Router();

const EMPTY_KIT = { brandName: "", logoAssetId: null, colors: [], headingFont: "", bodyFont: "", tone: "", audience: "", instructions: "", styles: [] };

// GET /api/brand-kit — the saved kit, or an empty one.
router.get("/api/brand-kit", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    const kit = await prisma.brandKit.findUnique({ where: { userId: user.sub } });
    res.json(kit ?? EMPTY_KIT);
  } catch (err) {
    console.error("Get brand kit error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/brand-kit — save the fields that are sent. A logo must be one of the user's own images.
router.put("/api/brand-kit", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const parsed = parseBrandKitInput(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    if (parsed.data.logoAssetId) {
      const logo = await prisma.asset.findFirst({ where: { id: parsed.data.logoAssetId, userId: user.sub }, select: { id: true } });
      if (!logo) return res.status(400).json({ error: BRAND_ERRORS.logo });
    }
    const kit = await prisma.brandKit.upsert({
      where: { userId: user.sub },
      create: { ...parsed.data, userId: user.sub },
      update: parsed.data,
    });
    res.json(kit);
  } catch (err) {
    console.error("Save brand kit error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export const brandRouter = router;
