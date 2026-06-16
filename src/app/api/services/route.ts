import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Service from "@/models/Service";
import { revalidatePublic } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { serviceCreateSchema, serviceUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    const services = await Service.find().select("-__v").sort({ createdAt: -1 }).lean();
    return NextResponse.json(services);
  } catch (error) {
    return handleApiError(error, "GET /api/services");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const data = parseBody(serviceCreateSchema, await req.json());
    const service = await Service.create(data);
    revalidatePublic();
    return NextResponse.json(service);
  } catch (error) {
    return handleApiError(error, "POST /api/services");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "service id");
    const updateData = parseBody(serviceUpdateSchema, rest);
    const service = await Service.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!service) throw NotFound("Service not found");
    revalidatePublic();
    return NextResponse.json(service);
  } catch (error) {
    return handleApiError(error, "PUT /api/services");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "service id");
    await Service.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/services");
  }
}
