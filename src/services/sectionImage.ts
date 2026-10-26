/**
 * One AI picture for a landing-page section, made from the seller's product photo on the image service chosen in
 * Paramètres. Used by the structure editor (one section at a time) and by the page publisher (one or all sections).
 */
import { fileToUploadDataUrl } from '../lib/imageCompress';
import { CLOUDFLARE_REFERENCE_MAX, type AspectRatio, type ImageProvider } from '../lib/imageProviders';
import { generateSectionImage } from './gemini';
import { imageFromService } from './imageService';

/** A data URL re-encoded as a JPEG within `maxDimension`; `fit` forces it even for a light picture. */
async function recompress(dataUrl: string, options: { maxDimension: number; quality: number; fit?: boolean }): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  return fileToUploadDataUrl(new File([blob], 'section.png', { type: blob.type || 'image/png' }), options);
}

/** AI images come back as large PNGs; a 1080 px JPEG keeps the page light on phones. */
const compressDataUrl = (dataUrl: string) => recompress(dataUrl, { maxDimension: 1080, quality: 0.82 });

/** Cloudflare's FLUX.2 only takes photos under 512 px a side. */
const fitForCloudflare = (photo: string) => recompress(photo, { maxDimension: CLOUDFLARE_REFERENCE_MAX, quality: 0.9, fit: true });

/**
 * Draws `prompt` around the product in `photo`, on `provider` (one that keeps the product: see KEEPS_PRODUCT), and
 * returns it as a compressed data URL. A refusal is thrown with its status, like the other AI calls.
 */
export async function drawSectionImage(provider: ImageProvider, prompt: string, photo: string, aspectRatio?: AspectRatio): Promise<string> {
  const raw = provider === 'gemini'
    ? await generateSectionImage(prompt, photo, aspectRatio)
    : await imageFromService({ prompt, reference: provider === 'cloudflare' ? await fitForCloudflare(photo) : photo, aspectRatio: aspectRatio ?? '1:1' });
  return compressDataUrl(raw);
}
