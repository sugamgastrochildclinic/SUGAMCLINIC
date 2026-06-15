import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePublic } from "@/lib/revalidate";

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await ClinicSettings.findOne().lean();
    if (!settings) {
      const created = await ClinicSettings.create({});
      settings = created.toObject();
    }
    return NextResponse.json(settings);
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

    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = new ClinicSettings(data);
    } else {
      Object.assign(settings, data);
    }

    await settings.save();
    revalidatePublic();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
