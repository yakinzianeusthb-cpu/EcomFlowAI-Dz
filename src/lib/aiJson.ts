const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Gemini sometimes wraps the single JSON object it was asked for in an array (`[{...}]`). The tools expect the object,
 * so the first object of such an array is returned; anything else comes back unchanged.
 */
export function unwrapSingleObject(value: unknown): unknown {
  if (Array.isArray(value) && isPlainObject(value[0])) return value[0];
  return value;
}
