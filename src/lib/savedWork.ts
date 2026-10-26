/**
 * Limits for the work the older tools save on the server (generation history, landing-page and chat sessions),
 * so one account cannot fill the database. Sized well above real use: a landing session is about 30 KB.
 */
export const SAVED_WORK_LIMITS = {
  historyKept: 50,
  historyPayloadBytes: 200 * 1024,
  sessionsPerAccount: 100,
  lpStateBytes: 1024 * 1024,
  chatMessagesBytes: 2 * 1024 * 1024,
  titleLength: 200,
} as const;

export const SAVED_WORK_ERRORS = {
  tooBig: 'Ce contenu est trop volumineux pour être enregistré.',
  tooMany: 'Nombre maximum de sessions enregistrées atteint. Supprime d’anciennes sessions.',
  invalid: 'Contenu invalide.',
} as const;

/** Size of a JSON value as it will be stored. */
export const jsonBytes = (value: unknown): number => new TextEncoder().encode(JSON.stringify(value ?? null)).length;

/** A title is optional; when given it must be a reasonable string. */
export const validTitle = (value: unknown): boolean =>
  value === undefined || value === null || (typeof value === 'string' && value.length <= SAVED_WORK_LIMITS.titleLength);
