// Patient resolution + id minting. Imported by the booking API and the
// migration. The booking flow treats every call here as BEST-EFFORT: if any of
// this throws, the caller still keeps the appointment (see the booking POST),
// so patient tracking can never break a booking.

import Patient from "@/models/Patient";
import Counter from "@/models/Counter";
import { normalizePhone } from "@/lib/rateLimit";

/**
 * Atomically mint the next patient id (PAT0001, PAT0002, ...). The `$inc` is
 * performed server-side by MongoDB so concurrent callers never collide.
 */
export async function nextPatientId(): Promise<string> {
  const c = await Counter.findByIdAndUpdate(
    "patientId",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return "PAT" + String(c.seq).padStart(4, "0");
}

export interface PatientBookingInput {
  name: string;
  phone: string;
  email: string;
  date: string; // "YYYY-MM-DD"
  visitReason: string;
}

/**
 * Find-or-create the patient for a booking, count the visit, and refresh the
 * last-visit date. Returns the patient document, or null when the phone has no
 * usable digits (so the caller simply leaves the appointment unlinked).
 *
 * Dedup is by `phoneKey` (digits-only phone). On a repeat booking the existing
 * record is reused and `totalVisits` incremented; on a first booking a new
 * record is created with `totalVisits = 1`.
 */
export async function resolvePatientForBooking(input: PatientBookingInput) {
  const phoneKey = normalizePhone(input.phone);
  if (!phoneKey) return null;

  // Repeat patient: atomic increment + refresh of mutable display fields.
  const existing = await Patient.findOneAndUpdate(
    { phoneKey },
    {
      $inc: { totalVisits: 1 },
      $set: {
        lastVisitDate: input.date,
        lastVisitReason: input.visitReason,
        name: input.name,
        email: input.email,
        phone: input.phone,
      },
    },
    { new: true }
  );
  if (existing) return existing;

  // First-time patient.
  try {
    const patientId = await nextPatientId();
    return await Patient.create({
      patientId,
      name: input.name,
      phone: input.phone,
      phoneKey,
      email: input.email,
      totalVisits: 1,
      lastVisitDate: input.date,
      lastVisitReason: input.visitReason,
    });
  } catch (e: any) {
    // Two simultaneous first-bookings for the same phone: one wins the unique
    // index, the loser (E11000) re-reads and counts its visit.
    if (e?.code === 11000) {
      return await Patient.findOneAndUpdate(
        { phoneKey },
        { $inc: { totalVisits: 1 }, $set: { lastVisitDate: input.date, lastVisitReason: input.visitReason } },
        { new: true }
      );
    }
    throw e;
  }
}
