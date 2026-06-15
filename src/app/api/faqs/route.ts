import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import FAQ from "@/models/FAQ";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePublic } from "@/lib/revalidate";

export async function GET() {
  try {
    await connectToDatabase();
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    return NextResponse.json(faqs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();
    const faq = await FAQ.create(data);
    revalidatePublic();
    return NextResponse.json(faq);
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
      return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });
    }

    const faq = await FAQ.findByIdAndUpdate(id, updateData, { new: true });
    revalidatePublic();
    return NextResponse.json(faq);
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
      return NextResponse.json({ error: "Missing FAQ ID" }, { status: 400 });
    }

    await FAQ.findByIdAndDelete(id);
    revalidatePublic();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
