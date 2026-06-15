import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import Doctor from "@/models/Doctor";
import { sendEmail } from "@/lib/email";
import { renderEmail, infoTable, infoRow, quoteBlock, nl2br, esc } from "@/lib/emailTemplate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Optional server-side filtering for large datasets. All params are
    // optional — with none supplied this behaves exactly as before (returns
    // every appointment), so existing callers are unaffected.
    // `date` is a "YYYY-MM-DD" string, which sorts/compares lexicographically.
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from"); // "YYYY-MM-DD"
    const to = searchParams.get("to"); // "YYYY-MM-DD"
    const status = searchParams.get("status"); // Pending|Confirmed|Completed|Cancelled

    const query: Record<string, any> = {};
    if (status && status !== "All") query.status = status;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const appointments = await Appointment.find(query)
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(appointments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const appointment = await Appointment.create(data);

    // Fetch doctor info for email notification
    const doc = await Doctor.findById(data.doctor);
    const doctorName = doc ? doc.name : "Selected Doctor";

    // Send emails in background via waitUntil so user booking is instant
    const clinicEmail = process.env.EMAIL_FROM || "info@sugamclinic.com";
    waitUntil(
      Promise.all([
        sendEmail({
          to: clinicEmail,
          subject: `New Appointment Booking Request - ${data.name}`,
          html: renderEmail({
            title: "New appointment booking request",
            previewText: `New booking from ${data.name}`,
            bodyHtml: `
              <p style="margin:0 0 8px;">A new appointment request was submitted.</p>
              ${infoTable(
                infoRow("Patient", data.name) +
                infoRow("Phone", data.phone) +
                infoRow("Email", data.email) +
                infoRow("Date", data.date) +
                infoRow("Time slot", data.time) +
                infoRow("Doctor", doctorName)
              )}
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
        }),
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
      ]).catch(err => {
        console.error("Async booking email notification failed:", err);
      })
    );

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true }).populate("doctor", "name");
    
    if (appointment) {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Single delete (existing behaviour) — by ?id=
    if (id) {
      await Appointment.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    // Bulk delete — JSON body { ids: [...] }. For safety this only ever removes
    // Completed/Cancelled records, so active appointments can never be wiped en
    // masse even if the client sends their ids.
    const body = await req.json().catch(() => null);
    const ids = body?.ids;
    if (Array.isArray(ids) && ids.length > 0) {
      const result = await Appointment.deleteMany({
        _id: { $in: ids },
        status: { $in: ["Completed", "Cancelled"] },
      });
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    return NextResponse.json({ error: "Missing appointment ID(s)" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
