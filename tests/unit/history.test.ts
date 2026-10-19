import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const create = vi.fn(async () => ({}));
const remove = vi.fn(async () => ({}));
const clear = vi.fn(async () => ({}));
vi.mock('../../src/services/api', () => ({ historyApi: { create, delete: remove, clear } }));

const { addToHistory, clearHistory, deleteHistoryItem, getHistory } = await import('../../src/lib/history');

const KEY = 'dzads_generation_history';
let store: Record<string, string>;
const events: Array<{ type: string; detail: unknown }> = [];

beforeEach(() => {
  store = {};
  events.length = 0;
  create.mockClear(); remove.mockClear(); clear.mockClear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  });
  vi.stubGlobal('window', { dispatchEvent: (event: CustomEvent) => { events.push({ type: event.type, detail: event.detail }); return true; } });
  vi.stubGlobal('CustomEvent', class { type: string; detail: unknown; constructor(type: string, init: { detail: unknown }) { this.type = type; this.detail = init.detail; } });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('generation history', () => {
  it('starts empty', () => {
    expect(getHistory()).toEqual([]);
  });

  it('adds an item at the top and keeps it on this device and on the server', () => {
    const updated = addToHistory('script', 'Hachoir', { scenes: [] }, 'preview', { brand: 'X' });

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ type: 'script', title: 'Hachoir', previewText: 'preview', payload: { scenes: [] }, metadata: { brand: 'X' } });
    expect(updated[0].id).toMatch(/^script-\d+-/);
    expect(getHistory()).toEqual(updated);
    expect(create).toHaveBeenCalledWith({ type: 'script', title: 'Hachoir', previewText: 'preview', payload: { scenes: [] }, metadata: { brand: 'X' } });
  });

  it('names an untitled item "Sans Titre"', () => {
    expect(addToHistory('image', '', {})[0].title).toBe('Sans Titre');
  });

  it('puts the newest first and keeps only the ten latest', () => {
    for (let i = 1; i <= 12; i++) addToHistory('landing_page', `LP ${i}`, {});
    const history = getHistory();
    expect(history).toHaveLength(10);
    expect(history[0].title).toBe('LP 12');
    expect(history[9].title).toBe('LP 3');
  });

  it('tells listeners the history changed', () => {
    addToHistory('script', 'A', {});
    expect(events.map((e) => e.type)).toEqual(['dzads_history_updated']);
    expect((events[0].detail as unknown[]).length).toBe(1);
  });

  it('deletes one item here and on the server', () => {
    const [first] = addToHistory('script', 'A', {});
    addToHistory('script', 'B', {});

    const remaining = deleteHistoryItem(first.id);

    expect(remaining.map((item) => item.title)).toEqual(['B']);
    expect(getHistory().map((item) => item.title)).toEqual(['B']);
    expect(remove).toHaveBeenCalledWith(first.id);
  });

  it('clears everything here and on the server', () => {
    addToHistory('script', 'A', {});
    clearHistory();
    expect(getHistory()).toEqual([]);
    expect(clear).toHaveBeenCalledOnce();
    expect(events.at(-1)).toEqual({ type: 'dzads_history_updated', detail: [] });
  });

  it('survives corrupted local data by starting again from nothing', () => {
    store[KEY] = '{not json';
    expect(getHistory()).toEqual([]);
    expect(addToHistory('script', 'Fresh', {})).toHaveLength(1);
  });

  it('keeps working when the server cannot be reached', async () => {
    create.mockRejectedValueOnce(new Error('offline'));
    expect(addToHistory('script', 'Offline', {})).toHaveLength(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(getHistory()).toHaveLength(1);
    expect(console.error).toHaveBeenCalled();
  });
});
