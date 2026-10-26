import { describe, expect, it } from 'vitest';
import { canUsePaidTools, hasActivePlan, isPlanActive, isToolPaid } from '../../src/lib/access';

const NOW = new Date('2026-10-18T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;
const at = (offsetMs: number) => new Date(NOW.getTime() + offsetMs);

describe('isPlanActive', () => {
  it('is false when there is no user', () => {
    expect(isPlanActive(null, NOW)).toBe(false);
    expect(isPlanActive(undefined, NOW)).toBe(false);
  });

  it('is false for pending, rejected and missing statuses', () => {
    expect(isPlanActive({ planStatus: 'pending', planExpiresAt: at(DAY) }, NOW)).toBe(false);
    expect(isPlanActive({ planStatus: null, planExpiresAt: at(DAY) }, NOW)).toBe(false);
    expect(isPlanActive({}, NOW)).toBe(false);
  });

  it('is true for an active plan that has not expired yet', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: at(DAY) }, NOW)).toBe(true);
  });

  it('is false once the expiry date has passed', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: at(-1) }, NOW)).toBe(false);
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: at(-30 * DAY) }, NOW)).toBe(false);
  });

  it('treats the exact expiry instant as expired', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: NOW }, NOW)).toBe(false);
  });

  it('keeps lifetime plans (no expiry date) active forever', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: null }, NOW)).toBe(true);
    expect(isPlanActive({ planStatus: 'active' }, NOW)).toBe(true);
  });

  it('accepts the ISO strings the API sends to the browser', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: at(DAY).toISOString() }, NOW)).toBe(true);
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: at(-DAY).toISOString() }, NOW)).toBe(false);
  });

  it('fails closed on an unparseable expiry date', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: 'not-a-date' }, NOW)).toBe(false);
  });

  it('uses the current time when none is passed', () => {
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: new Date(Date.now() + DAY) })).toBe(true);
    expect(isPlanActive({ planStatus: 'active', planExpiresAt: new Date(Date.now() - DAY) })).toBe(false);
  });
});

describe('hasActivePlan', () => {
  it('follows the same rule, including expiry', () => {
    expect(hasActivePlan({ planStatus: 'active', planExpiresAt: new Date(Date.now() + DAY) })).toBe(true);
    expect(hasActivePlan({ planStatus: 'active', planExpiresAt: new Date(Date.now() - DAY) })).toBe(false);
    expect(hasActivePlan(null)).toBe(false);
  });
});

describe('canUsePaidTools', () => {
  it('lets admins through without a plan', () => {
    expect(canUsePaidTools({ isAdmin: true, planStatus: null }, NOW)).toBe(true);
  });

  it('lets users with a live plan through', () => {
    expect(canUsePaidTools({ planStatus: 'active', planExpiresAt: at(DAY) }, NOW)).toBe(true);
  });

  it('blocks everyone else, including lapsed plans', () => {
    expect(canUsePaidTools({ planStatus: 'active', planExpiresAt: at(-DAY) }, NOW)).toBe(false);
    expect(canUsePaidTools({ planStatus: 'pending' }, NOW)).toBe(false);
    expect(canUsePaidTools(null, NOW)).toBe(false);
  });
});

describe('isToolPaid', () => {
  it('marks the AI tools as paid and the free tools as free', () => {
    expect(isToolPaid('video')).toBe(true);
    expect(isToolPaid('landing')).toBe(true);
    expect(isToolPaid('calculator')).toBe(false);
    expect(isToolPaid('dashboard')).toBe(false);
  });
});
