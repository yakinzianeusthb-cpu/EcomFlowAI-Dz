/**
 * The interface translations that every visitor needs: menus, dashboard, authentication, the landing page.
 * Importing this module registers them (each dictionary module registers itself, see registry.ts).
 *
 * The texts of a tool (admin, funnels, video...) live in their own module, imported by the tool's own code, so they
 * are only downloaded when the tool is opened. `all.ts` loads every module, for tests and tooling.
 */
import './core';
import './auth';
import './pages';
import './shared';
import './shell';

export { translations, translationSources } from './registry';
export type { Language, TranslationDictionary, TranslationVars } from './types';
