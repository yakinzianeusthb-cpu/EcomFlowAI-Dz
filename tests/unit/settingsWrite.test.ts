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

  it('ignores fields it does not know', () => {
    const { createData, updateData } = build({ isAdmin: true, userId: 'other', plan: 'lifetime' });
    expect(createData).not.toHaveProperty('isAdmin');
    expect(updateData).not.toHaveProperty('isAdmin');
    expect(createData.userId).toBe('u1');
  });
});
