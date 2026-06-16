// One-off admin recovery for production.
//
// Recreates (or repairs) the single admin account directly in MongoDB:
//   - sets the password hash from ADMIN_PASSWORD,
//   - clears any account lockout (lockUntil / loginAttempts),
//   - clears any pending password-reset OTP state.
//
// Use when admin login fails in production (locked account, stale password
// hash, or the prod DB's admin row drifted from your env credentials) and the
// email-based reset isn't usable.
//
// Run locally, pointed at the PRODUCTION database:
//
//   MONGODB_URI="<prod uri>" ADMIN_EMAIL="you@x.com" ADMIN_PASSWORD="newpass" \
//     node scripts/reset-admin.mjs
//
// Or, if your local .env already holds the production values:
//
//   node scripts/reset-admin.mjs
//
// (It auto-loads .env from the project root if present.)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

// Minimal .env loader (no dependency). Existing process.env wins.
function loadDotEnv() {
  const envPath = path.join(projectRoot, ".env");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!MONGODB_URI) fail("MONGODB_URI is not set.");
if (!ADMIN_EMAIL) fail("ADMIN_EMAIL is not set.");
if (!ADMIN_PASSWORD) fail("ADMIN_PASSWORD is not set.");

const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetOtpHash: { type: String, default: "" },
    resetOtpExpires: { type: Date, default: null },
    resetOtpAttempts: { type: Number, default: 0 },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

const AdminUser =
  mongoose.models.AdminUser || mongoose.model("AdminUser", AdminUserSchema);

async function main() {
  console.log(`Connecting to MongoDB…`);
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const result = await AdminUser.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        email: ADMIN_EMAIL,
        passwordHash,
        loginAttempts: 0,
        lockUntil: null,
        resetOtpHash: "",
        resetOtpExpires: null,
        resetOtpAttempts: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`\n✔ Admin account ready for: ${result.email}`);
  console.log(`  - password set from ADMIN_PASSWORD`);
  console.log(`  - lockout cleared (loginAttempts=0, lockUntil=null)`);
  console.log(`  - pending reset OTP cleared`);
  console.log(`\nYou can now log in with ADMIN_EMAIL / ADMIN_PASSWORD.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("\n✖ Reset failed:", err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
