import { NextRequest, NextResponse } from "next/server";
import { getImageKitInstance } from "@/lib/imagekit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ik = getImageKitInstance();
    const authParams = ik.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Upload an image to ImageKit and return its CDN URL.
 *
 * The admin image picker resizes/compresses client-side, then POSTs the result
 * here as a data URL. We store the returned ImageKit URL in MongoDB — NOT the
 * base64 — so `next/image` can serve optimized, responsive AVIF/WebP from the
 * CDN. (Storing base64 in the DB bypasses all image optimization and bloats
 * every page's HTML by megabytes.)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { file, fileName } = await req.json();
    if (!file || typeof file !== "string") {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const ik = getImageKitInstance();
    const result = await ik.upload({
      file, // data URL or base64 string — ImageKit accepts both
      fileName: fileName || `upload-${Date.now()}`,
      folder: "/sugam-clinic",
      useUniqueFileName: true,
    });

    return NextResponse.json({ url: result.url, fileId: result.fileId });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
