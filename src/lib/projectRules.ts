/**
 * What a campaign project may contain, checked on the server before anything is stored.
 * Unknown fields (an owner id, a forged id) are dropped: ownership always comes from the session.
 */

export const PROJECT_OBJECTIVES = ['sales', 'leads', 'traffic', 'awareness'] as const;
export const PROJECT_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'snapchat', 'web'] as const;
export const PROJECT_LANGUAGES = ['ar', 'fr', 'en'] as const;
export const PROJECT_STATUSES = ['draft', 'archived'] as const;
export const OUTPUT_KINDS = ['landing', 'video', 'ads', 'meta_campaign'] as const;
/** What the browser may save itself. Meta campaign records are written only by the Meta routes, from Meta's answers. */
export const CLIENT_OUTPUT_KINDS = ['landing', 'video', 'ads'] as const;

export type ProjectObjective = (typeof PROJECT_OBJECTIVES)[number];
export type ProjectPlatform = (typeof PROJECT_PLATFORMS)[number];
export type ProjectLanguage = (typeof PROJECT_LANGUAGES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type OutputKind = (typeof OUTPUT_KINDS)[number];

/** A saved output (one landing page, one ad pack...) must stay small enough to load quickly. */
export const MAX_OUTPUT_BYTES = 600_000;
export const MAX_PROJECTS_PER_USER = 200;
/** Older versions beyond this are deleted when a new one is saved. */
export const MAX_VERSIONS_PER_OUTPUT = 20;
/** Total size of the saved outputs of one account, with and without an active plan. */
export const OUTPUT_STORAGE_BYTES = { paid: 100 * 1024 * 1024, free: 10 * 1024 * 1024 } as const;
/** Product photos per campaign, as offered by the interface. */
export const MAX_PRODUCT_PHOTOS = 8;

export const PROJECT_ERRORS = {
  name: 'Donne un nom au projet.',
  tooLong: 'Un des champs est trop long.',
  objective: 'Objectif de campagne invalide.',
  platforms: 'Plateforme invalide.',
  language: 'Langue invalide.',
  status: 'Statut de projet invalide.',
  outputKind: 'Type de contenu invalide.',
  outputData: 'Contenu invalide.',
  outputTooBig: 'Ce contenu est trop volumineux pour être enregistré.',
  notFound: 'Projet introuvable.',
  limit: 'Nombre maximum de projets atteint. Archive ou supprime des projets.',
  metaActive: 'La publicité Meta de cette campagne n’a pas pu être mise en pause. Mets-la en pause (onglet Publier ou Gestionnaire de publicités) avant de supprimer la campagne.',
  storageFull: 'Espace de sauvegarde plein. Supprime d’anciennes campagnes pour en enregistrer de nouvelles.',
} as const;

const TEXT_LIMITS = { name: 120, productName: 160, description: 4000, audience: 1000, tone: 200, price: 60 } as const;
type TextField = Exclude<keyof typeof TEXT_LIMITS, 'name'>;
const TEXT_FIELDS: TextField[] = ['productName', 'description', 'audience', 'tone', 'price'];

export interface ProjectInput {
  name?: string;
  productName?: string;
  description?: string;
  audience?: string;
  objective?: ProjectObjective;
  tone?: string;
  platforms?: ProjectPlatform[];
  language?: ProjectLanguage;
  price?: string;
  status?: ProjectStatus;
}

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

/** Validates a create (all required fields) or an update (`partial`: only the fields that are sent). */
export function parseProjectInput(body: unknown, options: { partial?: boolean } = {}): { data: ProjectInput } | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const data: ProjectInput = {};

  if (!options.partial || 'name' in b) {
    if (typeof b.name !== 'string' || !b.name.trim()) return { error: PROJECT_ERRORS.name };
    if (b.name.trim().length > TEXT_LIMITS.name) return { error: PROJECT_ERRORS.tooLong };
    data.name = b.name.trim();
  }
  for (const key of TEXT_FIELDS) {
    if (b[key] === undefined) continue;
    const value = b[key];
    if (typeof value !== 'string' || value.trim().length > TEXT_LIMITS[key]) return { error: PROJECT_ERRORS.tooLong };
    data[key] = value.trim();
  }
  if (b.objective !== undefined) {
    if (!isOneOf(PROJECT_OBJECTIVES, b.objective)) return { error: PROJECT_ERRORS.objective };
    data.objective = b.objective;
  }
  if (b.platforms !== undefined) {
    if (!Array.isArray(b.platforms) || !b.platforms.every((p) => isOneOf(PROJECT_PLATFORMS, p))) return { error: PROJECT_ERRORS.platforms };
    data.platforms = [...new Set(b.platforms as ProjectPlatform[])];
  }
  if (b.language !== undefined) {
    if (!isOneOf(PROJECT_LANGUAGES, b.language)) return { error: PROJECT_ERRORS.language };
    data.language = b.language;
  }
  if (b.status !== undefined) {
    if (!isOneOf(PROJECT_STATUSES, b.status)) return { error: PROJECT_ERRORS.status };
    data.status = b.status;
  }
  return { data };
}

/** A generated output to save as a new version: a kind the browser may write and a plain object of reasonable size. */
export function parseOutputInput(body: unknown): { kind: OutputKind; data: Record<string, unknown>; bytes: number } | { error: string } {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  if (!isOneOf(CLIENT_OUTPUT_KINDS, b.kind)) return { error: PROJECT_ERRORS.outputKind };
  const data = b.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: PROJECT_ERRORS.outputData };
  const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
  if (bytes > MAX_OUTPUT_BYTES) return { error: PROJECT_ERRORS.outputTooBig };
  return { kind: b.kind, data: data as Record<string, unknown>, bytes };
}
