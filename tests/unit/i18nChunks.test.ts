import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { translationSources } from '../../src/i18n/all';

/**
 * The texts of each tool load together with the tool (see src/i18n/registry.ts). That only works if a file never
 * relies on a dictionary it does not import itself: otherwise it would show the French fallback until the visitor
 * happens to open the other tool first.
 */
const SRC = path.resolve(__dirname, '../../src');

function listSources(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full !== path.join(SRC, 'i18n')) listSources(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// the areas that index.ts loads for everyone
const BASE = new Set(
  [...fs.readFileSync(path.join(SRC, 'i18n/index.ts'), 'utf8').matchAll(/^import '\.\/(\w+)';$/gm)].map((m) => m[1]),
);

const keyOwner = new Map<string, string>();
const frenchOwners = new Map<string, Set<string>>();
for (const [area, dictionary] of Object.entries(translationSources)) {
  for (const [key, entry] of Object.entries(dictionary)) {
    keyOwner.set(key, area);
    const text = entry.fr.trim();
    if (!frenchOwners.has(text)) frenchOwners.set(text, new Set());
    frenchOwners.get(text)!.add(area);
  }
}

interface Analysis { file: string; importedAreas: Set<string>; keys: Set<string>; literals: Set<string> }

function analyse(file: string): Analysis {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const importedAreas = new Set<string>();
  const keys = new Set<string>();
  const literals = new Set<string>();
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && !node.importClause && ts.isStringLiteral(node.moduleSpecifier)) {
      const match = /(?:^|\/)i18n\/(\w+)$/.exec(node.moduleSpecifier.text);
      if (match) importedAreas.add(match[1]);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^(t|translate)$/.test(node.expression.text)) {
      const first = node.arguments[0];
      if (first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))) keys.add(first.text);
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) literals.add(node.text.trim());
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { file: path.relative(SRC, file).split(path.sep).join('/'), importedAreas, keys, literals };
}

const analyses = listSources(SRC).map(analyse);

describe('lazy dictionaries', () => {
  it('registers a base set of areas for everyone', () => {
    expect([...BASE].sort()).toEqual(['auth', 'core', 'pages', 'shared', 'shell']);
  });

  it('only imports areas that exist', () => {
    const unknown = analyses.flatMap((a) => [...a.importedAreas].filter((area) => !translationSources[area]).map((area) => `${a.file}: ${area}`));
    expect(unknown).toEqual([]);
  });

  it('lets a file use only keys from the base areas or from the areas it imports itself', () => {
    const problems: string[] = [];
    for (const a of analyses) {
      for (const key of a.keys) {
        const owner = keyOwner.get(key);
        if (owner && !BASE.has(owner) && !a.importedAreas.has(owner)) problems.push(`${a.file} uses "${key}" from the "${owner}" dictionary without importing it`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('keeps every French text a file shows through tf() reachable: in the base areas or in an area the file imports', () => {
    const problems: string[] = [];
    for (const a of analyses) {
      for (const text of a.literals) {
        // identifiers such as 'result' or 'promo' are not display text, even when a dictionary entry spells the same
        if (/^[a-z0-9_-]+$/.test(text)) continue;
        const owners = frenchOwners.get(text);
        if (!owners) continue;
        const reachable = [...owners].some((area) => BASE.has(area) || a.importedAreas.has(area));
        // Only complain when another tool owns the text and this file also imports at least one lazy area (a tool file)
        if (!reachable && a.importedAreas.size > 0) problems.push(`${a.file} has the text "${text.slice(0, 50)}", which only the "${[...owners].join('", "')}" dictionary translates`);
      }
    }
    expect(problems).toEqual([]);
  });
});
