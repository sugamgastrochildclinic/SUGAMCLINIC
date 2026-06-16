import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import { normalizePhone } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId } from "@/lib/api/validation";

// Admin-only patient profile + full appointment history (newest first).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    assertValidObjectId(id, "patient id");

    await connectToDatabase();

    const patient: any = await Patient.findById(id).lean();
    if (!patient) throw NotFound("Patient not found");

    // Match appointments linked by ref OR sharing this patient's phone. The
    // phone fallback surfaces legacy/unlinked appointments (booked before the
    // patient feature, or any that missed the best-effort link at booking time)
    // so the history is never empty for a patient who clearly has visits.
    const phoneKey = normalizePhone(patient.phone);
    const candidates = await Appointment.find({
      $or: [{ patient: id }, { phone: patient.phone }],
    })
      .populate("doctor", "name specialization")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Guard the phone fallback against false positives (two people, same typed
    // number → already the same patient by our dedup, so this is safe).
    const appointments = candidates.filter(
      (a: any) => String(a.patient) === String(id) || normalizePhone(a.phone) === phoneKey
    );

    // Self-heal: link any matched-but-unlinked appointments so the list view,
    // dashboard aggregation, and future loads all stay consistent.
    const orphanIds = appointments
      .filter((a: any) => !a.patient)
      .map((a: any) => a._id);
    if (orphanIds.length > 0) {
      await Appointment.updateMany({ _id: { $in: orphanIds } }, { $set: { patient: id } });
    }

    return NextResponse.json({ patient, appointments });
  } catch (error) {
    return handleApiError(error, "GET /api/patients/[id]");
  }
}
