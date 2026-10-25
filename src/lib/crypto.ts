/**
 * Encrypt/decrypt secret values at rest (AES-256-GCM).
 *
 * Blob format: `enc:v1:<iv(b64)>:<authTag(b64)>:<ciphertext(b64)>`
 * The key is derived from TOKEN_ENCRYPTION_KEY (falling back to
 * SESSION_SECRET) so no extra deployment env is strictly required.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const KEY_LEN = 32;
const KEY_SALT = "dzads-token-encryption-salt";

function deriveKey(raw: string): Buffer {
  return scryptSync(raw, KEY_SALT, KEY_LEN);
}

const ENCRYPTION_KEY = (() => {
  const raw = process.env.TOKEN_ENCRYPTION_KEY || process.env.SESSION_SECRET || "";
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY (or SESSION_SECRET) must be set in production",
      );
    }
    return deriveKey("dzads-dev-encryption-key");
  }
  return deriveKey(raw);
})();

export function encryptSecret(value: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptSecret(blob: string): string {
  const parts = blob.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") {
    throw new Error("Unknown secret format");
  }
  const iv = Buffer.from(parts[2], "base64");
  const tag = Buffer.from(parts[3], "base64");
  const ciphertext = Buffer.from(parts[4], "base64");
  const decipher = createDecipheriv(ALGO, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

/** True when the value is a valid encrypted blob. */
export function isEncryptedSecret(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("enc:v1:");
}

/**
 * Display-safe mask for a secret. Returns null when unset. Does NOT
 * decrypt — only ever shows a prefix + suffix of the raw value.
 */
export function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 3)}••••••••${value.slice(-3)}`;
}

/** A stored secret, decrypted (null when missing or unreadable). Used on the server only. */
export function revealSecret(blob: string | null | undefined): string | null {
  if (!blob || !isEncryptedSecret(blob)) return null;
  try {
    return decryptSecret(blob);
  } catch {
    return null;
  }
}
