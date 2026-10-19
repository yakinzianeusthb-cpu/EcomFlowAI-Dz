import { describe, expect, it } from 'vitest';
import { unwrapSingleObject } from '../../src/lib/aiJson';

describe('unwrapSingleObject', () => {
  it('returns an object unchanged', () => {
    const page = { title: 'Structure', sections: [{ title: 'Hero' }] };
    expect(unwrapSingleObject(page)).toBe(page);
  });

  it('takes the object out of a one-item array, which is how Gemini sometimes answers', () => {
    const page = { title: 'Structure', sections: [{ title: 'Hero' }] };
    expect(unwrapSingleObject([page])).toBe(page);
  });

  it('takes the first object when the array holds several', () => {
    const first = { title: 'A' };
    expect(unwrapSingleObject([first, { title: 'B' }])).toBe(first);
  });

  it('leaves arrays of non-objects and empty arrays alone, so callers still see an invalid answer', () => {
    expect(unwrapSingleObject([])).toEqual([]);
    expect(unwrapSingleObject(['a', 'b'])).toEqual(['a', 'b']);
    expect(unwrapSingleObject([['nested']])).toEqual([['nested']]);
  });

  it('passes empty and primitive values through', () => {
    expect(unwrapSingleObject(null)).toBeNull();
    expect(unwrapSingleObject(undefined)).toBeUndefined();
    expect(unwrapSingleObject('text')).toBe('text');
    expect(unwrapSingleObject(42)).toBe(42);
  });
});
