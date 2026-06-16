import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FAQ from "@/models/FAQ";
import { revalidatePublic } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { faqCreateSchema, faqUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    const faqs = await FAQ.find().select("-__v").sort({ createdAt: -1 }).lean();
    return NextResponse.json(faqs);
  } catch (error) {
    return handleApiError(error, "GET /api/faqs");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const data = parseBody(faqCreateSchema, await req.json());
    const faq = await FAQ.create(data);
    revalidatePublic();
    return NextResponse.json(faq);
  } catch (error) {
    return handleApiError(error, "POST /api/faqs");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "FAQ id");
    const updateData = parseBody(faqUpdateSchema, rest);
    const faq = await FAQ.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!faq) throw NotFound("FAQ not found");
    revalidatePublic();
    return NextResponse.json(faq);
  } catch (error) {
    return handleApiError(error, "PUT /api/faqs");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "FAQ id");
    await FAQ.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/faqs");
  }
}
