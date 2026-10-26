import { describe, expect, it } from 'vitest';
import { PREFERENCE_LIMITS, parsePreferencesUpdate } from '../../src/lib/preferencesRules';
import { SAVED_WORK_ERRORS } from '../../src/lib/savedWork';

const invalid = { error: SAVED_WORK_ERRORS.invalid, status: 400 };
const tooBig = { error: SAVED_WORK_ERRORS.tooBig, status: 413 };

describe('parsePreferencesUpdate', () => {
  it('accepts what the app sends today', () => {
    const image = { result: `data:image/png;base64,${'A'.repeat(2_000_000)}`, productName: 'Lampe', style: 'lifestyle', aspectRatio: '1:1' };
    expect(parsePreferencesUpdate({ theme: 'light' })).toEqual({ data: { theme: 'light' } });
    expect(parsePreferencesUpdate({ language: 'ar' })).toEqual({ data: { language: 'ar' } });
    expect(parsePreferencesUpdate({ lastImage: image })).toEqual({ data: { lastImage: image } });
    expect(parsePreferencesUpdate({ lastScript: { result: { scenes: [] }, productName: 'x' } })).toEqual({ data: { lastScript: { result: { scenes: [] }, productName: 'x' } } });
    expect(parsePreferencesUpdate({ lastLpActiveId: '7d1c1f4e-0000-4000-8000-000000000000' })).toEqual({ data: { lastLpActiveId: '7d1c1f4e-0000-4000-8000-000000000000' } });
    expect(parsePreferencesUpdate({ lastChatActiveId: null })).toEqual({ data: { lastChatActiveId: null } });
  });

  it('accepts the dashboard fields', () => {
    const body = { toolsOrder: ['video', 'landing'], dashboardWidgetOrder: ['stats'], dashboardConfig: { stats: true } };
    expect(parsePreferencesUpdate(body)).toEqual({ data: body });
  });

  it('ignores unknown fields and a body that is not an object, as before', () => {
    expect(parsePreferencesUpdate({ userId: 'someone-else', isAdmin: true })).toEqual({ data: {} });
    expect(parsePreferencesUpdate(null)).toEqual({ data: {} });
    expect(parsePreferencesUpdate('text')).toEqual({ data: {} });
  });

  it('refuses values of the wrong shape', () => {
    expect(parsePreferencesUpdate({ theme: 'blue' })).toEqual(invalid);
    expect(parsePreferencesUpdate({ language: 'de' })).toEqual(invalid);
    expect(parsePreferencesUpdate({ toolsOrder: 'video' })).toEqual(invalid);
    expect(parsePreferencesUpdate({ toolsOrder: [1, 2] })).toEqual(invalid);
    expect(parsePreferencesUpdate({ dashboardConfig: [] })).toEqual(invalid);
    expect(parsePreferencesUpdate({ lastImage: 'data:image/png;base64,AAAA' })).toEqual(invalid);
    expect(parsePreferencesUpdate({ lastLpActiveId: 12 })).toEqual(invalid);
  });

  it('refuses one bad field without saving the good ones', () => {
    expect(parsePreferencesUpdate({ theme: 'dark', language: 'xx' })).toEqual(invalid);
  });

  it('refuses lists and ids that are too long', () => {
    expect(parsePreferencesUpdate({ toolsOrder: Array(PREFERENCE_LIMITS.listItems + 1).fill('x') })).toEqual(invalid);
    expect(parsePreferencesUpdate({ toolsOrder: ['x'.repeat(PREFERENCE_LIMITS.listItemLength + 1)] })).toEqual(invalid);
    expect(parsePreferencesUpdate({ lastChatActiveId: 'x'.repeat(PREFERENCE_LIMITS.idLength + 1) })).toEqual(invalid);
  });

  it('refuses saved objects over their size limit with "too big"', () => {
    expect(parsePreferencesUpdate({ lastScript: { result: 'x'.repeat(PREFERENCE_LIMITS.lastScriptBytes) } })).toEqual(tooBig);
    expect(parsePreferencesUpdate({ lastImage: { result: 'x'.repeat(PREFERENCE_LIMITS.lastImageBytes) } })).toEqual(tooBig);
    expect(parsePreferencesUpdate({ dashboardConfig: { blob: 'x'.repeat(PREFERENCE_LIMITS.dashboardConfigBytes) } })).toEqual(tooBig);
  });

  it('accepts null to clear a saved image or script', () => {
    expect(parsePreferencesUpdate({ lastImage: null, lastScript: null })).toEqual({ data: { lastImage: null, lastScript: null } });
  });
});
