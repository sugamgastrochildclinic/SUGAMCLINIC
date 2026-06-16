import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import { revalidatePublic } from "@/lib/revalidate";
import { z } from "zod";
import { requireAdmin, getAdminSession } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { reviewUpdateSchema } from "@/lib/api/schemas";
import { rateLimit, getClientIp, isHoneypotTripped } from "@/lib/rateLimit";

const reviewSchema = z.object({
  name: z.string().trim().min(1).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().min(1).max(2000),
  photo: z.string().trim().max(500).optional().default(""),
});

export async function GET() {
  try {
    await connectToDatabase();
    const isAdmin = !!(await getAdminSession());

    const query = isAdmin ? {} : { approved: true };
    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(reviews);
  } catch (error) {
    return handleApiError(error, "GET /api/reviews");
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();

    // Bot honeypot: silently accept and drop (matches contact/appointments).
    if (isHoneypotTripped(raw)) {
      return NextResponse.json({ success: true });
    }

    // Per-IP flood guard before any DB work.
    const ip = getClientIp(req);
    const ipLimit = await rateLimit(`review:ip:${ip}`, 5, 10 * 60 * 1000); // 5 / 10 min
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } }
      );
    }

    await connectToDatabase();
    const data = parseBody(reviewSchema, raw);

    const isAdmin = !!(await getAdminSession());
    // Only an admin may publish directly; public submissions are always queued
    // for moderation (approved:false). `approved` is never taken from a public body.
    const approved = isAdmin ? raw?.approved === true : false;

    const review = await Review.create({ ...data, approved });
    if (approved) revalidatePublic();
    return NextResponse.json(review);
  } catch (error) {
    return handleApiError(error, "POST /api/reviews");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "review id");
    const updateData = parseBody(reviewUpdateSchema, rest);
    const review = await Review.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!review) throw NotFound("Review not found");
    revalidatePublic();
    return NextResponse.json(review);
  } catch (error) {
    return handleApiError(error, "PUT /api/reviews");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "review id");
    await Review.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/reviews");
  }
}
