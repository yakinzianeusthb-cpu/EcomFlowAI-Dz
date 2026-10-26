/** Small pieces shared by the campaign, file and Meta routes. */
import type { SessionPayload } from "./session";

/** Record ids are UUIDs: anything else is answered as "not found" without asking the database. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rate limits count per signed-in account (per address before sign-in). */
export const accountKey = (req: { user?: unknown; ip?: string }): string => (req.user as SessionPayload | undefined)?.sub ?? req.ip ?? "anon";

/** The file fields sent to the browser: everything except the bytes. */
export const ASSET_META = { id: true, kind: true, name: true, mimeType: true, size: true, width: true, height: true, createdAt: true, projectId: true } as const;

export const SERVER_ERROR = "Erreur serveur.";
