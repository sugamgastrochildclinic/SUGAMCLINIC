import { NextRequest, NextResponse } from "next/server";
import { migratePatients, rollbackPatientMigration } from "@/lib/patientMigration";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";

// Admin-only, idempotent patient backfill. POST runs the migration; POST with
// ?rollback=1 reverses it. Mirrors the auth pattern of /api/setup.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    if (searchParams.get("rollback") === "1") {
      const r = await rollbackPatientMigration();
      return NextResponse.json({ success: true, rolledBack: true, ...r });
    }

    const result = await migratePatients();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error, "POST /api/admin/migrate-patients");
  }
}
