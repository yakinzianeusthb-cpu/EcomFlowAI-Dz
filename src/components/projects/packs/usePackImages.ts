import { useEffect, useState } from 'react';

export interface PackPicture {
  /** path inside the zip, e.g. "carousel/lampe-01.jpg" */
  name: string;
  blob: Blob;
  width: number;
  height: number;
}

export interface PackImage extends PackPicture {
  /** a preview address for the page (revoked when the pictures change) */
  url: string;
}

/**
 * Draws a pack's pictures once, and again only when `key` changes (`make` is rebuilt on every render, the key says
 * when its result would differ). `make` null means there is nothing to draw yet (the photos are still loading).
 */
export function usePackImages(make: (() => Promise<PackPicture[]>) | null, key: string): { images: PackImage[] | null; failed: boolean } {
  const [state, setState] = useState<{ images: PackImage[] | null; failed: boolean }>({ images: null, failed: false });
  const ready = make !== null;
  useEffect(() => {
    if (!make) {
      setState({ images: null, failed: false });
      return;
    }
    let alive = true;
    let made: PackImage[] = [];
    setState({ images: null, failed: false });
    make()
      .then((pictures) => {
        made = pictures.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }));
        if (alive) setState({ images: made, failed: false });
        else made.forEach((img) => URL.revokeObjectURL(img.url));
      })
      .catch(() => alive && setState({ images: [], failed: true }));
    return () => {
      alive = false;
      made.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, [key, ready]); // not `make`: it is a new function on every render; the key and readiness say when to draw again
  return state;
}
