import { MAX_PRODUCT_PHOTOS } from '../../lib/projectRules';

/** Photos dropped on the dashboard, handed to the new-campaign screen (kept in memory only, never stored). */
let pending: File[] = [];

export function setPendingPhotos(files: File[]) {
  pending = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type)).slice(0, MAX_PRODUCT_PHOTOS);
}

/** Returns the photos once, then forgets them. */
export function takePendingPhotos(): File[] {
  const files = pending;
  pending = [];
  return files;
}
