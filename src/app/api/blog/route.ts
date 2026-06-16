import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import BlogPost from "@/models/BlogPost";
import { revalidatePublic } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, NotFound } from "@/lib/api/errors";
import { assertValidObjectId, parseBody } from "@/lib/api/validation";
import { blogCreateSchema, blogUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    const posts = await BlogPost.find().select("-__v").sort({ createdAt: -1 }).lean();
    return NextResponse.json(posts);
  } catch (error) {
    return handleApiError(error, "GET /api/blog");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const data = parseBody(blogCreateSchema, await req.json());
    const post = await BlogPost.create(data);
    revalidatePublic();
    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error, "POST /api/blog");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { id, ...rest } = await req.json();
    assertValidObjectId(id, "post id");
    const updateData = parseBody(blogUpdateSchema, rest);
    const post = await BlogPost.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!post) throw NotFound("Post not found");
    revalidatePublic();
    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error, "PUT /api/blog");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const id = assertValidObjectId(new URL(req.url).searchParams.get("id"), "post id");
    await BlogPost.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/blog");
  }
}
