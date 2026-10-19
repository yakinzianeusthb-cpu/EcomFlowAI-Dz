import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from '../../src/lib/crypto';
import { hashPassword, verifyPassword } from '../../src/lib/password';

describe('encryptSecret / decryptSecret', () => {
  it('gives back the original value', () => {
    for (const value of ['AIzaSyExampleKey123', 'clé avec accents é à ç', 'مفتاح عربي', '', 'x'.repeat(5000)]) {
      expect(decryptSecret(encryptSecret(value))).toBe(value);
    }
  });

  it('never stores the value in the clear', () => {
    const blob = encryptSecret('super-secret-token');
    expect(blob.startsWith('enc:v1:')).toBe(true);
    expect(blob).not.toContain('super-secret-token');
  });

  it('uses a new random IV each time, so the same value encrypts differently', () => {
    expect(encryptSecret('same value')).not.toBe(encryptSecret('same value'));
  });

  it('refuses a blob that was altered (authenticated encryption)', () => {
    const [prefix, version, iv, tag, ciphertext] = encryptSecret('token').split(':');
    const flipped = Buffer.from(ciphertext, 'base64');
    flipped[0] ^= 0xff;
    expect(() => decryptSecret([prefix, version, iv, tag, flipped.toString('base64')].join(':'))).toThrow();
  });

  it('refuses a blob with the wrong authentication tag', () => {
    const [prefix, version, iv, , ciphertext] = encryptSecret('token').split(':');
    const wrongTag = Buffer.alloc(16, 1).toString('base64');
    expect(() => decryptSecret([prefix, version, iv, wrongTag, ciphertext].join(':'))).toThrow();
  });

  it('refuses values that are not in the encrypted format', () => {
    expect(() => decryptSecret('plain text')).toThrow('Unknown secret format');
    expect(() => decryptSecret('enc:v2:a:b:c')).toThrow('Unknown secret format');
    expect(() => decryptSecret('enc:v1:only:three')).toThrow('Unknown secret format');
  });
});

describe('isEncryptedSecret', () => {
  it('recognises encrypted blobs only', () => {
    expect(isEncryptedSecret(encryptSecret('x'))).toBe(true);
    expect(isEncryptedSecret('plain')).toBe(false);
    expect(isEncryptedSecret('')).toBe(false);
    expect(isEncryptedSecret(null)).toBe(false);
    expect(isEncryptedSecret(undefined)).toBe(false);
  });
});

describe('maskSecret', () => {
  it('shows only the ends of a long secret', () => {
    expect(maskSecret('abcdefghijklmnop')).toBe('abc••••••••nop');
  });

  it('hides a short secret completely', () => {
    expect(maskSecret('short')).toBe('••••••••');
    expect(maskSecret('12345678')).toBe('••••••••');
  });

  it('returns null when nothing is set', () => {
    expect(maskSecret(null)).toBeNull();
    expect(maskSecret(undefined)).toBeNull();
    expect(maskSecret('')).toBeNull();
  });
});

describe('hashPassword / verifyPassword', () => {
  it('accepts the right password and rejects any other', () => {
    const stored = hashPassword('correct horse battery staple');
    expect(verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(verifyPassword('correct horse battery stapl', stored)).toBe(false);
    expect(verifyPassword('', stored)).toBe(false);
  });

  it('stores a random salt, so the same password hashes differently each time', () => {
    const a = hashPassword('same password');
    const b = hashPassword('same password');
    expect(a).not.toBe(b);
    expect(verifyPassword('same password', a)).toBe(true);
    expect(verifyPassword('same password', b)).toBe(true);
  });

  it('never contains the password', () => {
    expect(hashPassword('hunter2-unique-marker')).not.toContain('hunter2-unique-marker');
  });

  it('handles Unicode passwords', () => {
    const stored = hashPassword('كلمة سر قوية 123');
    expect(verifyPassword('كلمة سر قوية 123', stored)).toBe(true);
    expect(verifyPassword('كلمة سر قوية 124', stored)).toBe(false);
  });

  it('rejects malformed stored values instead of throwing', () => {
    expect(verifyPassword('anything', '')).toBe(false);
    expect(verifyPassword('anything', 'nocolon')).toBe(false);
    expect(verifyPassword('anything', ':onlyhash')).toBe(false);
    expect(verifyPassword('anything', 'onlysalt:')).toBe(false);
  });
});
