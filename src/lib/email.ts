import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const host = process.env.EMAIL_SERVER_HOST;
const port = parseInt(process.env.EMAIL_SERVER_PORT || "587");
const user = process.env.EMAIL_SERVER_USER;
// Gmail App Passwords are shown as "xxxx xxxx xxxx xxxx" but the real value has
// no spaces. Pasting the spaced form into .env makes SMTP auth fail silently —
// strip whitespace defensively (SMTP credentials never contain spaces).
const pass = (process.env.EMAIL_SERVER_PASSWORD || "").replace(/\s+/g, "");
const from = process.env.EMAIL_FROM || "noreply@sugamclinic.com";

// Strip CR/LF (and clamp length) from any user-controlled value placed into an
// email header such as the Subject — prevents SMTP header injection.
export function sanitizeHeader(value: string, maxLen = 200): string {
  return (value || "").replace(/[\r\n]+/g, " ").trim().slice(0, maxLen);
}

// Reuse a single pooled transporter instead of opening a fresh SMTP connection
// on every send (the booking flow fires two emails at once).
let cachedTransporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  console.log(`Sending email to ${to} with subject "${subject}"`);

  if (!host || !user || !pass) {
    console.warn("SMTP settings missing in environment. Email logged to console.");
    return { success: true, logged: true };
  }

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
