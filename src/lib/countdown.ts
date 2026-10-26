import { useEffect, useState } from 'react';

export interface Countdown {
  /** Whole days remaining. */
  days: number;
  /** Hours remaining within the current day (0-23). */
  hours: number;
  /** Minutes remaining within the current hour (0-59). */
  minutes: number;
  /** Seconds remaining within the current minute (0-59). */
  seconds: number;
  /** Total remaining time in milliseconds (clamped at 0). */
  totalMs: number;
  /** True once the target timestamp has passed. */
  expired: boolean;
}

/** The time left until `targetMs` at the moment `nowMs`. No target (a lifetime plan) never expires. */
export function computeCountdown(targetMs: number | null | undefined, nowMs: number): Countdown {
  const hasTarget = targetMs != null && !Number.isNaN(targetMs);
  const remaining = hasTarget ? targetMs - nowMs : 0;
  const clamped = Math.max(0, remaining);

  return {
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
    totalMs: clamped,
    expired: hasTarget && remaining <= 0,
  };
}

/**
 * Live countdown to a future timestamp. Re-renders every second so the
 * remaining time (days → hours → minutes → seconds) counts down in real time.
 * Pass `null`/`undefined` (e.g. lifetime plan with no expiry) for a zeroed,
 * never-expired countdown.
 */
export function useCountdown(targetMs: number | null | undefined, tickMs = 1000): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (targetMs == null || Number.isNaN(targetMs)) return;
    setNow(Date.now()); // snap to the new target immediately
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [targetMs, tickMs]);

  return computeCountdown(targetMs, now);
}
