/**
 * Shared, brand-consistent email template.
 *
 * Uses table-based layout + inline styles (the only thing that renders reliably
 * across Gmail / Outlook / Apple Mail). All dynamic text MUST be passed through
 * `esc()` / `nl2br()` before being placed in `bodyHtml`.
 */

const CLINIC_NAME = "Sugam Child & Gastro Care Clinic";
const CLINIC_TAGLINE = "Premium Pediatric, Neonatal & Gastroenterology Care";
const CLINIC_PHONE = process.env.ADMIN_PHONE || "+91 73582 93645";
const CLINIC_EMAIL = process.env.EMAIL_FROM || "contact@sugamclinic.com";

// Brand palette (kept in sync with the site / tailwind config).
const TEAL = "#12B2A6";
const TEAL_DARK = "#0C8D84";
const TEAL_TINT = "#E7F6F4";
const INK = "#20262E";
const MUTED = "#5B6470";
const CREAM = "#FFFCEF";
const BORDER = "#F0ECEF";

/** HTML-escape untrusted text before embedding in email HTML. */
export const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Escape + preserve line breaks. */
export const nl2br = (s: unknown) => esc(s).replace(/\n/g, "<br/>");

/** A label/value row for detail blocks. `value` is treated as plain text. */
export const infoRow = (label: string, value: unknown) => `
  <tr>
    <td style="padding:6px 0;font-size:13px;color:${MUTED};width:140px;vertical-align:top;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:13px;color:${INK};font-weight:600;vertical-align:top;">${esc(value)}</td>
  </tr>`;

/** Wrap rows from `infoRow` into a bordered card. */
export const infoTable = (rows: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${rows}</table>`;

/** A highlighted quote/reference block (e.g. the visitor's original message). */
export const quoteBlock = (heading: string, html: string) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:${TEAL_TINT};border-left:4px solid ${TEAL};border-radius:8px;padding:14px 16px;">
        <div style="font-size:11px;font-weight:bold;color:${TEAL_DARK};text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;">${esc(heading)}</div>
        <div style="font-size:13px;color:${MUTED};line-height:1.6;">${html}</div>
      </td>
    </tr>
  </table>`;

type RenderEmailOpts = {
  title: string; // body heading
  bodyHtml: string; // main content (already escaped where needed)
  previewText?: string; // inbox preview snippet
  footerNote?: string; // optional small print above contact footer
};

export function renderEmail({ title, bodyHtml, previewText, footerNote }: RenderEmailOpts): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
  ${
    previewText
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(previewText)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${TEAL};padding:24px 28px;">
              <div style="font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:-0.01em;">${esc(CLINIC_NAME)}</div>
              <div style="font-size:12px;color:${TEAL_TINT};margin-top:4px;">${esc(CLINIC_TAGLINE)}</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px;font-size:18px;line-height:1.3;color:${INK};">${esc(title)}</h1>
              <div style="font-size:14px;line-height:1.65;color:${INK};">${bodyHtml}</div>
            </td>
          </tr>

          ${
            footerNote
              ? `<tr><td style="padding:0 28px 8px;font-size:12px;color:${MUTED};">${esc(footerNote)}</td></tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="padding:18px 28px;background:#F8FAFA;border-top:1px solid ${BORDER};">
              <div style="font-size:13px;font-weight:bold;color:${INK};">${esc(CLINIC_NAME)}</div>
              <div style="font-size:12px;color:${MUTED};margin-top:4px;">
                Phone: ${esc(CLINIC_PHONE)} &nbsp;&bull;&nbsp; Email: ${esc(CLINIC_EMAIL)}
              </div>
              <div style="font-size:11px;color:${MUTED};margin-top:8px;">
                This is an automated message from ${esc(CLINIC_NAME)}. Please do not share sensitive medical details by email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
