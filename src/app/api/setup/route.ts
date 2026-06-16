import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    // Seeding mutates the database — require an authenticated admin so this
    // endpoint can't be hit anonymously to pre-seed/abuse a fresh database.
    await requireAdmin();
    await seedDatabase();
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    return handleApiError(error, "GET /api/setup");
  }
}
