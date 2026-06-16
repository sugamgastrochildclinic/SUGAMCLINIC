// Admin credential + password-reset helpers. Centralises the DB-backed auth so
// the NextAuth provider and the reset endpoints share one source of truth.
//
// Bootstrap model: the canonical admin is identified by env ADMIN_EMAIL. On the
// very first successful login (or first OTP request) an AdminUser row is created
// with the env password hashed. From then on the DB row is authoritative, so a
// reset can change the password without touching the environment.

import bcrypt from "bcryptjs";
import crypto from "crypto";
import AdminUser from "@/models/AdminUser";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SECRET = process.env.NEXTAUTH_SECRET || "";

const BCRYPT_ROUNDS = 10;
export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;

export function normalizeEmail(email: unknown): string {
  return String(email ?? "").toLowerCase().trim();
}

/** True only for the single canonical admin address from the environment. */
export function isAdminEmail(email: unknown): boolean {
  return !!ADMIN_EMAIL && normalizeEmail(email) === ADMIN_EMAIL;
}

/** Find the admin row, creating it from the env credentials if it doesn't exist. */
export async function ensureAdminUser() {
  let admin = await AdminUser.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    admin = await AdminUser.create({ email: ADMIN_EMAIL, passwordHash });
  }
  return admin;
}

/**
 * Verify a login. DB row (if present) is authoritative; otherwise fall back to
 * the env credentials once and persist them, so existing deployments keep
 * working with no manual step.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const e = normalizeEmail(email);
  const admin = await AdminUser.findOne({ email: e });

  if (admin) {
    if (admin.lockUntil && admin.lockUntil > new Date()) {
      throw new Error("Account is locked. Try again in 30 minutes.");
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    
    if (!isMatch) {
      admin.loginAttempts = (admin.loginAttempts || 0) + 1;
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 mins
      }
      await admin.save();
      return false;
    }

    // Success: reset attempts
    if (admin.loginAttempts > 0 || admin.lockUntil) {
      admin.loginAttempts = 0;
      admin.lockUntil = null;
      await admin.save();
    }

    return true;
  }

  // No DB row yet → bootstrap from environment.
  if (e === ADMIN_EMAIL && !!ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
    await ensureAdminUser();
    return true;
  }
  return false;
}

/** 6-digit numeric one-time code, cryptographically random. */
export function generateOtp(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Hash an OTP (peppered with the app secret) for storage / comparison. */
export function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(`${otp}:${SECRET}`).digest("hex");
}

/** Constant-time comparison of two hex hashes. */
export function safeHashEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a || "", "hex");
  const bb = Buffer.from(b || "", "hex");
  if (ba.length === 0 || ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Set a new password hash on an admin document (does not save). */
export async function hashPassword(newPassword: string): Promise<string> {
  return bcrypt.hash(newPassword, BCRYPT_ROUNDS);
}
