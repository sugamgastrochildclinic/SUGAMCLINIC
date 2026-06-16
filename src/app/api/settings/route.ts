import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ClinicSettings from "@/models/ClinicSettings";
import { revalidatePublic } from "@/lib/revalidate";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { parseBody } from "@/lib/api/validation";
import { settingsUpdateSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await ClinicSettings.findOne().lean();
    if (!settings) {
      const created = await ClinicSettings.create({});
      settings = created.toObject();
    }
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error, "GET /api/settings");
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    // Whitelist the editable fields. Parsing strips unknown keys (_id, __v,
    // timestamps, anything injected) so a crafted body can never mass-assign
    // internal state — the previous Object.assign(settings, data) trusted every
    // key in the request.
    const data = parseBody(settingsUpdateSchema, await req.json());

    const settings =
      (await ClinicSettings.findOne()) ?? new ClinicSettings();
    settings.set(data);
    await settings.save();

    revalidatePublic();
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error, "PUT /api/settings");
  }
}
