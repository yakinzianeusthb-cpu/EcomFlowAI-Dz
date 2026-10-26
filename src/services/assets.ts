/**
 * Browser client for the file library (see src/routes/assets.ts). Errors keep their HTTP status, so callers can tell
 * "fix your input" from "try again".
 */
import { fileToUploadDataUrl } from '../lib/imageCompress';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } });
  } catch {
    throw new ApiError('', 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(typeof body?.error === 'string' ? body.error : '', res.status);
  return body as T;
}

export interface AssetMeta {
  id: string;
  kind: 'product' | 'logo' | 'creative' | 'ai_image' | 'other';
  name: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface AssetPage {
  items: AssetMeta[];
  nextCursor: string | null;
  storage: { used: number; quota: number };
}

/** Same-origin URL of a stored image (the session cookie authorises it). */
export const assetUrl = (id: string) => `/api/assets/${encodeURIComponent(id)}/file`;
export const assetDownloadUrl = (id: string) => `${assetUrl(id)}?download=1`;

const imageSize = (dataUrl: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });

export const assetsApi = {
  list: (filter: { kind?: string; q?: string; cursor?: string } = {}) => {
    const params = new URLSearchParams(Object.entries(filter).filter(([, v]) => Boolean(v)) as [string, string][]);
    const query = params.toString();
    return call<AssetPage>(`/api/assets${query ? `?${query}` : ''}`);
  },
  /** Stores an image that is already a data URL (an AI image). */
  uploadDataUrl: async (input: { kind: AssetMeta['kind']; name: string; dataUrl: string }) => {
    const { width, height } = await imageSize(input.dataUrl);
    return call<AssetMeta>('/api/assets', { method: 'POST', body: JSON.stringify({ ...input, width: width || undefined, height: height || undefined }) });
  },
  /** Compresses a photo picked by the user (1600 px JPEG) and stores it. */
  uploadFile: async (file: File, input: { kind: AssetMeta['kind'] }) => {
    const dataUrl = await fileToUploadDataUrl(file);
    return assetsApi.uploadDataUrl({ ...input, name: file.name, dataUrl });
  },
  remove: (id: string) => call<{ ok: true }>(`/api/assets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
