/**
 * OTP email delivery.
 *
 * Provider selection (first match wins):
 *   1. RESEND_API_KEY  → send via the Resend HTTP API (no dependency).
 *   2. SMTP_* env vars → send via nodemailer (SMTP_HOST required).
 *   3. otherwise       → "console" dev mode: logs the code to the server
 *                        console so the flow is testable without any email
 *                        account. The response then includes `dev: true`.
 */
import { escapeHtml, stripControlChars } from "./html";

// nodemailer is only needed when SMTP is configured, so it is loaded on first use.

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "EcomFlow AI <no-reply@ecomflow.ai>";

export function getEmailProviderLabel(): string {
  if (RESEND_API_KEY) return "resend";
  if (SMTP_HOST) return "smtp";
  return "console";
}

function otpHtml(code: string, expiresMinutes: number, reason: string): string {
  const heading = reason === "password_reset" ? "Réinitialisation" : "Vérification";
  return `
  <div style="background:#0b0c0a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:440px;margin:0 auto;background:#121411;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
      <div style="font-size:28px;text-align:center;">🛍️</div>
      <h1 style="text-align:center;font-size:20px;color:#ffffff;margin:12px 0 4px;">EcomFlow AI — ${heading}</h1>
      <p style="text-align:center;color:#94a3b8;font-size:14px;margin:0 0 24px;">
        Utilise ce code pour finaliser ta connexion.
      </p>
      <div style="text-align:center;font-size:40px;font-weight:bold;letter-spacing:12px;color:#c9a45c;background:rgba(201,164,92,0.08);border:1px dashed rgba(201,164,92,0.4);border-radius:14px;padding:18px 12px;">
        ${code}
      </div>
      <p style="text-align:center;color:#64748b;font-size:12px;margin:20px 0 0;">
        Ce code expire dans <b style="color:#d8b878;">${expiresMinutes} minutes</b>.<br/>
        Si tu n'es pas à l'origine de cette demande, ignore cet email.
      </p>
    </div>
  </div>`;
}

export interface SendResult {
  deliveredTo?: string;
  dev: boolean;
  provider: string;
}

export async function sendOtpEmail(
  to: string,
  code: string,
  opts: { expiresMinutes?: number; reason?: string } = {},
): Promise<SendResult> {
  const expiresMinutes = opts.expiresMinutes || 10;
  const reason = opts.reason || "verification";
  const html = otpHtml(code, expiresMinutes, reason);
  const subject =
    reason === "password_reset"
      ? `🔑 Réinitialise ton mot de passe — EcomFlow AI`
      : reason === "login"
      ? `🔐 Ton code de connexion EcomFlow AI : ${code}`
      : `✅ Confirme ton email EcomFlow AI : ${code}`;

  // 1. Resend
  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed (${res.status}): ${body}`);
    }
    return { deliveredTo: to, dev: false, provider: "resend" };
  }

  // 2. SMTP
  if (SMTP_HOST) {
    const { default: nodemailer } = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { deliveredTo: to, dev: false, provider: "smtp" };
  }

  // 3. Console (dev)
  console.log("──────────────────────────────────────────────");
  console.log(`[EMAIL:DEV] ${reason.toUpperCase()} OTP for ${to}`);
  console.log(`[EMAIL:DEV] Code: ${code} (expires in ${expiresMinutes} min)`);
  console.log("──────────────────────────────────────────────");
  return { dev: true, provider: "console" };
}

// ---------------------------------------------------------------------------
// Contact form email
// ---------------------------------------------------------------------------

/** Subject line of the mail the admin receives. Control characters are stripped so a visitor cannot add headers. */
export function contactSubject(subject: string, fromName: string): string {
  return `[EcomFlow AI] ${stripControlChars(subject)} — ${stripControlChars(fromName)}`;
}

/** Every value comes from the contact form, so all of it is escaped before it reaches the HTML. */
export function contactHtml(fromName: string, fromEmail: string, subject: string, message: string): string {
  const name = escapeHtml(fromName);
  const email = escapeHtml(fromEmail);
  const safeSubject = escapeHtml(subject);
  const body = escapeHtml(message);
  return `
  <div style="background:#0b0c0a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#121411;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:32px;color:#e2e8f0;">
      <div style="font-size:28px;text-align:center;">💬</div>
      <h1 style="text-align:center;font-size:20px;color:#ffffff;margin:12px 0 4px;">Nouveau message de contact</h1>
      <p style="text-align:center;color:#94a3b8;font-size:14px;margin:0 0 24px;">
        Un utilisateur t'a envoyé un message via EcomFlow AI.
      </p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><b style="color:#c9a45c;">De :</b> ${name} &lt;${email}&gt;</p>
        <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;"><b style="color:#c9a45c;">Sujet :</b> ${safeSubject}</p>
        <p style="margin:0;font-size:13px;color:#94a3b8;"><b style="color:#c9a45c;">Message :</b></p>
        <p style="margin:8px 0 0;font-size:14px;color:#e2e8f0;white-space:pre-wrap;line-height:1.6;">${body}</p>
      </div>
      <p style="text-align:center;color:#64748b;font-size:11px;margin:0;">
        Envoyé depuis le tableau de bord EcomFlow AI.
      </p>
    </div>
  </div>`;
}

export async function sendContactEmail(
  to: string,
  opts: { fromName: string; fromEmail: string; subject: string; message: string },
): Promise<SendResult> {
  const html = contactHtml(opts.fromName, opts.fromEmail, opts.subject, opts.message);
  const subject = contactSubject(opts.subject, opts.fromName);

  // 1. Resend
  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend failed (${res.status}): ${body}`);
    }
    return { deliveredTo: to, dev: false, provider: "resend" };
  }

  // 2. SMTP
  if (SMTP_HOST) {
    const { default: nodemailer } = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    return { deliveredTo: to, dev: false, provider: "smtp" };
  }

  // 3. Console (dev)
  console.log("──────────────────────────────────────────────");
  console.log(`[EMAIL:DEV] CONTACT from ${opts.fromName} <${opts.fromEmail}>`);
  console.log(`[EMAIL:DEV] Subject: ${opts.subject}`);
  console.log(`[EMAIL:DEV] Message: ${opts.message}`);
  console.log("──────────────────────────────────────────────");
  return { dev: true, provider: "console" };
}
