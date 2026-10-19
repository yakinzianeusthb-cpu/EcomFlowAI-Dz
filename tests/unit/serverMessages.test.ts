import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { languageFromCookies, localizeBody, SERVER_MESSAGES } from '../../src/i18n/serverMessages';
import { localizeResponses } from '../../src/lib/localizeResponses';
import { PROJECT_ERRORS } from '../../src/lib/projectRules';
import { ASSET_ERRORS } from '../../src/lib/assetRules';
import { BRAND_ERRORS } from '../../src/lib/brandRules';
import { META_ERRORS } from '../../src/lib/meta';
import { SAVED_WORK_ERRORS } from '../../src/lib/savedWork';

describe('languageFromCookies', () => {
  it('reads the language the app saved', () => {
    expect(languageFromCookies('dzads_lang=ar')).toBe('ar');
    expect(languageFromCookies('a=1; dzads_lang=en; b=2')).toBe('en');
    expect(languageFromCookies('dzads_lang=fr')).toBe('fr');
  });

  it('falls back to French (the language of the original messages) when it is missing or unknown', () => {
    expect(languageFromCookies(undefined)).toBe('fr');
    expect(languageFromCookies('')).toBe('fr');
    expect(languageFromCookies('dzads_lang=de')).toBe('fr');
    expect(languageFromCookies('other=ar')).toBe('fr');
  });
});

describe('localizeBody', () => {
  const body = { error: 'Plan invalide.' };

  it('translates the error text for Arabic and English', () => {
    expect(localizeBody(body, 'ar')).toEqual({ error: SERVER_MESSAGES['Plan invalide.'].ar });
    expect(localizeBody(body, 'en')).toEqual({ error: 'Invalid plan.' });
  });

  it('leaves French as it is', () => {
    expect(localizeBody(body, 'fr')).toBe(body);
  });

  it('also translates "message" and keeps every other field', () => {
    const out = localizeBody({ ok: true, message: 'Erreur serveur.', code: 'X1', n: 3 }, 'en') as Record<string, unknown>;
    expect(out).toEqual({ ok: true, message: 'Server error.', code: 'X1', n: 3 });
  });

  it('turns English-source messages into French for French users', () => {
    expect(localizeBody({ error: 'Failed to generate product info' }, 'fr')).toEqual({ error: 'Impossible de générer les informations du produit.' });
  });

  it('does not touch messages it does not know (such as ones that carry an email address)', () => {
    const dynamic = { ok: true, message: 'Plan activé pour sara@example.com.' };
    expect(localizeBody(dynamic, 'ar')).toBe(dynamic);
  });

  it('does not touch bodies that are not plain objects', () => {
    const list = [{ error: 'Plan invalide.' }];
    expect(localizeBody(list, 'ar')).toBe(list);
    expect(localizeBody(null, 'ar')).toBeNull();
    expect(localizeBody('Plan invalide.', 'ar')).toBe('Plan invalide.');
  });

  it('does not change the object it was given', () => {
    const input = { error: 'Plan invalide.' };
    localizeBody(input, 'en');
    expect(input.error).toBe('Plan invalide.');
  });
});

describe('SERVER_MESSAGES', () => {
  it('has Arabic and English for every message, different from the source', () => {
    for (const [source, entry] of Object.entries(SERVER_MESSAGES)) {
      expect(entry.ar.trim(), source).not.toBe('');
      expect(entry.en.trim(), source).not.toBe('');
      expect(/[؀-ۿ]/.test(entry.ar), `Arabic text for "${source}"`).toBe(true);
      expect(entry.ar, source).not.toBe(source);
    }
  });

  it('covers every message the server code can send', () => {
    const root = path.resolve(__dirname, '../..');
    const files = ['server.ts', 'src/routes/auth.ts', 'src/routes/catalog.ts', 'src/routes/dashboard.ts', 'src/routes/history.ts',
      'src/routes/sessions.ts', 'src/lib/admin.ts', 'src/lib/settingsWrite.ts', 'src/lib/session.ts', 'src/lib/otp.ts', 'src/lib/rateLimit.ts', 'src/lib/planGuard.ts',
      'src/routes/projects.ts', 'src/routes/assets.ts', 'src/routes/brand.ts', 'src/routes/meta.ts'];
    const PATTERNS = [
      /\b(?:error|message):\s*(["'])((?:\\.|(?!\1).)+)\1/g,       // { error: "..." }
      /\b[A-Z_]*(?:MSG|MESSAGE)\w*\s*=\s*(["'])((?:\\.|(?!\1).)+)\1/g, // const NO_KEY_MSG = "..."
      /OtpRateLimitedError\(\s*(["'])((?:\\.|(?!\1).)+)\1/g,        // thrown by the OTP code
      /SettingsValidationError\(\s*(["'])((?:\\.|(?!\1).)+)\1/g,    // refused settings values
    ];
    const missing: string[] = [];
    for (const file of files) {
      const src = fs.readFileSync(path.join(root, file), 'utf8');
      for (const re of PATTERNS) {
        for (const m of src.matchAll(re)) {
          const text = m[2].replace(/\\(["'])/g, '$1');
          if (/\$\{/.test(text)) continue; // dynamic text cannot be looked up
          if (!/[A-Za-zÀ-ÿ]{3,}\s+[A-Za-zÀ-ÿ]/.test(text)) continue; // not a sentence
          if (/must be set|OTP_HASH_SECRET/.test(text)) continue; // developer-facing startup errors
          if (!SERVER_MESSAGES[text]) missing.push(`${text}  (${file})`);
        }
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });

  it('covers every validation message of projects, files and the brand kit', () => {
    for (const message of [...Object.values(PROJECT_ERRORS), ...Object.values(ASSET_ERRORS), ...Object.values(BRAND_ERRORS), ...Object.values(META_ERRORS), ...Object.values(SAVED_WORK_ERRORS)]) {
      expect(SERVER_MESSAGES[message], message).toBeDefined();
    }
  });
});

describe('localizeResponses middleware', () => {
  const run = (cookie: string | undefined) => {
    const sent: unknown[] = [];
    const res: any = { json: vi.fn((b: unknown) => { sent.push(b); return res; }) };
    const next = vi.fn();
    localizeResponses({ headers: { cookie } } as any, res, next);
    res.json({ error: 'Email invalide.' });
    return { sent: sent[0], next };
  };

  it('translates JSON error bodies according to the language cookie', () => {
    expect(run('dzads_lang=en').sent).toEqual({ error: 'Invalid email.' });
    expect((run('dzads_lang=ar').sent as { error: string }).error).toBe(SERVER_MESSAGES['Email invalide.'].ar);
  });

  it('passes French through untouched and always continues', () => {
    expect(run('dzads_lang=fr').sent).toEqual({ error: 'Email invalide.' });
    expect(run(undefined).sent).toEqual({ error: 'Email invalide.' });
    expect(run('dzads_lang=ar').next).toHaveBeenCalledOnce();
  });
});
