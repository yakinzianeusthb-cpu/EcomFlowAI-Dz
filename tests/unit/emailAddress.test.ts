import { describe, expect, it } from 'vitest';
import { isEmailAddress } from '../../src/lib/emailAddress';

describe('isEmailAddress', () => {
  it('accepts ordinary addresses and refuses obvious mistakes', () => {
    expect(isEmailAddress('amina.b@example.dz')).toBe(true);
    expect(isEmailAddress('amina@example')).toBe(false);
    expect(isEmailAddress('amina @example.dz')).toBe(false);
    expect(isEmailAddress('')).toBe(false);
  });

  it('answers at once on a huge crafted input instead of blocking the server', () => {
    const attack = `a@${'a.'.repeat(500_000)}@`;
    const start = performance.now();
    expect(isEmailAddress(attack)).toBe(false);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
