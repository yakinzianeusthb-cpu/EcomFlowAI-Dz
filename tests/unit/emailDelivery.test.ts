import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// email.ts reads its settings from the environment when it loads, so each test sets the environment first
// and then loads a fresh copy of the module.
const sendMail = vi.fn(async () => ({}));
const createTransport = vi.fn(() => ({ sendMail }));
vi.mock('nodemailer', () => ({ default: { createTransport } }));

async function loadEmail(env: Record<string, string> = {}) {
  vi.resetModules();
  for (const key of ['RESEND_API_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM']) vi.stubEnv(key, env[key] ?? '');
  return import('../../src/lib/email');
}

describe('email delivery', () => {
  beforeEach(() => {
    sendMail.mockClear();
    createTransport.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  describe('provider choice', () => {
    it('is the console when nothing is configured', async () => {
      expect((await loadEmail()).getEmailProviderLabel()).toBe('console');
    });

    it('is SMTP when a host is set', async () => {
      expect((await loadEmail({ SMTP_HOST: 'smtp.example.com' })).getEmailProviderLabel()).toBe('smtp');
    });

    it('prefers Resend over SMTP when both are set', async () => {
      expect((await loadEmail({ RESEND_API_KEY: 're_123', SMTP_HOST: 'smtp.example.com' })).getEmailProviderLabel()).toBe('resend');
    });
  });

  describe('console mode (development)', () => {
    it('does not send anything and reports a dev delivery', async () => {
      const { sendOtpEmail, sendContactEmail } = await loadEmail();
      expect(await sendOtpEmail('a@b.co', '123456')).toEqual({ dev: true, provider: 'console' });
      expect(await sendContactEmail('admin@b.co', { fromName: 'Sara', fromEmail: 's@b.co', subject: 'Hi', message: 'Hello' })).toEqual({ dev: true, provider: 'console' });
      expect(createTransport).not.toHaveBeenCalled();
    });

    it('prints the code so the flow can be tested without an email account', async () => {
      const log = vi.spyOn(console, 'log');
      const { sendOtpEmail } = await loadEmail();
      await sendOtpEmail('a@b.co', '654321');
      expect(log.mock.calls.flat().join('\n')).toContain('654321');
    });
  });

  describe('Resend', () => {
    const okResponse = { ok: true, text: async () => '' };

    it('posts the verification email with the code in the subject and the body', async () => {
      const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => okResponse);
      vi.stubGlobal('fetch', fetchMock);
      const { sendOtpEmail } = await loadEmail({ RESEND_API_KEY: 're_123', EMAIL_FROM: 'Shop <no-reply@shop.dz>' });

      const result = await sendOtpEmail('user@b.co', '482915', { expiresMinutes: 15 });

      expect(result).toEqual({ deliveredTo: 'user@b.co', dev: false, provider: 'resend' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_123');
      const payload = JSON.parse(init.body as string);
      expect(payload).toMatchObject({ from: 'Shop <no-reply@shop.dz>', to: 'user@b.co' });
      expect(payload.subject).toContain('482915');
      expect(payload.html).toContain('482915');
      expect(payload.html).toContain('15 minutes');
    });

    it('changes the wording for a password reset and for a login code', async () => {
      const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => okResponse);
      vi.stubGlobal('fetch', fetchMock);
      const { sendOtpEmail } = await loadEmail({ RESEND_API_KEY: 're_123' });

      await sendOtpEmail('u@b.co', '111111', { reason: 'password_reset' });
      await sendOtpEmail('u@b.co', '222222', { reason: 'login' });

      const subjects = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body as string).subject as string);
      expect(subjects[0]).toContain('mot de passe');
      expect(subjects[0]).not.toContain('111111');
      expect(subjects[1]).toContain('connexion');
      expect(subjects[1]).toContain('222222');
    });

    it('throws with the provider status when Resend refuses', async () => {
      vi.stubGlobal('fetch', async () => ({ ok: false, status: 422, text: async () => 'invalid sender' }));
      const { sendOtpEmail } = await loadEmail({ RESEND_API_KEY: 're_123' });
      await expect(sendOtpEmail('u@b.co', '123456')).rejects.toThrow('Resend failed (422): invalid sender');
    });

    it('sends the contact message with escaped content and a clean subject', async () => {
      const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => okResponse);
      vi.stubGlobal('fetch', fetchMock);
      const { sendContactEmail } = await loadEmail({ RESEND_API_KEY: 're_123' });

      await sendContactEmail('admin@b.co', { fromName: 'Eve\r\nBcc: x@y.z', fromEmail: 'e@b.co', subject: 'Help', message: '<script>1</script>' });

      const payload = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(payload.to).toBe('admin@b.co');
      expect(payload.subject).not.toMatch(/[\r\n]/);
      expect(payload.html).toContain('&lt;script&gt;');
      expect(payload.html).not.toContain('<script>');
    });

    it('throws when Resend refuses a contact message too', async () => {
      vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, text: async () => 'boom' }));
      const { sendContactEmail } = await loadEmail({ RESEND_API_KEY: 're_123' });
      await expect(sendContactEmail('a@b.co', { fromName: 'A', fromEmail: 'a@b.co', subject: 'S', message: 'M' })).rejects.toThrow('Resend failed (500): boom');
    });
  });

  describe('SMTP', () => {
    it('builds the transport from the settings and sends the code', async () => {
      const { sendOtpEmail } = await loadEmail({ SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_SECURE: 'true', SMTP_USER: 'robot', SMTP_PASS: 'pw', EMAIL_FROM: 'Shop <no-reply@shop.dz>' });

      const result = await sendOtpEmail('user@b.co', '135790');

      expect(result).toEqual({ deliveredTo: 'user@b.co', dev: false, provider: 'smtp' });
      expect(createTransport).toHaveBeenCalledWith({ host: 'smtp.example.com', port: 465, secure: true, auth: { user: 'robot', pass: 'pw' } });
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ from: 'Shop <no-reply@shop.dz>', to: 'user@b.co' }));
    });

    it('does not send credentials when none are configured, and defaults to port 587', async () => {
      const { sendContactEmail } = await loadEmail({ SMTP_HOST: 'smtp.example.com' });

      await sendContactEmail('admin@b.co', { fromName: 'A', fromEmail: 'a@b.co', subject: 'S', message: 'M' });

      expect(createTransport).toHaveBeenCalledWith({ host: 'smtp.example.com', port: 587, secure: false, auth: undefined });
      expect(sendMail).toHaveBeenCalledOnce();
    });
  });
});
