import { describe, expect, it } from 'vitest';
import { buildScoutContext, MAX_PROMPT_MESSAGES } from '../../src/lib/telegramContext';

const live = {
  mode: 'live',
  channels: ['import_algerie', 'vente_gros_dz'],
  lastPulse: '2026-10-18T10:00:00.000Z',
  sampleMessages: [
    { channel: 'import_algerie', text: 'Montre connectée 4500 DA' },
    { channel: 'vente_gros_dz', text: 'Aspirateur voiture arrivage' },
  ],
};

describe('buildScoutContext', () => {
  it('feeds the real messages to the model in live mode', () => {
    const ctx = buildScoutContext(live);
    expect(ctx.mode).toBe('live');
    expect(ctx.context).toContain('[import_algerie] Montre connectée 4500 DA');
    expect(ctx.context).toContain('[vente_gros_dz] Aspirateur voiture arrivage');
    expect(ctx.context).toContain('import_algerie, vente_gros_dz');
  });

  it('tells the model to use only those messages', () => {
    expect(buildScoutContext(live).rules).toMatch(/UNIQUEMENT/);
    expect(buildScoutContext(live).rules).toMatch(/moins de 6/);
  });

  it('caps the number of messages so the prompt stays small', () => {
    const many = Array.from({ length: MAX_PROMPT_MESSAGES + 25 }, (_, i) => ({ channel: 'c', text: `message-${i}` }));
    const ctx = buildScoutContext({ ...live, sampleMessages: many });
    expect(ctx.context).toContain('message-0');
    expect(ctx.context).toContain(`message-${MAX_PROMPT_MESSAGES - 1}`);
    expect(ctx.context).not.toContain(`message-${MAX_PROMPT_MESSAGES}`);
  });

  it('is honest about simulation: no claim of real data, source labelled "Simulation"', () => {
    const ctx = buildScoutContext({ mode: 'simulation', channels: ['import_algerie'], error: 'TELEGRAM_SESSION manquants.' });
    expect(ctx.mode).toBe('simulation');
    expect(ctx.context).toContain('SIMULATION');
    expect(ctx.rules).toMatch(/aucune donnée Telegram réelle/i);
    expect(ctx.rules).toContain('"Simulation"');
    expect(ctx.context).not.toContain('[import_algerie]');
  });

  it('treats live mode without any message as simulation', () => {
    expect(buildScoutContext({ ...live, sampleMessages: [] }).mode).toBe('simulation');
  });

  it('falls back to simulation when the trend request failed', () => {
    const ctx = buildScoutContext(null);
    expect(ctx.mode).toBe('simulation');
    expect(ctx.rules).toContain('"Simulation"');
  });

  it('ignores malformed message entries', () => {
    const ctx = buildScoutContext({ ...live, sampleMessages: [{ channel: 'a', text: '' }, null as any, { channel: 'b', text: 'ok' }] });
    expect(ctx.mode).toBe('live');
    expect(ctx.context).toContain('[b] ok');
  });
});
