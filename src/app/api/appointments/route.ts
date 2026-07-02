import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import { sendEmail } from "@/lib/email";
import { renderEmail, infoTable, infoRow, quoteBlock, nl2br, esc } from "@/lib/emailTemplate";
import { sanitizeHeader } from "@/lib/email";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { assertValidObjectId, parseBody, parsePagination } from "@/lib/api/validation";
import { appointmentStatusSchema } from "@/lib/api/schemas";
import {
  isValidSlot,
  isValidDateString,
  isSlotInPast,
  todayInClinicTZ,
  SLOT_CAPACITY,
  BLOCKING_STATUSES,
} from "@/lib/slots";
import { rateLimit, getClientIp, normalizePhone, isHoneypotTripped } from "@/lib/rateLimit";
import { resolvePatientForBooking } from "@/lib/patients";

// Public booking input. `status` is intentionally NOT accepted from the client
// (it's forced to "Pending") to stop a visitor self-confirming an appointment.
const bookingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  date: z.string().trim().min(1).max(20),
  time: z.string().trim().min(1).max(40),
  doctor: z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid doctor id"),
  // Chief complaint — required for new bookings.
  visitReason: z.string().trim().min(1).max(120),
  symptoms: z.string().max(2000).optional().default(""),
  additionalNotes: z.string().max(2000).optional().default(""),
  message: z.string().max(2000).optional().default(""),
  isChild: z.boolean().optional().default(false),
  childName: z.string().max(120).optional().default(""),
  childDob: z.string().max(20).optional().default(""),
  vaccinationReminderEnabled: z.boolean().optional().default(false),
});

