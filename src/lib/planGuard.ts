/**
 * Server-side paywall. The browser already hides paid tools from people without a plan, but that is only
 * cosmetic: this guard is what actually refuses the request, so the rule cannot be bypassed by calling the API.
 */
import type { NextFunction, Request, Response } from "express";
import { canUsePaidTools, type PlanFields } from "./access";
import type { SessionPayload } from "./session";

// Same wording as the lock screen, so one translation serves both.
export const PLAN_REQUIRED_MESSAGE = "Cet outil nécessite un plan actif. Abonne-toi pour débloquer tous les outils IA.";

type AccountLoader = (userId: string) => Promise<PlanFields | null>;

/** Builds a middleware that lets admins and users with a live plan through. Must run after `requireAuth`. */
export function createPaidAccessGuard(loadAccount: AccountLoader) {
  return async function requirePaidAccess(req: Request, res: Response, next: NextFunction) {
    const session = req.user as SessionPayload | undefined;
    if (!session) return res.status(401).json({ error: "Authentification requise." });
    try {
      const account = await loadAccount(session.sub);
      if (!canUsePaidTools(account)) {
        return res.status(403).json({ error: PLAN_REQUIRED_MESSAGE, code: "PLAN_REQUIRED" });
      }
      next();
    } catch (err) {
      console.error("Paid access check failed:", err);
      res.status(500).json({ error: "Erreur serveur." });
    }
  };
}
