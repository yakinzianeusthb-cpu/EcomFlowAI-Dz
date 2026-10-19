/**
 * What may be stored in the asset library: images only, identified by their bytes (a file's label is never
 * trusted), within a size and storage quota. Server-side only (uses Buffer).
 */

export const ASSET_KINDS = ['product', 'logo', 'creative', 'ai_image', 'other'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const MAX_ASSET_BYTES = 3 * 1024 * 1024;
/** Total image storage per account, with and without an active plan. */
export const STORAGE_BYTES = { paid: 250 * 1024 * 1024, free: 25 * 1024 * 1024 } as const;
export const MAX_STORAGE_BYTES = STORAGE_BYTES.paid;
export const MAX_ASSETS_PER_PROJECT = 80;

export const ASSET_ERRORS = {
  kind: 'Catégorie de fichier invalide.',
  type: 'Seules les images JPG, PNG et WebP sont acceptées.',
  tooBig: 'Image trop lourde (3 Mo maximum).',
  project: 'Projet introuvable.',
  quota: 'Espace de stockage plein. Supprime des fichiers dans la bibliothèque.',
  projectFull: 'Ce projet contient déjà le nombre maximum de fichiers.',
  notFound: 'Fichier introuvable.',
} as const;

export type ImageMime = 'image/png' | 'image/jpeg' | 'image/webp';

/** The real type of an image from its first bytes; null for anything that is not PNG, JPEG or WebP. */
export function sniffImageType(bytes: Uint8Array): ImageMime | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

/** A file name safe to show and to put in a download header: no path, quotes, control or reserved characters. */
export function safeFileName(name: unknown): string {
  const base = String(name ?? '').split(/[\\/]/).pop() ?? '';
  const clean = base.replace(/[\u0000-\u001f\u007f"'`:*?<>|]/g, '').replace(/\s+/g, ' ').trim();
  return (clean || 'file').slice(0, 120);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA_URL = /^data:[\w/+.-]+;base64,([A-Za-z0-9+/=\s]+)$/;
const dimension = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 20000 ? v : null);

export interface AssetInput {
  kind: AssetKind;
  name: string;
  projectId: string | null;
  mimeType: ImageMime;
  bytes: Buffer;
  width: number | null;
  height: number | null;
}

export function parseAssetInput(body: unknown): AssetInput | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (typeof b.kind !== 'string' || !(ASSET_KINDS as readonly string[]).includes(b.kind)) return { error: ASSET_ERRORS.kind };
  if (b.projectId != null && (typeof b.projectId !== 'string' || !UUID.test(b.projectId))) return { error: ASSET_ERRORS.project };

  const match = typeof b.dataUrl === 'string' ? DATA_URL.exec(b.dataUrl) : null;
  if (!match) return { error: ASSET_ERRORS.type };
  // reject before decoding anything far too large
  if (Math.floor((match[1].length * 3) / 4) > MAX_ASSET_BYTES + 4) return { error: ASSET_ERRORS.tooBig };
  const bytes = Buffer.from(match[1], 'base64');
  if (bytes.length > MAX_ASSET_BYTES) return { error: ASSET_ERRORS.tooBig };
  const mimeType = sniffImageType(bytes);
  if (!mimeType) return { error: ASSET_ERRORS.type };

  return {
    kind: b.kind as AssetKind,
    name: safeFileName(b.name),
    projectId: (b.projectId as string | undefined) ?? null,
    mimeType,
    bytes,
    width: dimension(b.width),
    height: dimension(b.height),
  };
}
