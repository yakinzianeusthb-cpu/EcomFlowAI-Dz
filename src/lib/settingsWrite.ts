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

import { isCloudflareAccountId, isImageProvider } from "./imageProviders";
import { TEXT_ENGINE_ERRORS, isModelId, isTextProvider } from "./textEngines";
import { isVoiceId, isVoiceProvider } from "./voiceProviders";

export const DEFAULT_WORKSPACE_NAME = "E-com DZ Workspace";

/** Fields that hold secrets: encrypted at rest and never returned in full. */
export const SECRET_FIELDS = [
  "facebookAdsToken",
  "tiktokAdsToken",
  "googleAdsDeveloperToken",
  "snapAdsToken",
  "geminiApiKey",
  "customApiToken",
  "openaiApiKey",
  "falApiKey",
  "cloudflareApiToken",
  "anthropicApiKey",
  "mistralApiKey",
  "deepseekApiKey",
  "xaiApiKey",
  "openrouterApiKey",
  "pollinationsApiKey",
  "elevenlabsApiKey",
] as const;

/** Non-secret identifier fields. */
export const IDENTIFIER_FIELDS = [
  "facebookAccountId",
  "tiktokAccountId",
  "googleAdsCustomerId",
  "snapAccountId",
  "workspaceName",
  "cloudflareAccountId",
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
    // it goes into the address of Cloudflare's API: its own format only
    if (field === "cloudflareAccountId" && text && !isCloudflareAccountId(text)) {
      throw new SettingsValidationError("Identifiant de compte Cloudflare invalide (32 caractères 0-9 et a-f).");
    }
    const stored = field === "workspaceName" ? text || DEFAULT_WORKSPACE_NAME : text || null;
    createData[field] = stored;
    updateData[field] = stored;
  }

  if (body.imageProvider !== undefined) {
    if (!isImageProvider(body.imageProvider)) throw new SettingsValidationError("Service d'images inconnu.");
    createData.imageProvider = body.imageProvider;
    updateData.imageProvider = body.imageProvider;
  }

  if (body.textProvider !== undefined) {
    if (!isTextProvider(body.textProvider)) throw new SettingsValidationError(TEXT_ENGINE_ERRORS.provider);
    createData.textProvider = body.textProvider;
    updateData.textProvider = body.textProvider;
  }

  // the model chosen for the text engine; empty means the engine's default
  if (body.textModel !== undefined) {
    const model = body.textModel == null ? "" : String(body.textModel).trim();
    if (model && !isModelId(model)) throw new SettingsValidationError(TEXT_ENGINE_ERRORS.modelId);
    createData.textModel = model || null;
    updateData.textModel = model || null;
  }

  if (body.voiceProvider !== undefined) {
    if (!isVoiceProvider(body.voiceProvider)) throw new SettingsValidationError("Service de voix inconnu.");
    createData.voiceProvider = body.voiceProvider;
    updateData.voiceProvider = body.voiceProvider;
  }

  // the voice chosen for the voice-over; empty means the service's first voice
  if (body.voiceId !== undefined) {
    const voice = body.voiceId == null ? "" : String(body.voiceId).trim();
    if (voice && !isVoiceId(voice)) throw new SettingsValidationError("Identifiant de voix invalide.");
    createData.voiceId = voice || null;
    updateData.voiceId = voice || null;
  }

  if (createData.workspaceName === undefined) createData.workspaceName = DEFAULT_WORKSPACE_NAME;
  return { createData, updateData };
}
