import { describe, expect, it } from 'vitest';
import { SAVED_WORK_LIMITS, jsonBytes, validTitle } from '../../src/lib/savedWork';

describe('saved work limits', () => {
  it('measures JSON as it is stored, in bytes', () => {
    expect(jsonBytes({ a: 1 })).toBe(7);
    expect(jsonBytes('é')).toBe(4);
    expect(jsonBytes(undefined)).toBe(4);
  });

  it('accepts a missing or reasonable title, and nothing else', () => {
    expect(validTitle(undefined)).toBe(true);
    expect(validTitle('Lampe LED')).toBe(true);
    expect(validTitle('x'.repeat(SAVED_WORK_LIMITS.titleLength + 1))).toBe(false);
    expect(validTitle({ $gt: '' })).toBe(false);
  });

  it('leaves room for real sessions (about 30 KB each)', () => {
    expect(SAVED_WORK_LIMITS.lpStateBytes).toBeGreaterThan(30 * 1024 * 10);
  });
});
