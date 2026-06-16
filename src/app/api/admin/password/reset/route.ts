import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import AdminUser from "@/models/AdminUser";
import { sendEmail, sanitizeHeader } from "@/lib/email";
import { renderEmail } from "@/lib/emailTemplate";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import {
  normalizeEmail,
  hashOtp,
  safeHashEqual,
  hashPassword,
  OTP_MAX_ATTEMPTS,
} from "@/lib/adminAuth";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email().max(160),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(100),
});

// Verify the OTP and set a new password. Failures are deliberately vague.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`pwdreset:ip:${ip}`, 10, 15 * 60 * 1000); // 10 / 15 min
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    const raw = await req.json().catch(() => null);
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid details", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { otp, newPassword } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    await connectToDatabase();
    const admin = await AdminUser.findOne({ email });

    const invalid = () =>
      NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });

    if (!admin || !admin.resetOtpHash || !admin.resetOtpExpires) return invalid();

    // Expired → clear and reject.
    if (admin.resetOtpExpires.getTime() < Date.now()) {
      admin.resetOtpHash = "";
      admin.resetOtpExpires = null;
      admin.resetOtpAttempts = 0;
      await admin.save();
      return invalid();
    }

    // Too many wrong tries → burn the code.
    if (admin.resetOtpAttempts >= OTP_MAX_ATTEMPTS) {
      admin.resetOtpHash = "";
      admin.resetOtpExpires = null;
      admin.resetOtpAttempts = 0;
      await admin.save();
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new code." },
        { status: 400 }
      );
    }

    // Wrong code → count the attempt.
    if (!safeHashEqual(hashOtp(otp), admin.resetOtpHash)) {
      admin.resetOtpAttempts += 1;
      await admin.save();
      return invalid();
    }

    // Success → set new password, single-use the code.
    admin.passwordHash = await hashPassword(newPassword);
    admin.resetOtpHash = "";
    admin.resetOtpExpires = null;
    admin.resetOtpAttempts = 0;
    await admin.save();

    // Best-effort confirmation email (don't fail the reset if it errors).
    sendEmail({
      to: admin.email,
      subject: sanitizeHeader("Sugam Clinic - Admin Password Changed"),
      html: renderEmail({
        title: "Your password was changed",
        previewText: "Your admin password has been updated",
        bodyHtml: `
          <p style="margin:0 0 8px;">Your admin password was just changed successfully.</p>
          <p style="margin:0;">If this wasn't you, contact your administrator immediately and reset the password again.</p>
        `,
      }),
    }).catch((e) => console.error("Password-change email failed:", e));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Could not reset password." }, { status: 500 });
  }
}
