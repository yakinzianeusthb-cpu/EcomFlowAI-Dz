/** The payment proof a seller uploads for a plan or a pack of points: an image or a PDF, as a data URL. */
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB decoded
const PROOF_MIME = /^(image\/(png|jpe?g|webp|gif)|application\/pdf)$/i;

/** French messages (translated on the way out, see src/i18n/serverMessages.ts). */
export const PROOF_ERRORS = {
  invalid: "Preuve invalide.",
  format: "Format de preuve non supporté (image ou PDF).",
  tooBig: "La preuve dépasse 5 Mo.",
} as const;

/** An empty proof passes (the caller decides whether one is required); anything else must be an image or PDF of 5 MB at most. */
export function validateProof(proof: unknown): { ok: true; dataUrl: string } | { ok: false; error: string } {
  if (proof == null || proof === "") return { ok: true, dataUrl: "" };
  if (typeof proof !== "string" || !proof.startsWith("data:")) {
    return { ok: false, error: PROOF_ERRORS.invalid };
  }
  const header = proof.match(/^data:([^;]+);base64,/);
  if (!header || !PROOF_MIME.test(header[1])) {
    return { ok: false, error: PROOF_ERRORS.format };
  }
  const approxBytes = Math.ceil(((proof.length - header[0].length) * 3) / 4);
  if (approxBytes > MAX_PROOF_BYTES) {
    return { ok: false, error: PROOF_ERRORS.tooBig };
  }
  return { ok: true, dataUrl: proof };
}
