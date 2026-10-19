import { describe, expect, it } from 'vitest';
import { escapeHtml, stripControlChars } from '../../src/lib/html';
import { contactHtml, contactSubject } from '../../src/lib/email';

describe('escapeHtml', () => {
  it('escapes the characters that can open a tag or an attribute', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  });

  it('leaves ordinary text, accents and Arabic untouched', () => {
    expect(escapeHtml('Bonjour, ça va ? مرحبا 123')).toBe('Bonjour, ça va ? مرحبا 123');
  });

  it('turns null, undefined and numbers into text instead of throwing', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });

  it('does not double-escape when called once per value', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });
});

describe('stripControlChars', () => {
  it('removes line breaks and other control characters that could inject mail headers', () => {
    expect(stripControlChars('Hello\r\nBcc: evil@x.co')).toBe('Hello Bcc: evil@x.co');
    expect(stripControlChars('a\u0000b\u0007c')).toBe('a b c');
  });

  it('trims and tolerates non-strings', () => {
    expect(stripControlChars('  spaced  ')).toBe('spaced');
    expect(stripControlChars(undefined)).toBe('');
  });
});

describe('contactHtml', () => {
  const html = contactHtml('<img src=x onerror=alert(1)>', 'a@b.co', '<b>urgent</b>', '<script>alert(1)</script>\nsecond line');

  it('never lets user input become markup', () => {
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>urgent</b>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('keeps the message layout and the sender address', () => {
    expect(html).toContain('second line');
    expect(html).toContain('a@b.co');
  });
});

describe('contactSubject', () => {
  it('builds the mail subject without line breaks', () => {
    expect(contactSubject('Problème\r\nBcc: x@y.z', 'Ahmed')).toBe('[EcomFlow AI] Problème Bcc: x@y.z — Ahmed');
  });
});
