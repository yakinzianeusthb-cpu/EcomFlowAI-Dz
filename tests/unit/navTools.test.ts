import { describe, expect, it } from 'vitest';
import { isToolPaid } from '../../src/lib/access';
import { NAV_GROUPS, PRIMARY_NAV, TAB_PATHS, TAB_TITLES, tabFromPath } from '../../src/lib/nav';
import { AI_TOOLS, CORE_TOOLS, findTool } from '../../src/lib/tools';
import { translations } from '../../src/i18n/all';

describe('tool list', () => {
  it('has a unique id for every tool', () => {
    const ids = AI_TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('agrees with the access rules on which tools need a plan, so the lock screen and the server never disagree', () => {
    const disagreements = AI_TOOLS.filter((tool) => tool.paid !== isToolPaid(tool.id)).map((tool) => tool.id);
    expect(disagreements).toEqual([]);
  });

  it('gives every tool a page title in the top bar', () => {
    const missing = AI_TOOLS.filter((tool) => !(tool.id in TAB_TITLES)).map((tool) => tool.id);
    expect(missing).toEqual([]);
  });

  it('keeps the sidebar launcher inside the full list', () => {
    expect(CORE_TOOLS.length).toBeGreaterThan(0);
    for (const tool of CORE_TOOLS) expect(findTool(tool.id)).toBe(tool);
  });

  it('finds a tool by id and answers undefined for an unknown one', () => {
    expect(findTool('calculator')?.paid).toBe(false);
    expect(findTool('video')?.paid).toBe(true);
    expect(findTool('nope')).toBeUndefined();
  });
});

describe('navigation', () => {
  it('has a title for every sidebar entry', () => {
    const missing = PRIMARY_NAV.filter((entry) => !(entry.id in TAB_TITLES)).map((entry) => entry.id);
    expect(missing).toEqual([]);
  });

  it('only uses translation keys that exist, in every language', () => {
    const keys = [
      ...PRIMARY_NAV.map((entry) => entry.labelKey),
      ...Object.values(TAB_TITLES).map((title) => title.key),
      ...NAV_GROUPS.map((group) => group.labelKey),
    ];
    const missing = keys.filter((key) => !translations[key]);
    expect(missing).toEqual([]);
  });

  it('lists every grouped entry once in the sidebar', () => {
    const ids = NAV_GROUPS.flatMap((group) => group.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(PRIMARY_NAV.map((entry) => entry.id));
  });
});

describe('page addresses', () => {
  it('gives every page its own address', () => {
    const paths = Object.values(TAB_PATHS);
    expect(new Set(paths).size).toBe(paths.length);
    for (const tab of Object.keys(TAB_TITLES)) expect(TAB_PATHS[tab as keyof typeof TAB_PATHS], tab).toMatch(/^\//);
  });

  it('opens the page an address points to, and comes back to the same address', () => {
    for (const [tab, path] of Object.entries(TAB_PATHS)) expect(tabFromPath(path), path).toEqual({ tab });
  });

  it('opens the overview for the addresses of removed pages (old campaigns, brand kit, ads, photo studio)', () => {
    for (const old of ['/projects', '/projects/0b6f3c1e-8d2a-4f6b-9c3d-2e1f0a9b8c7d', '/brand', '/studio/ads', '/lab/images']) {
      expect(tabFromPath(old), old).toEqual({ tab: 'dashboard' });
    }
  });

  it('falls back to the overview for unknown or malformed addresses', () => {
    expect(tabFromPath('/nope')).toEqual({ tab: 'dashboard' });
    expect(tabFromPath('/studio/landing/')).toEqual({ tab: 'landing' });
  });
});
