// Standalone patient backfill — CLI alternative to the admin API route
// (/api/admin/migrate-patients). Self-contained so it can run with a bare
// `node` outside the Next.js build (e.g. a one-off ops task / cron).
//
// Usage:
//   MONGODB_URI="mongodb+srv://..." node scripts/migrate-patients.mjs
//   MONGODB_URI="..." node scripts/migrate-patients.mjs --rollback
//
// Behaviour mirrors src/lib/patientMigration.ts exactly: idempotent, no data
// loss, dedup by digits-only phone, rollback-safe.

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

const ROLLBACK = process.argv.includes("--rollback");

const normalizePhone = (phone) => String(phone ?? "").replace(/\D/g, "");

// Minimal schemas — must match the app's field names. `strict: false` keeps any
// existing appointment fields we don't model here intact.
const Appointment = mongoose.model(
  "Appointment",
  new mongoose.Schema(
    { name: String, phone: String, email: String, date: String, patient: mongoose.Schema.Types.ObjectId },
    { strict: false, timestamps: true }
  )
);
const Patient = mongoose.model(
  "Patient",
  new mongoose.Schema(
    {
      patientId: { type: String, unique: true },
      name: String,
      phone: String,
      phoneKey: { type: String, unique: true },
      email: String,
      dateOfBirth: String,
      gender: String,
      totalVisits: { type: Number, default: 0 },
      lastVisitDate: String,
      lastVisitReason: String,
    },
    { timestamps: true }
  )
);
const Counter = mongoose.model(
  "Counter",
  new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } })
);

async function nextPatientId() {
  const c = await Counter.findByIdAndUpdate("patientId", { $inc: { seq: 1 } }, { new: true, upsert: true });
  return "PAT" + String(c.seq).padStart(4, "0");
}

async function rollback() {
  const res = await Appointment.updateMany({ patient: { $ne: null } }, { $set: { patient: null } });
  await Patient.collection.drop().catch(() => {});
  await Counter.collection.drop().catch(() => {});
  console.log(`Rolled back. Unlinked ${res.modifiedCount ?? 0} appointment(s); dropped patients + counter.`);
}

async function migrate() {
  const appts = await Appointment.find()
    .select("_id name phone email date patient visitReason")
    .sort({ date: 1, createdAt: 1 })
    .lean();

  const groups = new Map();
  let skippedNoPhone = 0;

  for (const a of appts) {
    const phoneKey = normalizePhone(a.phone);
    if (!phoneKey) {
      skippedNoPhone++;
      continue;
    }
    const g = groups.get(phoneKey);
    if (g) {
      g.apptIds.push(a._id);
      g.name = a.name || g.name;
      g.email = a.email || g.email;
      g.phone = a.phone || g.phone;
      if ((a.date || "") >= g.maxDate) {
        g.maxDate = a.date || g.maxDate;
        if (a.visitReason) g.lastReason = a.visitReason;
      }
    } else {
      groups.set(phoneKey, {
        name: a.name || "",
        email: a.email || "",
        phone: a.phone || "",
        maxDate: a.date || "",
        lastReason: a.visitReason || "",
        apptIds: [a._id],
      });
    }
  }

  let created = 0,
    updated = 0,
    linked = 0;

  for (const [phoneKey, g] of groups) {
    let patient = await Patient.findOne({ phoneKey });
    if (!patient) {
      const patientId = await nextPatientId();
      patient = await Patient.create({
        patientId,
        name: g.name,
        phone: g.phone,
        phoneKey,
        email: g.email,
        totalVisits: g.apptIds.length,
        lastVisitDate: g.maxDate,
        lastVisitReason: g.lastReason,
      });
      created++;
    } else {
      patient.totalVisits = g.apptIds.length;
      patient.lastVisitDate = g.maxDate;
      if (g.lastReason) patient.lastVisitReason = g.lastReason;
      if (!patient.name && g.name) patient.name = g.name;
      if (!patient.email && g.email) patient.email = g.email;
      await patient.save();
      updated++;
    }
    const r = await Appointment.updateMany({ _id: { $in: g.apptIds } }, { $set: { patient: patient._id } });
    linked += r.modifiedCount ?? 0;
  }

  console.log(
    `Done. Scanned ${appts.length} appointment(s); ${created} patient(s) created, ` +
      `${updated} updated, ${linked} linked, ${skippedNoPhone} skipped (no phone).`
  );
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  try {
    if (ROLLBACK) await rollback();
    else await migrate();
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
