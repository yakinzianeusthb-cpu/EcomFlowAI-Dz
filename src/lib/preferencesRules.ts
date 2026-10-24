/**
 * What PUT /api/preferences accepts. Every field is optional (only the ones sent are changed); a field of the wrong
 * shape or size refuses the whole request, so a bad value never reaches the database.
 */
import { SAVED_WORK_ERRORS, jsonBytes } from './savedWork';

export const PREFERENCE_LIMITS = {
  listItems: 50,
  listItemLength: 64,
  idLength: 64,
  dashboardConfigBytes: 64 * 1024,
  /** the last AI image is kept with its picture (a data URL of a few MB) */
  lastImageBytes: 8 * 1024 * 1024,
  lastScriptBytes: 1024 * 1024,
} as const;

const LANGUAGES = ['fr', 'ar', 'en'];
const THEMES = ['dark', 'light'];

export interface PreferencesUpdate {
  toolsOrder?: string[];
  dashboardConfig?: Record<string, unknown>;
  dashboardWidgetOrder?: string[];
  language?: string;
  theme?: string;
  /** null clears the saved value */
  lastImage?: Record<string, unknown> | null;
  lastScript?: Record<string, unknown> | null;
  lastLpActiveId?: string | null;
  lastChatActiveId?: string | null;
}

type Parsed = { data: PreferencesUpdate } | { error: string; status: 400 | 413 };

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const isNameList = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length <= PREFERENCE_LIMITS.listItems && v.every((s) => typeof s === 'string' && s.length <= PREFERENCE_LIMITS.listItemLength);

const isOptionalId = (v: unknown): v is string | null => v === null || (typeof v === 'string' && v.length <= PREFERENCE_LIMITS.idLength);

const invalid = { error: SAVED_WORK_ERRORS.invalid, status: 400 } as const;
const tooBig = { error: SAVED_WORK_ERRORS.tooBig, status: 413 } as const;

/** A saved object (or null) no bigger than `maxBytes`. */
function savedObject(v: unknown, maxBytes: number): { ok: Record<string, unknown> | null } | typeof invalid | typeof tooBig {
  if (v === null) return { ok: null };
  if (!isPlainObject(v)) return invalid;
  return jsonBytes(v) > maxBytes ? tooBig : { ok: v };
}

/** Checks the fields sent; unknown fields are ignored, as before. */
export function parsePreferencesUpdate(body: unknown): Parsed {
  const b = isPlainObject(body) ? body : {};
  const data: PreferencesUpdate = {};

  for (const key of ['toolsOrder', 'dashboardWidgetOrder'] as const) {
    if (b[key] === undefined) continue;
    if (!isNameList(b[key])) return invalid;
    data[key] = b[key];
  }
  if (b.dashboardConfig !== undefined) {
    if (!isPlainObject(b.dashboardConfig)) return invalid;
    if (jsonBytes(b.dashboardConfig) > PREFERENCE_LIMITS.dashboardConfigBytes) return tooBig;
    data.dashboardConfig = b.dashboardConfig;
  }
  if (b.language !== undefined) {
    if (typeof b.language !== 'string' || !LANGUAGES.includes(b.language)) return invalid;
    data.language = b.language;
  }
  if (b.theme !== undefined) {
    if (typeof b.theme !== 'string' || !THEMES.includes(b.theme)) return invalid;
    data.theme = b.theme;
  }
  for (const [key, max] of [['lastImage', PREFERENCE_LIMITS.lastImageBytes], ['lastScript', PREFERENCE_LIMITS.lastScriptBytes]] as const) {
    if (b[key] === undefined) continue;
    const saved = savedObject(b[key], max);
    if (!('ok' in saved)) return saved;
    data[key] = saved.ok;
  }
  for (const key of ['lastLpActiveId', 'lastChatActiveId'] as const) {
    if (b[key] === undefined) continue;
    if (!isOptionalId(b[key])) return invalid;
    data[key] = b[key];
  }
  return { data };
}
