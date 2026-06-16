import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Appointment from "@/models/Appointment";
import {
  TIME_SLOTS,
  SLOT_CAPACITY,
  BLOCKING_STATUSES,
  isValidDateString,
  isSlotInPast,
} from "@/lib/slots";
import { handleApiError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

// Public, no PII. Returns slot availability for a doctor on a date so the
// booking form can disable taken / past slots. The POST handler re-checks this
// authoritatively; this endpoint is purely a UX convenience.
//   GET /api/appointments/availability?doctor=<id>&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctor = searchParams.get("doctor") || "";
    const date = searchParams.get("date") || "";

    if (!mongoose.isValidObjectId(doctor)) {
      return NextResponse.json({ error: "Invalid doctor id" }, { status: 400 });
    }
    if (!isValidDateString(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    await connectToDatabase();

    // Count active bookings per slot for this doctor+date.
    const booked = await Appointment.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(doctor), date, status: { $in: [...BLOCKING_STATUSES] } } },
      { $group: { _id: "$time", count: { $sum: 1 } } },
    ]);
    const counts = new Map<string, number>(booked.map((b) => [b._id as string, b.count as number]));

    const slots = TIME_SLOTS.map((time) => {
      const past = isSlotInPast(time, date);
      const full = (counts.get(time) ?? 0) >= SLOT_CAPACITY;
      return { time, available: !past && !full, past, full };
    });

    return NextResponse.json({ date, doctor, slots });
  } catch (error) {
    return handleApiError(error, "GET /api/appointments/availability");
  }
}
