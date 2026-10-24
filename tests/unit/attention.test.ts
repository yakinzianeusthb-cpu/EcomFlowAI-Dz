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

  it('points instead of a key: no key warning while points can be bought, a top-up reminder when they run low', () => {
    const noKey = { ...ok, hasGeminiKey: false };
    expect(ids({ ...noKey, points: { available: true, balance: 120, lowBelow: 10 } })).toEqual([]);
    expect(attentionItems({ ...noKey, points: { available: true, balance: 4, lowBelow: 10 } })).toEqual([{ id: 'low-points', balance: 4 }]);
    expect(ids({ ...noKey, points: { available: false, balance: 0, lowBelow: 10 } })).toEqual(['no-key']);
    // with their own key, the seller's points do not matter
    expect(ids({ ...ok, points: { available: true, balance: 0, lowBelow: 10 } })).toEqual([]);
  });

  it('says nothing about the key while it is still unknown', () => {
    expect(ids({ ...ok, hasGeminiKey: null })).toEqual([]);
  });
});
