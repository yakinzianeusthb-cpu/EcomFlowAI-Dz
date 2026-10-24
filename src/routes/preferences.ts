import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { SessionPayload } from "../lib/session";
import { requireAuth } from "../lib/requireAuth";
import { parsePreferencesUpdate } from "../lib/preferencesRules";

const router = Router();

const DEFAULT_WIDGETS = ["featured", "stats", "geo", "prediction", "history"];

// GET /api/preferences — the user's UI preferences (created on first access).
router.get("/api/preferences", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: user.sub },
    });
    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: {
          userId: user.sub,
          toolsOrder: [],
          dashboardConfig: {},
          dashboardWidgetOrder: DEFAULT_WIDGETS,
          language: "fr",
          theme: "dark",
        },
      });
    }
    res.json(prefs);
  } catch (err) {
    console.error("Get preferences error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/preferences — partial update / upsert of the user's preferences (fields checked in preferencesRules.ts).
router.put("/api/preferences", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const parsed = parsePreferencesUpdate(req.body);
  if ("error" in parsed) return res.status(parsed.status).json({ error: parsed.error });
  const { lastImage, lastScript, dashboardConfig, ...rest } = parsed.data;
  // a JSON column is cleared with DbNull, not a plain null
  const data: Omit<Prisma.UserPreferencesUncheckedCreateInput, "userId"> = {
    ...rest,
    ...(dashboardConfig !== undefined && { dashboardConfig: dashboardConfig as Prisma.InputJsonObject }),
    ...(lastImage !== undefined && { lastImage: lastImage === null ? Prisma.DbNull : (lastImage as Prisma.InputJsonObject) }),
    ...(lastScript !== undefined && { lastScript: lastScript === null ? Prisma.DbNull : (lastScript as Prisma.InputJsonObject) }),
  };

  try {
    if (Object.keys(data).length === 0) {
      // Nothing to update — return the current preferences (or create defaults).
      const existing = await prisma.userPreferences.findUnique({
        where: { userId: user.sub },
      });
      if (existing) return res.json(existing);
      const created = await prisma.userPreferences.create({
        data: { userId: user.sub },
      });
      return res.json(created);
    }

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: user.sub },
      create: { userId: user.sub, ...data },
      update: data,
    });
    res.json(prefs);
  } catch (err) {
    console.error("Save preferences error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export const preferencesRouter = router;
