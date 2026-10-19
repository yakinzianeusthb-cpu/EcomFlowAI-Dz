import { describe, expect, it } from 'vitest';
import { computeCountdown } from '../../src/lib/countdown';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('computeCountdown', () => {
  const now = Date.UTC(2026, 2, 5, 12, 0, 0);

  it('splits the remaining time into days, hours, minutes and seconds', () => {
    const target = now + 3 * DAY + 4 * HOUR + 5 * MINUTE + 6 * SECOND;
    expect(computeCountdown(target, now)).toEqual({
      days: 3, hours: 4, minutes: 5, seconds: 6, totalMs: target - now, expired: false,
    });
  });

  it('rounds down to whole seconds', () => {
    const result = computeCountdown(now + 90 * SECOND + 999, now);
    expect(result.minutes).toBe(1);
    expect(result.seconds).toBe(30);
  });

  it('is expired, and clamped at zero, once the target has passed', () => {
    const result = computeCountdown(now - 5 * MINUTE, now);
    expect(result).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true });
  });

  it('counts the exact moment of the deadline as expired', () => {
    expect(computeCountdown(now, now).expired).toBe(true);
  });

  it('never expires when there is no target, as for a lifetime plan', () => {
    const empty = { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: false };
    expect(computeCountdown(null, now)).toEqual(empty);
    expect(computeCountdown(undefined, now)).toEqual(empty);
    expect(computeCountdown(Number.NaN, now)).toEqual(empty);
  });
});
