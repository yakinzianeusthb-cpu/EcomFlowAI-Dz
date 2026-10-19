import express, { Router } from "express";
import { prisma } from "../lib/prisma";
import { encryptSecret, maskSecret } from "../lib/crypto";
import { requireAuth, SessionPayload } from "../lib/session";
import {
  buildSettingsWrite,
  DEFAULT_WORKSPACE_NAME,
  SECRET_FIELDS,
  SettingsValidationError,
} from "../lib/settingsWrite";

const router = Router();

const DEFAULT_SETTINGS = {
  facebookAdsToken: "",
  facebookAccountId: "",
  tiktokAdsToken: "",
  tiktokAccountId: "",
  googleAdsCustomerId: "",
  googleAdsDeveloperToken: "",
  snapAdsToken: "",
  snapAccountId: "",
  geminiApiKey: "",
  workspaceName: DEFAULT_WORKSPACE_NAME,
  customApiToken: "",
};

/** Masks every secret field so raw tokens never reach the browser. */
function toMasked<T extends Record<string, any>>(settings: T) {
  const out: Record<string, any> = { ...settings };
  for (const f of SECRET_FIELDS) {
    out[f] = maskSecret(settings[f]) ?? "";
  }
  return out;
}

// GET /api/settings — the user's ad-platform settings (secrets masked).
router.get("/api/settings", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const settings = await prisma.apiSettings.findUnique({
    where: { userId: user.sub },
  });
  if (!settings) {
    return res.json({ userId: user.sub, ...DEFAULT_SETTINGS });
  }
  res.json(toMasked(settings));
});

// PUT /api/settings — upsert the user's settings (userId is the unique key).
// Secret fields are encrypted before storage; an empty/absent value preserves
// the existing secret instead of overwriting it with a blank, and a field that
// is not in the request is left untouched (see lib/settingsWrite.ts).
router.put("/api/settings", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    const existing = await prisma.apiSettings.findUnique({
      where: { userId: user.sub },
    });
    const { createData, updateData } = buildSettingsWrite({
      userId: user.sub,
      body: req.body || {},
      existing: existing as Record<string, unknown> | null,
      encrypt: encryptSecret,
    });
    const settings = await prisma.apiSettings.upsert({
      where: { userId: user.sub },
      create: createData as any,
      update: updateData as any,
    });
    res.json(toMasked(settings));
  } catch (err) {
    if (err instanceof SettingsValidationError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Save settings error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export const settingsRouter = router;
