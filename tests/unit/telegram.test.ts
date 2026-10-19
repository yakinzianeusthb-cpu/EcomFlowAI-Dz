import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The Telegram client is mocked: these tests never open a network connection.
const fake = vi.hoisted(() => ({
  sessionError: null as Error | null,
  connectError: null as Error | null,
  authorized: true,
  disconnectError: null as Error | null,
  messagesByChannel: {} as Record<string, Array<{ message?: unknown }>>,
  failingChannels: new Set<string>(),
  disconnectCalls: 0,
}));

vi.mock('telegram/sessions/index.js', () => ({
  StringSession: class {
    constructor(public value: string) {
      if (fake.sessionError) throw fake.sessionError;
    }
  },
}));

vi.mock('telegram', () => ({
  TelegramClient: class {
    async connect() { if (fake.connectError) throw fake.connectError; }
    async checkAuthorization() { return fake.authorized; }
    async getEntity(channel: string) {
      if (fake.failingChannels.has(channel)) throw new Error('CHANNEL_PRIVATE');
      return channel;
    }
    async getMessages(channel: string) { return fake.messagesByChannel[channel] ?? []; }
    async disconnect() {
      fake.disconnectCalls++;
      if (fake.disconnectError) throw fake.disconnectError;
    }
  },
}));

import { DZ_CHANNELS, getTelegramPulse } from '../../server-telegram';

const withCredentials = () => {
  vi.stubEnv('TELEGRAM_API_ID', '12345');
  vi.stubEnv('TELEGRAM_API_HASH', 'hash');
  vi.stubEnv('TELEGRAM_SESSION', 'session-string');
};

beforeEach(() => {
  fake.sessionError = null;
  fake.connectError = null;
  fake.authorized = true;
  fake.disconnectError = null;
  fake.messagesByChannel = {};
  fake.failingChannels = new Set();
  fake.disconnectCalls = 0;
  vi.stubEnv('TELEGRAM_API_ID', '');
  vi.stubEnv('TELEGRAM_API_HASH', '');
  vi.stubEnv('TELEGRAM_SESSION', '');
});

afterEach(() => vi.unstubAllEnvs());

describe('getTelegramPulse', () => {
  it('answers with a labelled simulation when credentials are missing', async () => {
    const pulse = await getTelegramPulse();
    expect(pulse.mode).toBe('simulation');
    expect(pulse.channels).toEqual(DZ_CHANNELS);
    expect(pulse.error).toMatch(/manquants/);
  });

  it('falls back to the simulation instead of throwing when the session string is malformed', async () => {
    withCredentials();
    fake.sessionError = new Error('Not a valid string');
    const pulse = await getTelegramPulse();
    expect(pulse.mode).toBe('simulation');
    expect(pulse.error).toContain('Not a valid string');
  });

  it('falls back when the session is no longer authorised, and disconnects', async () => {
    withCredentials();
    fake.authorized = false;
    const pulse = await getTelegramPulse();
    expect(pulse.mode).toBe('simulation');
    expect(pulse.error).toMatch(/invalide|expirée/);
    expect(fake.disconnectCalls).toBe(1);
  });

  it('falls back when the connection fails, even if disconnecting also fails', async () => {
    withCredentials();
    fake.connectError = new Error('ETIMEDOUT');
    fake.disconnectError = new Error('already closed');
    const pulse = await getTelegramPulse();
    expect(pulse.mode).toBe('simulation');
    expect(pulse.error).toContain('ETIMEDOUT');
  });

  it('reads real messages, trims them, skips empty ones and unreachable channels', async () => {
    withCredentials();
    fake.failingChannels.add(DZ_CHANNELS[1]);
    fake.messagesByChannel[DZ_CHANNELS[0]] = [
      { message: '  Montre connectée en promo  ' },
      { message: '   ' },
      { message: 123 },
      { message: 'x'.repeat(500) },
    ];
    fake.messagesByChannel[DZ_CHANNELS[2]] = [{ message: 'Aspirateur voiture' }];

    const pulse = await getTelegramPulse();

    expect(pulse.mode).toBe('live');
    expect(pulse.sampleMessages).toHaveLength(3);
    expect(pulse.sampleMessages![0]).toEqual({ channel: DZ_CHANNELS[0], text: 'Montre connectée en promo' });
    expect(pulse.sampleMessages![1].text).toHaveLength(200);
    expect(pulse.rawSnippet).toContain(`[${DZ_CHANNELS[2]}] Aspirateur voiture`);
    expect(fake.disconnectCalls).toBe(1);
  });

  it('falls back when no channel returned any message', async () => {
    withCredentials();
    const pulse = await getTelegramPulse();
    expect(pulse.mode).toBe('simulation');
    expect(pulse.error).toMatch(/introuvables|aucun message/i);
  });
});
