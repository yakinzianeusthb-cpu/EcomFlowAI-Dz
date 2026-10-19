import { describe, expect, it } from 'vitest';
import { attentionItems } from '../../src/lib/attention';

const now = new Date('2026-10-18T12:00:00Z');
const day = 86_400_000;
const ok = {
  hasGeminiKey: true,
  plan: { active: true, pending: false, expiresAt: new Date(now.getTime() + 60 * day).toISOString() },
  brand: { brandName: 'Lumina', colors: ['#5b3df5'], logoAssetId: 'x' },
  projects: [{ id: 'p1', name: 'Lampe', status: 'draft', outputs: { landing: { version: 1 }, video: { version: 1 }, ads: { version: 1 } } }],
  meta: { configured: true, connected: true, expired: false },
  now,
};
const ids = (input: Parameters<typeof attentionItems>[0]) => attentionItems(input).map((i) => i.id);

describe('attentionItems', () => {
  it('is empty when everything is set up', () => {
    expect(ids(ok)).toEqual([]);
  });

  it('puts what blocks the AI first: no plan, then no key', () => {
    expect(ids({ ...ok, hasGeminiKey: false, plan: { active: false, pending: false, expiresAt: null } })).toEqual(['no-plan', 'no-key']);
    expect(ids({ ...ok, plan: { active: false, pending: true, expiresAt: null } })).toEqual(['plan-pending']);
  });

  it('warns a week before the plan ends', () => {
    expect(ids({ ...ok, plan: { active: true, pending: false, expiresAt: new Date(now.getTime() + 3 * day).toISOString() } })).toEqual(['plan-ending']);
    expect(attentionItems({ ...ok, plan: { active: true, pending: false, expiresAt: new Date(now.getTime() + 3 * day).toISOString() } })[0]).toMatchObject({ days: 3 });
    expect(ids({ ...ok, plan: { active: true, pending: false, expiresAt: null } })).toEqual([]);
  });

  it('points to campaigns that are missing an output, newest first', () => {
    const items = attentionItems({ ...ok, projects: [{ id: 'p2', name: 'Montre', status: 'draft', outputs: { landing: { version: 1 } } }, ...ok.projects] });
    expect(items.map((i) => i.id)).toEqual(['missing-outputs']);
    expect(items[0]).toMatchObject({ projectId: 'p2', projectName: 'Montre', missing: ['video', 'ads'] });
  });

  it('ignores archived campaigns', () => {
    expect(ids({ ...ok, projects: [{ id: 'p3', name: 'Vieux', status: 'archived', outputs: {} }] })).toEqual([]);
  });

  it('suggests the brand kit until it has a name or colours', () => {
    expect(ids({ ...ok, brand: { brandName: '', colors: [], logoAssetId: null } })).toEqual(['brand-empty']);
    expect(ids({ ...ok, brand: null })).toEqual([]);
  });

  it('mentions Meta only when the site can actually connect to it', () => {
    expect(ids({ ...ok, meta: { configured: true, connected: false, expired: false } })).toEqual(['meta-connect']);
    expect(ids({ ...ok, meta: { configured: true, connected: true, expired: true } })).toEqual(['meta-expired']);
    expect(ids({ ...ok, meta: { configured: false, connected: false, expired: false } })).toEqual([]);
  });
});
