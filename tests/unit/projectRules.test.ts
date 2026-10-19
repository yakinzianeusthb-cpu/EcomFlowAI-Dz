import { describe, expect, it } from 'vitest';
import { MAX_OUTPUT_BYTES, PROJECT_ERRORS, parseOutputInput, parseProjectInput } from '../../src/lib/projectRules';

describe('parseProjectInput', () => {
  it('accepts a complete brief and tidies it', () => {
    const r = parseProjectInput({
      name: '  Lampe LED  ', productName: 'Lampe LED rechargeable', description: 'Autonomie 12 h', audience: 'Familles',
      objective: 'sales', tone: 'Chaleureux', platforms: ['facebook', 'instagram', 'facebook'], language: 'ar', price: '2 900 DA',
    });
    expect(r).toEqual({
      data: {
        name: 'Lampe LED', productName: 'Lampe LED rechargeable', description: 'Autonomie 12 h', audience: 'Familles',
        objective: 'sales', tone: 'Chaleureux', platforms: ['facebook', 'instagram'], language: 'ar', price: '2 900 DA',
      },
    });
  });

  it('needs a name to create a project', () => {
    expect(parseProjectInput({ name: '   ' })).toEqual({ error: PROJECT_ERRORS.name });
    expect(parseProjectInput({})).toEqual({ error: PROJECT_ERRORS.name });
  });

  it('only updates the fields that are sent when partial', () => {
    expect(parseProjectInput({ audience: 'Étudiants' }, { partial: true })).toEqual({ data: { audience: 'Étudiants' } });
    expect(parseProjectInput({ name: '' }, { partial: true })).toEqual({ error: PROJECT_ERRORS.name });
  });

  it('refuses values outside the allowed lists', () => {
    expect(parseProjectInput({ name: 'x', objective: 'hack' })).toEqual({ error: PROJECT_ERRORS.objective });
    expect(parseProjectInput({ name: 'x', language: 'de' })).toEqual({ error: PROJECT_ERRORS.language });
    expect(parseProjectInput({ name: 'x', platforms: ['facebook', 'myspace'] })).toEqual({ error: PROJECT_ERRORS.platforms });
    expect(parseProjectInput({ name: 'x', status: 'deleted' }, { partial: true })).toEqual({ error: PROJECT_ERRORS.status });
  });

  it('refuses text that is too long or not text', () => {
    expect(parseProjectInput({ name: 'x'.repeat(121) })).toEqual({ error: PROJECT_ERRORS.tooLong });
    expect(parseProjectInput({ name: 'x', description: 'y'.repeat(4001) })).toEqual({ error: PROJECT_ERRORS.tooLong });
    expect(parseProjectInput({ name: { $gt: '' } })).toEqual({ error: PROJECT_ERRORS.name });
    expect(parseProjectInput({ name: 'x', audience: 42 })).toEqual({ error: PROJECT_ERRORS.tooLong });
  });

  it('ignores fields it does not know, such as an owner id', () => {
    expect(parseProjectInput({ name: 'x', userId: 'someone-else', id: 'forged' })).toEqual({ data: { name: 'x' } });
  });
});

describe('parseOutputInput', () => {
  it('accepts a known kind with an object payload, and measures it for the storage quota', () => {
    expect(parseOutputInput({ kind: 'landing', data: { sections: [] } })).toEqual({ kind: 'landing', data: { sections: [] }, bytes: 15 });
    expect(parseOutputInput({ kind: 'ads', data: { t: 'é' } })).toMatchObject({ bytes: 10 });
  });

  it('never lets the browser write a Meta campaign record (only the Meta routes do, from Meta’s answers)', () => {
    expect(parseOutputInput({ kind: 'meta_campaign', data: { campaignId: '1234567', adId: '1?method=delete' } })).toEqual({ error: PROJECT_ERRORS.outputKind });
  });

  it('refuses unknown kinds and non-object payloads', () => {
    expect(parseOutputInput({ kind: 'virus', data: {} })).toEqual({ error: PROJECT_ERRORS.outputKind });
    expect(parseOutputInput({ kind: 'ads', data: 'text' })).toEqual({ error: PROJECT_ERRORS.outputData });
    expect(parseOutputInput({ kind: 'ads', data: [1, 2] })).toEqual({ error: PROJECT_ERRORS.outputData });
  });

  it('refuses payloads that are too big to store', () => {
    expect(parseOutputInput({ kind: 'ads', data: { blob: 'x'.repeat(MAX_OUTPUT_BYTES) } })).toEqual({ error: PROJECT_ERRORS.outputTooBig });
  });
});
