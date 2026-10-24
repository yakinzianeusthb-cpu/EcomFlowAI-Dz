import { describe, expect, it } from 'vitest';
import { attentionItems } from '../../src/lib/attention';

const now = new Date('2026-10-18T12:00:00Z');
const day = 86_400_000;
const ok = {
  hasGeminiKey: true,
  plan: { active: true, pending: false, expiresAt: new Date(now.getTime() + 60 * day).toISOString() },
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

  it('says nothing about the key while it is still unknown', () => {
    expect(ids({ ...ok, hasGeminiKey: null })).toEqual([]);
  });
});
