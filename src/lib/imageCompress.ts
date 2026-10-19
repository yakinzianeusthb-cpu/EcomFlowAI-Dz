/**
 * Shrinks photos in the browser before they are uploaded.
 *
 * Phone photos are 3-8 MB, and base64 in a JSON body adds a third on top. Vercel rejects request
 * bodies above ~4.5 MB, so without this a normal photo fails with an unhelpful error in production
 * (it works locally, which hides the problem). A 1600px JPEG is plenty for payment proofs and for
 * the AI tools, and it is also much faster to send.
 */

export const DEFAULT_MAX_DIMENSION = 1600;
export const DEFAULT_QUALITY = 0.82;
/** Images at or below this size are sent as they are. */
const SKIP_BELOW_BYTES = 350 * 1024;

/** Scales (width, height) so the longest side is at most `maxDimension`. Never enlarges. */
export function fitWithin(width: number, height: number, maxDimension: number): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width, height };
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Only raster photos that are big enough to matter are re-encoded; GIFs, SVGs and PDFs are left alone. */
export function shouldCompress(file: { type: string; size: number }): boolean {
  if (!/^image\/(jpeg|png|webp|bmp|heic|heif)$/i.test(file.type)) return false;
  return file.size > SKIP_BELOW_BYTES;
}

const readAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(blob);
  });

/**
 * Returns the file as a data URL, re-encoded as a smaller JPEG when it is a large photo.
 * If the browser cannot decode the image, the original file is returned unchanged.
 */
export async function fileToUploadDataUrl(
  file: File,
  { maxDimension = DEFAULT_MAX_DIMENSION, quality = DEFAULT_QUALITY }: { maxDimension?: number; quality?: number } = {},
): Promise<string> {
  if (!shouldCompress(file)) return readAsDataUrl(file);
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return readAsDataUrl(file);
    // JPEG has no transparency: paint white first so transparent PNGs do not turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    // Keep whichever is smaller, so compression can never make a file bigger.
    return readAsDataUrl(blob && blob.size < file.size ? blob : file);
  } catch {
    return readAsDataUrl(file);
  }
}
