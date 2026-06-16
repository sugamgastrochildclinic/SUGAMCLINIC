import mongoose, { Schema } from "mongoose";

// Admin account, DB-backed so the password can be CHANGED at runtime (the env
// ADMIN_EMAIL/ADMIN_PASSWORD only bootstrap the first record — see
// lib/adminAuth.ts). Holds the short-lived password-reset OTP state.
const AdminUserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    // Password-reset OTP. Only a HASH of the code is stored; it is single-use
    // and time-boxed. Cleared on success / expiry / too many attempts.
    resetOtpHash: { type: String, default: "" },
    resetOtpExpires: { type: Date, default: null },
    resetOtpAttempts: { type: Number, default: 0 },

    // Rate-limiting and lockout
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

// See Appointment.ts: drop the cached model in dev so schema edits apply on hot
// reload without a full server restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.AdminUser) {
  mongoose.deleteModel("AdminUser");
}

export default mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);
