import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Gallery from "@/models/Gallery";
import { revalidatePublic } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { galleryCreateSchema } from "@/lib/api/schemas";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Only ever filter on the indexed `category` field; never pass raw client
    // objects into the query (NoSQL-injection guard).
    const query = category ? { category: String(category) } : {};
    const items = await Gallery.find(query).select("-__v").sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error, "GET /api/gallery");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const data = parseBody(galleryCreateSchema, await req.json());
    const item = await Gallery.create(data);
    revalidatePublic();
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error, "POST /api/gallery");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "gallery item id");
    await Gallery.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/gallery");
  }
}
