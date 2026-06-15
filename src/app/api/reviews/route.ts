import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Review from "@/models/Review";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePublic } from "@/lib/revalidate";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    const isAdmin = session && (session.user as any).role === "admin";

    const query = isAdmin ? {} : { approved: true };
    const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const session = await getServerSession(authOptions);
    const isAdmin = session && (session.user as any).role === "admin";

    if (!isAdmin) {
      data.approved = false;
    }

    const review = await Review.create(data);
    return NextResponse.json(review);
  } catch (error: any) {
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
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    const review = await Review.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePublic();
    return NextResponse.json(review);
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

    if (!id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    await Review.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
