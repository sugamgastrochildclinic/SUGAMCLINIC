import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

export async function GET() {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error: any) {
    console.error("Setup seeding error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

