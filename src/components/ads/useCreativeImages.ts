import { useEffect, useState } from 'react';
import { loadImage } from '../../lib/adCreativeRender';
import { assetUrl } from '../../services/campaigns';

export interface CreativeImages {
  photos: HTMLImageElement[];
  logo: HTMLImageElement | null;
}

/** The campaign photos (up to 6) and the brand logo, decoded once for drawing ad visuals. */
export function useCreativeImages(photoIds: string[], logoAssetId: string | null | undefined): CreativeImages | null {
  const [images, setImages] = useState<CreativeImages | null>(null);
  const key = photoIds.slice(0, 6).join(',');
  useEffect(() => {
    let alive = true;
    const ids = key ? key.split(',') : [];
    Promise.all([
      Promise.all(ids.map((id) => loadImage(assetUrl(id)).catch(() => null))),
      logoAssetId ? loadImage(assetUrl(logoAssetId)).catch(() => null) : Promise.resolve(null),
    ]).then(([photos, logo]) => {
      if (alive) setImages({ photos: photos.filter((x): x is HTMLImageElement => Boolean(x)), logo });
    });
    return () => { alive = false; };
  }, [key, logoAssetId]);
  return images;
}
