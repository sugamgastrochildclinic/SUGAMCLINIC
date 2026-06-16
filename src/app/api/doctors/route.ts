import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Doctor from "@/models/Doctor";
import { revalidatePublic } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { doctorCreateSchema, doctorUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    const doctors = await Doctor.find().select("-__v").sort({ createdAt: -1 }).lean();
    return NextResponse.json(doctors);
  } catch (error) {
    return handleApiError(error, "GET /api/doctors");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const data = parseBody(doctorCreateSchema, await req.json());
    const doctor = await Doctor.create(data);
    revalidatePublic();
    return NextResponse.json(doctor);
  } catch (error) {
    return handleApiError(error, "POST /api/doctors");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "doctor id");
    const updateData = parseBody(doctorUpdateSchema, rest);
    const doctor = await Doctor.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!doctor) throw NotFound("Doctor not found");
    revalidatePublic();
    return NextResponse.json(doctor);
  } catch (error) {
    return handleApiError(error, "PUT /api/doctors");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "doctor id");
    await Doctor.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/doctors");
  }
}