const ALLOWED_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Optional server-side filtering + pagination for large datasets. All
    // params are optional. `date` is a "YYYY-MM-DD" string (lexicographic sort).
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    // Whitelist status against the known enum — never pass a raw client string
    // straight into the query.
    if (status && status !== "All" && ALLOWED_STATUSES.includes(status)) {
      query.status = status;
    }
    if (from || to) {
      const dateRange: Record<string, string> = {};
      if (from) dateRange.$gte = String(from);
      if (to) dateRange.$lte = String(to);
      query.date = dateRange;
    }

    // Pagination is opt-in: a caller that passes ?page/?limit gets a bounded
    // page; existing callers (no params) still get the full set so the admin
    // list is never silently truncated.
    const paginate = searchParams.has("page") || searchParams.has("limit");
    const { limit, skip, page } = parsePagination(searchParams, 100, 500);

    let q = Appointment.find(query)
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });
    if (paginate) q = q.skip(skip).limit(limit);

    const [appointments, total] = await Promise.all([
      q.lean(),
      Appointment.countDocuments(query),
    ]);

    return NextResponse.json({ data: appointments, page, limit, total });
  } catch (error) {
    return handleApiError(error, "GET /api/appointments");
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    // Bot honeypot: a filled hidden field means a bot. Pretend success so the
    // bot moves on, but do nothing (no DB write, no email).
    if (isHoneypotTripped(raw)) {
      return NextResponse.json({ success: true });
    }

    // Per-IP flood guard (cheap, before any DB work).
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`appt:ip:${ip}`, 5, 10 * 60 * 1000); // 5 / 10 min
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    await connectToDatabase();

    const parsed = bookingSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking details", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Per-phone guard: stops one number spamming bookings even across IPs.
    const phoneLimit = await rateLimit(`appt:phone:${normalizePhone(data.phone)}`, 3, 60 * 60 * 1000); // 3 / hr
    if (!phoneLimit.ok) {
      return NextResponse.json(
        { error: "You've made several booking requests recently. Please call the clinic or try again later." },
        { status: 429, headers: { "Retry-After": String(phoneLimit.retryAfterSec) } }
      );
    }

    // --- Booking integrity checks (authoritative; the form only mirrors these) ---

    // Slot must be one we actually offer.
    if (!isValidSlot(data.time)) {
      return NextResponse.json({ error: "Please pick a valid time slot." }, { status: 400 });
    }

    // Date must be well-formed and not in the past (clinic timezone).
    if (!isValidDateString(data.date)) {
      return NextResponse.json({ error: "Please pick a valid date." }, { status: 400 });
    }
    if (data.date < todayInClinicTZ()) {
      return NextResponse.json({ error: "That date is in the past. Please choose an upcoming date." }, { status: 400 });
    }

    // For today, the chosen slot must not have already started.
    if (isSlotInPast(data.time, data.date)) {
      return NextResponse.json({ error: "That time slot has already passed. Please choose a later slot." }, { status: 400 });
    }

    // Doctor must exist (ObjectId format was checked by zod; this checks reality).
    const doc = await Doctor.findById(data.doctor);
    if (!doc) {
      return NextResponse.json({ error: "Selected doctor is unavailable. Please choose another." }, { status: 400 });
    }

    // No double-booking: refuse if the slot is already taken for this doctor/date.
    const taken = await Appointment.countDocuments({
      doctor: data.doctor,
      date: data.date,
      time: data.time,
      status: { $in: [...BLOCKING_STATUSES] },
    });
    if (taken >= SLOT_CAPACITY) {
      return NextResponse.json(
        { error: "Sorry, that slot was just booked. Please pick another time." },
        { status: 409 }
      );
    }

    // status is forced server-side — never trusted from the request body.
    const appointment = await Appointment.create({ ...data, status: "Pending" });

    // Patient tracking (BEST-EFFORT). The appointment is already saved above, so
    // any failure here must NOT fail the booking — we just log and continue with
    // the appointment left unlinked. This guarantees the booking experience is
    // unaffected by the patient subsystem.
    try {
      const patient = await resolvePatientForBooking({
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        date: data.date,
        visitReason: data.visitReason,
      });
      if (patient) {
        await Appointment.updateOne({ _id: appointment._id }, { patient: patient._id });
      }
    } catch (patientErr) {
      console.error("Patient link failed (appointment still saved):", patientErr);
    }

    const doctorName = doc.name;

    // Send emails in background via waitUntil so user booking is instant
    const clinicEmail = process.env.EMAIL_FROM || "info@sugamclinic.com";
    const emailPromises: Promise<any>[] = [
      sendEmail({
        to: clinicEmail,
        subject: sanitizeHeader(`New Appointment Booking Request - ${data.name}`),
        html: renderEmail({
          title: "New appointment booking request",
          previewText: `New booking from ${data.name}`,
          bodyHtml: `
            <p style="margin:0 0 8px;">A new appointment request was submitted.</p>
            ${infoTable(
              infoRow("Patient", data.name) +
              infoRow("Phone", data.phone) +
              infoRow("Email", data.email || "Not provided") +
              infoRow("Date", data.date) +
              infoRow("Time slot", data.time) +
              infoRow("Doctor", doctorName) +
              infoRow("Visit reason", data.visitReason)
            )}
            ${data.symptoms ? quoteBlock("Symptoms", nl2br(data.symptoms)) : ""}
            ${data.additionalNotes ? quoteBlock("Additional notes", nl2br(data.additionalNotes)) : ""}
            ${data.message ? quoteBlock("Message", nl2br(data.message)) : ""}
            ${
              data.isChild
                ? quoteBlock(
                    "Child details (Vaccination Program)",
                    `Name: ${esc(data.childName)}<br/>DOB: ${esc(data.childDob)}<br/>Reminders: ${
                      data.vaccinationReminderEnabled ? "Enabled" : "Disabled"
                    }`
                  )
                : ""
            }
          `,
        }),
      })
    ];

    if (data.email) {
      emailPromises.push(
        sendEmail({
          to: data.email,
          subject: `Sugam Clinic - Appointment Request Received`,
          html: renderEmail({
            title: "We've received your appointment request",
            previewText: "Your appointment request has been received",
            bodyHtml: `
              <p style="margin:0 0 12px;">Dear ${esc(data.name)},</p>
              <p style="margin:0 0 8px;">Thank you for choosing us. We have received your booking request and our staff will contact you shortly to confirm.</p>
              ${infoTable(
                infoRow("Doctor", doctorName) +
                infoRow("Date", data.date) +
                infoRow("Time slot", data.time) +
                infoRow("Status", "Pending confirmation")
              )}
            `,
          }),
        })
      );
    }

    waitUntil(
      Promise.all(emailPromises).catch(err => {
        console.error("Async booking email notification failed:", err);
      })
    );

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    return handleApiError(error, "POST /api/appointments");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "appointment id");
    const { status } = parseBody(appointmentStatusSchema, rest);

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: new Date().toString() === "never" ? false : true, runValidators: true }
    ).populate("doctor", "name");
    
    if (appointment && appointment.email) {
      // Send update email to patient
      await sendEmail({
        to: appointment.email,
        subject: `Sugam Clinic - Appointment ${status}`,
        html: renderEmail({
          title: "Appointment status update",
          previewText: `Your appointment is now ${status}`,
          bodyHtml: `
            <p style="margin:0 0 12px;">Dear ${esc(appointment.name)},</p>
            <p style="margin:0 0 8px;">Your appointment status has been updated to <strong>${esc(status)}</strong>.</p>
            ${infoTable(
              infoRow("Doctor", appointment.doctor ? appointment.doctor.name : "Clinic Doctor") +
              infoRow("Date", appointment.date) +
              infoRow("Time", appointment.time) +
              infoRow("Status", status)
            )}
            <p style="margin:12px 0 0;">If you have any questions, please contact the clinic.</p>
          `,
        }),
      });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    return handleApiError(error, "PUT /api/appointments");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Single delete (existing behaviour) — by ?id=
    if (id) {
      assertValidObjectId(id, "appointment id");
      await Appointment.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    // Bulk delete — JSON body { ids: [...] }. For safety this only ever removes
    // Completed/Cancelled records, so active appointments can never be wiped en
    // masse even if the client sends their ids. Each id is validated so malformed
    // values never reach the driver.
    const body = await req.json().catch(() => null);
    const rawIds = body?.ids;
    if (Array.isArray(rawIds) && rawIds.length > 0) {
      const ids = rawIds.filter((v) => typeof v === "string" && mongoose.isValidObjectId(v));
      if (ids.length === 0) {
        return NextResponse.json({ error: "No valid appointment ids" }, { status: 400 });
      }
      const result = await Appointment.deleteMany({
        _id: { $in: ids },
        status: { $in: ["Completed", "Cancelled"] },
      });
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    return NextResponse.json({ error: "Missing appointment ID(s)" }, { status: 400 });
  } catch (error) {
    return handleApiError(error, "DELETE /api/appointments");
  }
}
