import type { Language, TranslationDictionary, TranslationVars } from './types';

/** Replaces {name} placeholders. Unknown placeholders stay visible; a replacer function keeps `$` in values literal. */
function fill(text: string, vars?: TranslationVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

const frenchIndexes = new WeakMap<TranslationDictionary, Map<string, TranslationDictionary[string]>>();

/** French text -> entry, built once per dictionary. When two entries share a French text, the first one wins. */
function frenchIndex(dictionary: TranslationDictionary) {
  let index = frenchIndexes.get(dictionary);
  if (!index) {
    index = new Map();
    for (const entry of Object.values(dictionary)) {
      const text = entry.fr.trim();
      if (!index.has(text)) index.set(text, entry);
    }
    frenchIndexes.set(dictionary, index);
  }
  return index;
}

/** Forgets the French lookup index of a dictionary that gained entries, so the next lookup sees them. */
export function resetFrenchIndex(dictionary: TranslationDictionary): void {
  frenchIndexes.delete(dictionary);
}

/**
 * Translates a text that the code keeps in French on purpose, such as the options of a list whose value is also
 * sent to the AI: only what is DISPLAYED is translated, the stored value stays as it is.
 * Text that is not in the dictionary is shown unchanged.
 */
export function translateFrench(
  dictionary: TranslationDictionary,
  text: string,
  language: Language,
  vars?: TranslationVars,
): string {
  const entry = frenchIndex(dictionary).get(text.trim());
  return fill(entry?.[language] || text, vars);
}

/**
 * Looks a key up in a dictionary.
 * Falls back to `fallback`, then to the key itself, when the key or the language value is missing.
 */
export function translateKey(
  dictionary: TranslationDictionary,
  key: string,
  fallback: string | undefined,
  language: Language,
  vars?: TranslationVars,
): string {
  const text = dictionary[key]?.[language] || fallback || key;
  return fill(text, vars);
}
