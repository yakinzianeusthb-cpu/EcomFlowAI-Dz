/**
 * The posters of a long-image page joined into one tall JPEG, the "long image" sellers put in their shop's product
 * description (YouCan, Shopify...). `stackLayout` does the arithmetic (pure); `stackImages` draws, in the browser.
 */

export interface StackLayout {
  width: number;
  height: number;
  rows: { y: number; height: number }[];
}

/**
 * Where each image goes when they are stacked at `width` pixels, each keeping its shape; everything shrinks when the
 * strip would be taller than `maxHeight` (browsers refuse canvases past roughly 32 000 px).
 */
export function stackLayout(sizes: { width: number; height: number }[], width: number, maxHeight: number): StackLayout {
  const natural = sizes.map((s) => (s.width > 0 ? (s.height * width) / s.width : 0));
  const total = natural.reduce((sum, h) => sum + h, 0);
  const scale = total > maxHeight ? maxHeight / total : 1;
  const finalWidth = Math.round(width * scale);
  let y = 0;
  const rows = natural.map((h) => {
    const row = { y, height: Math.round(h * scale) };
    y += row.height;
    return row;
  });
  return { width: finalWidth, height: y, rows };
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image could not be loaded'));
    img.src = src;
  });

/** The images (data URLs) one under the other in a single JPEG. Browser only. */
export async function stackImages(sources: string[], width = 1080): Promise<Blob> {
  const images = await Promise.all(sources.map(loadImage));
  const layout = stackLayout(images.map((img) => ({ width: img.naturalWidth, height: img.naturalHeight })), width, 30000);
  const canvas = document.createElement('canvas');
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2D context unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, layout.width, layout.height);
  images.forEach((img, i) => ctx.drawImage(img, 0, layout.rows[i].y, layout.width, layout.rows[i].height));
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('the image could not be made'))), 'image/jpeg', 0.9));
}
