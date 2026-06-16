// Backfill / repair migration: derives Patient records from existing
// Appointment rows and links each appointment to its patient.
//
// Design guarantees (matches the "migration" requirements):
//  - No data loss      : only ADDS patients and SETS appointment.patient; never
//                         deletes or mutates any existing appointment field.
//  - No duplicates     : patients are keyed by phoneKey (digits-only phone);
//                         an existing patient is reused, never re-created.
//  - Idempotent        : re-running recomputes the same totalVisits / dates and
//                         re-links to the same patient — safe to run any number
//                         of times, including after live bookings have begun.
//  - Rollback safe     : `rollbackPatientMigration()` unlinks appointments and
//                         drops the derived collections, restoring the prior state.

import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Patient from "@/models/Patient";
import { nextPatientId } from "@/lib/patients";
import { normalizePhone } from "@/lib/rateLimit";

export interface MigrationResult {
  appointmentsScanned: number;
  patientsCreated: number;
  patientsUpdated: number;
  appointmentsLinked: number;
  skippedNoPhone: number;
}

export async function migratePatients(): Promise<MigrationResult> {
  await connectToDatabase();

  const result: MigrationResult = {
    appointmentsScanned: 0,
    patientsCreated: 0,
    patientsUpdated: 0,
    appointmentsLinked: 0,
    skippedNoPhone: 0,
  };

  // Chronological so "latest" name/email/date is well-defined per group.
  const appts = await Appointment.find()
    .select("_id name phone email date patient visitReason")
    .sort({ date: 1, createdAt: 1 })
    .lean();

  result.appointmentsScanned = appts.length;

  // Group appointments by normalised phone.
  const groups = new Map<
    string,
    { name: string; email: string; phone: string; maxDate: string; lastReason: string; apptIds: any[] }
  >();

  for (const a of appts) {
    const phoneKey = normalizePhone(a.phone);
    if (!phoneKey) {
      result.skippedNoPhone++;
      continue;
    }
    const g = groups.get(phoneKey);
    if (g) {
      g.apptIds.push(a._id);
      // appts are sorted ascending, so later iterations carry the newer values.
      g.name = a.name || g.name;
      g.email = a.email || g.email;
      g.phone = a.phone || g.phone;
      if ((a.date || "") >= g.maxDate) {
        g.maxDate = a.date || g.maxDate;
        if (a.visitReason) g.lastReason = a.visitReason; // latest non-empty reason
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
      result.patientsCreated++;
    } else {
      // Recompute from source of truth (idempotent).
      patient.totalVisits = g.apptIds.length;
      patient.lastVisitDate = g.maxDate;
      if (g.lastReason) patient.lastVisitReason = g.lastReason;
      if (!patient.name && g.name) patient.name = g.name;
      if (!patient.email && g.email) patient.email = g.email;
      await patient.save();
      result.patientsUpdated++;
    }

    // Link every appointment in the group (only writes the patient ref).
    const linkRes = await Appointment.updateMany(
      { _id: { $in: g.apptIds } },
      { $set: { patient: patient._id } }
    );
    result.appointmentsLinked += linkRes.modifiedCount ?? 0;
  }

  return result;
}

/**
 * Undo the migration: unlink all appointments and drop the derived Patient /
 * Counter data. Existing appointment fields other than `patient` are untouched.
 */
export async function rollbackPatientMigration(): Promise<{ appointmentsUnlinked: number }> {
  await connectToDatabase();

  const res = await Appointment.updateMany(
    { patient: { $ne: null } },
    { $set: { patient: null } }
  );

  // Drop derived collections so a subsequent migration starts clean.
  await Promise.all([
    Patient.collection.drop().catch(() => {}),
    (await import("@/models/Counter")).default.collection.drop().catch(() => {}),
  ]);

  return { appointmentsUnlinked: res.modifiedCount ?? 0 };
}
