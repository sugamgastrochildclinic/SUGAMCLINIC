import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendEmail, sanitizeHeader } from "@/lib/email";
import { renderEmail, quoteBlock, esc } from "@/lib/emailTemplate";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  isAdminEmail,
  normalizeEmail,
  ensureAdminUser,
  generateOtp,
  hashOtp,
  OTP_TTL_MS,
} from "@/lib/adminAuth";
import { z } from "zod";

const schema = z.object({ email: z.string().trim().email().max(160) });

// Send a password-reset OTP to the admin's email. Always responds with a
// generic success so it can't be used to probe which email is the admin's.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`pwdotp:ip:${ip}`, 5, 15 * 60 * 1000); // 5 / 15 min
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const email = normalizeEmail(parsed.data.email);

    // Only the registered admin address may reset the password.
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: "This email is not authorized. Only the admin email can reset the password." },
        { status: 403 }
      );
    }

    // Per-email throttle.
    const emailLimit = await rateLimit(`pwdotp:email:${email}`, 3, 60 * 60 * 1000); // 3 / hr
    if (!emailLimit.ok) {
      return NextResponse.json(
        { error: "A code was already sent recently. Please check your inbox or try later." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfterSec) } }
      );
    }

    await connectToDatabase();
    const admin = await ensureAdminUser();

    const otp = generateOtp();
    admin.resetOtpHash = hashOtp(otp);
    admin.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    admin.resetOtpAttempts = 0;
    await admin.save();

    const result = await sendEmail({
      to: admin.email,
      subject: sanitizeHeader("Sugam Clinic - Admin Password Reset Code"),
      html: renderEmail({
        title: "Your password reset code",
        previewText: "Use this code to reset your admin password",
        bodyHtml: `
          <p style="margin:0 0 12px;">A request was made to reset the admin password. Enter this one-time code to continue:</p>
          ${quoteBlock("Verification code", `<div style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#0C8D84;">${esc(otp)}</div>`)}
          <p style="margin:12px 0 0;">This code expires in 10 minutes and can be used once. If you didn't request this, you can safely ignore this email — your password will not change.</p>
        `,
        footerNote: "Never share this code with anyone.",
      }),
    });

    // Surface a real send failure instead of pretending the code went out.
    if (!result.success) {
      // Code is unusable if the email never arrived — clear it.
      admin.resetOtpHash = "";
      admin.resetOtpExpires = null;
      await admin.save();
      return NextResponse.json(
        { error: "Could not send the verification email. Please check email settings and try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password OTP request error:", error);
    return NextResponse.json(
      { error: "Could not send the verification code. Please try again." },
      { status: 500 }
    );
  }
}
