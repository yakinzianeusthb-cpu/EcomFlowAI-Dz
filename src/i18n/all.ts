/**
 * Loads every dictionary module. For tests and tooling that need the complete set of translations; the app itself
 * loads the tool dictionaries lazily, together with the tool that uses them.
 */
import './index';
import './admin';
import './assembler';
import './calculator';
import './campaigns';
import './checkout';
import './contact';
import './funnels';
import './home';
import './settings';
import './video';

export { translations, translationSources } from './registry';
