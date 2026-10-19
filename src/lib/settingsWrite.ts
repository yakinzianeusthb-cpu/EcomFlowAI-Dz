/**
 * Builds the database write for PUT /api/settings. Kept free of Express and Prisma so it can be unit tested.
 *
 * Rules:
 *  - a field that is not in the request is left as it is (a partial update never nulls anything);
 *  - a secret that arrives blank keeps the stored value;
 *  - an account id may be cleared with an empty string;
 *  - the workspace name can never be empty (it falls back to the default);
 *  - over-long values are refused instead of being stored.
 */

export const DEFAULT_WORKSPACE_NAME = "E-com DZ Workspace";

/** Fields that hold secrets: encrypted at rest and never returned in full. */
export const SECRET_FIELDS = [
  "facebookAdsToken",
  "tiktokAdsToken",
  "googleAdsDeveloperToken",
  "snapAdsToken",
  "geminiApiKey",
  "customApiToken",
] as const;

/** Non-secret identifier fields. */
export const IDENTIFIER_FIELDS = [
  "facebookAccountId",
  "tiktokAccountId",
  "googleAdsCustomerId",
  "snapAccountId",
  "workspaceName",
] as const;

const MAX_SECRET_LENGTH = 2048;
const MAX_IDENTIFIER_LENGTH = 200;

export class SettingsValidationError extends Error {}

interface BuildArgs {
  userId: string;
  body: Record<string, unknown>;
  existing: Record<string, unknown> | null;
  encrypt: (plain: string) => string;
}

export function buildSettingsWrite({ userId, body, existing, encrypt }: BuildArgs) {
  const createData: Record<string, unknown> = { userId };
  const updateData: Record<string, unknown> = {};

  for (const field of SECRET_FIELDS) {
    const value = body[field];
    if (value != null && value !== "") {
      const text = String(value);
      if (text.length > MAX_SECRET_LENGTH) throw new SettingsValidationError("Valeur trop longue.");
      const encrypted = encrypt(text);
      createData[field] = encrypted;
      updateData[field] = encrypted;
    } else if (existing?.[field]) {
      // A blank means "unchanged": keep the stored secret.
      updateData[field] = existing[field];
    }
  }

  for (const field of IDENTIFIER_FIELDS) {
    if (body[field] === undefined) continue;
    const text = body[field] == null ? "" : String(body[field]).trim();
    if (text.length > MAX_IDENTIFIER_LENGTH) throw new SettingsValidationError("Valeur trop longue.");
    const stored = field === "workspaceName" ? text || DEFAULT_WORKSPACE_NAME : text || null;
    createData[field] = stored;
    updateData[field] = stored;
  }

  if (createData.workspaceName === undefined) createData.workspaceName = DEFAULT_WORKSPACE_NAME;
  return { createData, updateData };
}
