import { describe, expect, it } from 'vitest';
import { refusalForLog } from '../../src/lib/refusalLog';

describe('refusalForLog', () => {
  it('keeps the status and the start of the answer, with key-like strings blanked out', () => {
    const line = refusalForLog({ status: 401, text: '{"error":"Incorrect API key: sk_abcdefghijklmnopqrstuvwxyz123"}' });
    expect(line).toBe('401 {"error":"Incorrect API key: […]"}');
  });

  it('cuts long answers and copes with errors that have no status or text', () => {
    expect(refusalForLog({ status: 500, text: 'x '.repeat(500) }).length).toBeLessThanOrEqual(244);
    expect(refusalForLog({ name: 'TimeoutError' })).toBe('TimeoutError');
    expect(refusalForLog(null)).toBe('unknown');
  });
});
