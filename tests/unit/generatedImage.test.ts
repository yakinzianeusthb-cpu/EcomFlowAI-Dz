import { describe, expect, it } from 'vitest';
import { finalImage } from '../../src/lib/generatedImage';

const image = (data: string, extra: Record<string, unknown> = {}) => ({ inlineData: { data, mimeType: 'image/png' }, ...extra });

describe('finalImage', () => {
  it('returns the image of the answer as a data URL, with its own type', () => {
    expect(finalImage([{ content: { parts: [{ text: 'Voici' }, { inlineData: { data: 'AAA', mimeType: 'image/jpeg' } }] } }])).toBe('data:image/jpeg;base64,AAA');
  });

  it('skips the draft images a thinking model sends before the final one', () => {
    const parts = [image('DRAFT1', { thought: true }), image('DRAFT2', { thought: true }), image('FINAL')];
    expect(finalImage([{ content: { parts } }])).toBe('data:image/png;base64,FINAL');
  });

  it('takes the last image when there are several finished ones', () => {
    expect(finalImage([{ content: { parts: [image('ONE')] } }, { content: { parts: [image('TWO')] } }])).toBe('data:image/png;base64,TWO');
  });

  it('falls back to the last draft when the answer has only drafts', () => {
    expect(finalImage([{ content: { parts: [image('D1', { thought: true }), image('D2', { thought: true })] } }])).toBe('data:image/png;base64,D2');
  });

  it('assumes PNG when Google gives no type', () => {
    expect(finalImage([{ content: { parts: [{ inlineData: { data: 'AAA' } }] } }])).toBe('data:image/png;base64,AAA');
  });

  it('returns null when the answer has no image (text only, empty, or missing)', () => {
    expect(finalImage([{ content: { parts: [{ text: 'I cannot draw that.' }] } }])).toBeNull();
    expect(finalImage([{ content: { parts: [{ inlineData: { data: '' } }] } }])).toBeNull();
    expect(finalImage([])).toBeNull();
    expect(finalImage(undefined)).toBeNull();
  });
});
