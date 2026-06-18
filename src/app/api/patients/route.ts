import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Patient from "@/models/Patient";
import Appointment from "@/models/Appointment";
import { normalizePhone } from "@/lib/rateLimit";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/validation";
import { nextPatientId } from "@/lib/patients";

// Admin-only patient directory. Returns every patient enriched with the latest
// visit reason they actually entered on the booking form, so the list can
// display and search on it without N round-trips.
//
// Pagination is opt-in (?page/?limit): without params the full directory is
// returned (existing admin UI relies on client-side search over the whole set);
// with params the patient set is bounded to cap payload/memory on large data.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const paginate = searchParams.has("page") || searchParams.has("limit");
    const { limit, skip } = parsePagination(searchParams, 100, 500);

    let pq = Patient.find().sort({ updatedAt: -1 });
    if (paginate) pq = pq.skip(skip).limit(limit);
    const patients: any[] = await pq.lean();

    // Index patients by both their id and their normalised phone, so an
    // appointment matches its patient whether or not it carries the `patient`
    // ref (legacy / unlinked rows still resolve via phone).
    const idByPatientId = new Map<string, string>();
    const idByPhoneKey = new Map<string, string>();
    for (const p of patients) {
      idByPatientId.set(String(p._id), String(p._id));
      const pk = normalizePhone(p.phone);
      if (pk) idByPhoneKey.set(pk, String(p._id));
    }

    // Only consider appointments that actually have a reason entered. Newest
    // visit first (by visit date, then booking time) so the first hit per
    // patient is their latest reason.
    const appts = await Appointment.find({ visitReason: { $nin: [null, ""] } })
      .select("patient phone visitReason date createdAt")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const reasonByPatient = new Map<string, string>();
    for (const a of appts as any[]) {
      const pid =
        (a.patient && idByPatientId.get(String(a.patient))) ||
        idByPhoneKey.get(normalizePhone(a.phone));
      if (!pid || reasonByPatient.has(pid)) continue; // first = latest
      reasonByPatient.set(pid, a.visitReason);
    }

    const enriched = patients.map((p) => ({
      ...p,
      // Prefer the reason stored on the patient (written at booking time, always
      // current); fall back to the appointment join for legacy patients created
      // before the field existed.
      latestVisitReason: p.lastVisitReason || reasonByPatient.get(String(p._id)) || "",
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return handleApiError(error, "GET /api/patients");
  }
}

// Admin-only manual patient creation. Booking still auto-creates patients as a
// side effect; this is for walk-ins / phone bookings the admin records by hand.
// Dedup is by phoneKey (digits-only phone) — same key as the booking flow — so
// a manually added patient can never collide with an auto-created one.
const GENDERS = ["Male", "Female", "Other", ""];

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const phone = String(body?.phone || "").trim();
    const email = String(body?.email || "").trim();
    const dateOfBirth = String(body?.dateOfBirth || "").trim();
    const gender = GENDERS.includes(body?.gender) ? body.gender : "";
    const lastVisitReason = String(body?.lastVisitReason || "").trim();
    const lastVisitDate = String(body?.lastVisitDate || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const phoneKey = normalizePhone(phone);
    if (!phoneKey) {
      return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
    }

    const existing = await Patient.findOne({ phoneKey }).lean<any>();
    if (existing) {
      return NextResponse.json(
        { error: `A patient with this phone already exists (${existing.patientId}).` },
        { status: 409 }
      );
    }

    try {
      const patientId = await nextPatientId();
      const patient = await Patient.create({
        patientId,
        name,
        phone,
        phoneKey,
        email,
        dateOfBirth,
        gender,
        // Manual add = a recorded visit. Seed visit count/date when supplied.
        totalVisits: lastVisitDate ? 1 : 0,
        lastVisitDate,
        lastVisitReason,
      });
      return NextResponse.json({ success: true, patient }, { status: 201 });
    } catch (e: any) {
      if (e?.code === 11000) {
        return NextResponse.json(
          { error: "A patient with this phone already exists." },
          { status: 409 }
        );
      }
      throw e;
    }
  } catch (error) {
    return handleApiError(error, "POST /api/patients");
  }
}
