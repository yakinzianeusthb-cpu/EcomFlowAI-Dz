/**
 * Browser client for campaign projects, the asset library and the brand kit (see src/routes/projects.ts,
 * assets.ts and brand.ts). Errors keep their HTTP status, so callers can tell "fix your input" from "try again".
 */
import { fileToUploadDataUrl } from '../lib/imageCompress';
import type { OutputKind, ProjectLanguage, ProjectObjective, ProjectPlatform, ProjectStatus } from '../lib/projectRules';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** a machine-readable reason sent by the server (for example META_ACTIVE) */
    readonly code: string | null = null,
    /** Meta no longer accepts the login: the page should offer to reconnect */
    readonly reconnect = false,
  ) {
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
  if (!res.ok) throw new ApiError(typeof body?.error === 'string' ? body.error : '', res.status, typeof body?.code === 'string' ? body.code : null, body?.reconnect === true);
  return body as T;
}

export interface Project {
  id: string;
  name: string;
  productName: string;
  description: string;
  audience: string;
  objective: ProjectObjective;
  tone: string;
  platforms: ProjectPlatform[];
  language: ProjectLanguage;
  price: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary extends Project {
  coverAssetId: string | null;
  assetCount: number;
  outputs: Partial<Record<OutputKind, { version: number; at: string | null }>>;
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
  projectId: string | null;
  projectName?: string | null;
}

export interface SavedOutput<T = unknown> {
  id: string;
  version: number;
  createdAt: string;
  data: T;
}

export interface ProjectDetail {
  project: Project;
  assets: AssetMeta[];
  outputs: Partial<Record<OutputKind, SavedOutput<any>>>;
  versions: { id: string; kind: OutputKind; version: number; createdAt: string }[];
}

export type ProjectInput = Partial<Pick<Project, 'name' | 'productName' | 'description' | 'audience' | 'objective' | 'tone' | 'platforms' | 'language' | 'price' | 'status'>>;

export const projectsApi = {
  list: () => call<ProjectSummary[]>('/api/projects'),
  create: (input: ProjectInput & { name: string }) => call<Project>('/api/projects', { method: 'POST', body: JSON.stringify(input) }),
  get: (id: string) => call<ProjectDetail>(`/api/projects/${encodeURIComponent(id)}`),
  update: (id: string, input: ProjectInput) => call<Project>(`/api/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  /** `force`: delete even though its Meta ad could not be paused (the user was told it keeps running). */
  remove: (id: string, options: { force?: boolean } = {}) => call<{ ok: true }>(`/api/projects/${encodeURIComponent(id)}${options.force ? '?force=1' : ''}`, { method: 'DELETE' }),
  saveOutput: (id: string, kind: OutputKind, data: object) =>
    call<{ id: string; kind: OutputKind; version: number; createdAt: string }>(`/api/projects/${encodeURIComponent(id)}/outputs`, {
      method: 'POST',
      body: JSON.stringify({ kind, data }),
    }),
  getVersion: <T = unknown>(id: string, kind: OutputKind, version: number) =>
    call<SavedOutput<T> & { kind: OutputKind }>(`/api/projects/${encodeURIComponent(id)}/outputs/${kind}/${version}`),
};

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
  list: (filter: { kind?: string; projectId?: string; q?: string; cursor?: string } = {}) => {
    const params = new URLSearchParams(Object.entries(filter).filter(([, v]) => Boolean(v)) as [string, string][]);
    const query = params.toString();
    return call<AssetPage>(`/api/assets${query ? `?${query}` : ''}`);
  },
  /** Stores an image that is already a data URL (a rendered creative, an AI image). */
  uploadDataUrl: async (input: { kind: AssetMeta['kind']; name: string; dataUrl: string; projectId?: string | null }) => {
    const { width, height } = await imageSize(input.dataUrl);
    return call<AssetMeta>('/api/assets', { method: 'POST', body: JSON.stringify({ ...input, width: width || undefined, height: height || undefined }) });
  },
  /** Compresses a photo picked by the user (1600 px JPEG) and stores it. */
  uploadFile: async (file: File, input: { kind: AssetMeta['kind']; projectId?: string | null }) => {
    const dataUrl = await fileToUploadDataUrl(file);
    return assetsApi.uploadDataUrl({ ...input, name: file.name, dataUrl });
  },
  remove: (id: string) => call<{ ok: true }>(`/api/assets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  copyToProject: (id: string, projectId: string) => call<AssetMeta>(`/api/assets/${encodeURIComponent(id)}/copy`, { method: 'POST', body: JSON.stringify({ projectId }) }),
};

export interface BrandKit {
  brandName: string;
  logoAssetId: string | null;
  colors: string[];
  headingFont: string;
  bodyFont: string;
  tone: string;
  audience: string;
  instructions: string;
  styles: string[];
}

export const brandApi = {
  get: () => call<BrandKit>('/api/brand-kit'),
  save: (input: Partial<BrandKit>) => call<BrandKit>('/api/brand-kit', { method: 'PUT', body: JSON.stringify(input) }),
};

/** A stored image as a data URL, for tools that send pixels to the AI or draw on a canvas. */
export async function assetAsDataUrl(id: string): Promise<string> {
  const res = await fetch(assetUrl(id));
  if (!res.ok) throw new ApiError('', res.status);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError('', 0));
    reader.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Meta (see src/routes/meta.ts)
// ---------------------------------------------------------------------------------------------------------------
export interface MetaStatus {
  configured: boolean;
  /** names of the missing server settings (administrators only) */
  missing?: string[];
  connected: boolean;
  expired: boolean;
  user: { name: string } | null;
  expiresAt: string | null;
  scopes: string[];
  adAccountId: string | null;
  pageId: string | null;
}

export interface MetaAccounts {
  adAccounts: { id: string; name: string; currency: string; active: boolean }[];
  pages: { id: string; name: string }[];
  defaults: { adAccountId: string | null; pageId: string | null };
}

export interface MetaCampaignRecord {
  adAccountId: string;
  campaignId: string;
  adSetId: string;
  creativeId: string;
  adId: string;
  status: string;
  effectiveStatus?: string;
  settings: Record<string, any>;
  createdAt: string;
  activatedAt: string | null;
}

export interface MetaCampaignLive {
  campaign: { status: string; effectiveStatus: string };
  ad: { status: string; effectiveStatus: string; reviewFeedback: unknown };
  insights: Record<string, string> | null;
}

export const metaApi = {
  status: () => call<MetaStatus>('/api/meta/status'),
  connectUrl: (returnPath: string) => `/api/meta/connect?return=${encodeURIComponent(returnPath)}`,
  disconnect: () => call<{ ok: true }>('/api/meta/disconnect', { method: 'POST' }),
  accounts: () => call<MetaAccounts>('/api/meta/accounts'),
  saveDefaults: (input: { adAccountId: string | null; pageId: string | null }) => call<{ ok: true }>('/api/meta/defaults', { method: 'PUT', body: JSON.stringify(input) }),
  createCampaign: (projectId: string, draft: Record<string, unknown>) =>
    call<SavedOutput<MetaCampaignRecord>>('/api/meta/campaigns', { method: 'POST', body: JSON.stringify({ projectId, draft }) }),
  campaign: (campaignId: string) => call<MetaCampaignLive>(`/api/meta/campaigns/${encodeURIComponent(campaignId)}`),
  activate: (campaignId: string) => call<SavedOutput<MetaCampaignRecord>>(`/api/meta/campaigns/${encodeURIComponent(campaignId)}/activate`, { method: 'POST', body: JSON.stringify({ confirm: true }) }),
  pause: (campaignId: string) => call<SavedOutput<MetaCampaignRecord>>(`/api/meta/campaigns/${encodeURIComponent(campaignId)}/pause`, { method: 'POST', body: JSON.stringify({}) }),
};
