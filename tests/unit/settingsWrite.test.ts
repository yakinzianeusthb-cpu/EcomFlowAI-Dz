import { describe, expect, it } from 'vitest';
import { buildSettingsWrite, DEFAULT_WORKSPACE_NAME } from '../../src/lib/settingsWrite';

// A stand-in for the real encryption so the tests can see what would be stored.
const encrypt = (v: string) => `enc(${v})`;
const build = (body: Record<string, unknown>, existing: Record<string, unknown> | null = null) =>
  buildSettingsWrite({ userId: 'u1', body, existing, encrypt });

describe('buildSettingsWrite', () => {
  it('does not touch fields that were not sent (the bug: a missing workspaceName made the update fail)', () => {
    const { updateData } = build({ geminiApiKey: 'k' });
    expect(updateData).not.toHaveProperty('workspaceName');
    expect(updateData).not.toHaveProperty('facebookAccountId');
    expect(updateData.geminiApiKey).toBe('enc(k)');
  });

  it('gives a new row the default workspace name', () => {
    expect(build({}).createData.workspaceName).toBe(DEFAULT_WORKSPACE_NAME);
  });

  it('falls back to the default name when the workspace name is blanked', () => {
    const { createData, updateData } = build({ workspaceName: '   ' });
    expect(createData.workspaceName).toBe(DEFAULT_WORKSPACE_NAME);
    expect(updateData.workspaceName).toBe(DEFAULT_WORKSPACE_NAME);
  });

  it('trims and stores a workspace name', () => {
    expect(build({ workspaceName: '  Ma Boutique  ' }).updateData.workspaceName).toBe('Ma Boutique');
  });

  it('lets an account id be cleared with an empty string', () => {
    const { updateData } = build({ facebookAccountId: '' });
    expect(updateData.facebookAccountId).toBeNull();
  });

  it('keeps an existing secret when the field arrives blank or absent', () => {
    const existing = { geminiApiKey: 'enc(old)', facebookAdsToken: 'enc(fb)' };
    const { updateData } = build({ geminiApiKey: '' }, existing);
    expect(updateData.geminiApiKey).toBe('enc(old)');
    expect(updateData.facebookAdsToken).toBe('enc(fb)');
  });

  it('replaces a secret when a new value is sent', () => {
    const { updateData } = build({ geminiApiKey: 'new' }, { geminiApiKey: 'enc(old)' });
    expect(updateData.geminiApiKey).toBe('enc(new)');
  });

  it('never writes a blank secret on create', () => {
    expect(build({ geminiApiKey: '' }).createData).not.toHaveProperty('geminiApiKey');
  });

  it('rejects over-long values instead of storing them', () => {
    expect(() => build({ workspaceName: 'x'.repeat(201) })).toThrow(/trop long/i);
    expect(() => build({ geminiApiKey: 'k'.repeat(2049) })).toThrow(/trop long/i);
  });

  it('stores the image service chosen, and refuses one it does not know', () => {
    expect(build({ imageProvider: 'openai' }).updateData.imageProvider).toBe('openai');
    expect(build({}).updateData).not.toHaveProperty('imageProvider');
    expect(() => build({ imageProvider: 'midjourney' })).toThrow(/inconnu/i);
  });

  it('stores the text engine and its model, encrypts the engines\' keys, and refuses unknown values', () => {
    const { updateData } = build({ textProvider: 'anthropic', textModel: ' claude-sonnet-5-5 ', anthropicApiKey: 'sk-ant-1', openrouterApiKey: 'sk-or-1' });
    expect(updateData).toMatchObject({ textProvider: 'anthropic', textModel: 'claude-sonnet-5-5', anthropicApiKey: 'enc(sk-ant-1)', openrouterApiKey: 'enc(sk-or-1)' });
    expect(build({ textModel: '' }).updateData.textModel).toBeNull();
    expect(build({}).updateData).not.toHaveProperty('textProvider');
    expect(() => build({ textProvider: 'skynet' })).toThrow(/inconnu/i);
    expect(() => build({ textModel: '../../etc' })).toThrow(/invalide/i);
  });

  it('encrypts the other image services\' keys like the Gemini key', () => {
    const { updateData } = build({ openaiApiKey: 'sk-1', falApiKey: 'fal-1', cloudflareApiToken: 'cf-1' });
    expect(updateData).toMatchObject({ openaiApiKey: 'enc(sk-1)', falApiKey: 'enc(fal-1)', cloudflareApiToken: 'enc(cf-1)' });
  });

  it('only takes a Cloudflare account id in its own format (it goes into an address)', () => {
    expect(build({ cloudflareAccountId: ' 0123456789abcdef0123456789abcdef ' }).updateData.cloudflareAccountId).toBe('0123456789abcdef0123456789abcdef');
    expect(build({ cloudflareAccountId: '' }).updateData.cloudflareAccountId).toBeNull();
    expect(() => build({ cloudflareAccountId: '../accounts/x' })).toThrow(/Cloudflare/);
  });

  it('ignores fields it does not know', () => {
    const { createData, updateData } = build({ isAdmin: true, userId: 'other', plan: 'lifetime' });
    expect(createData).not.toHaveProperty('isAdmin');
    expect(updateData).not.toHaveProperty('isAdmin');
    expect(createData.userId).toBe('u1');
  });
});
