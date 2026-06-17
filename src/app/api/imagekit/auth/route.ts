import { NextResponse } from "next/server";
import { getImageKitInstance } from "@/lib/imagekit";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issue short-lived ImageKit upload credentials so the admin browser can upload
 * the image DIRECTLY to ImageKit instead of relaying the bytes through this
 * serverless function. Relaying (the old POST /api/imagekit) meant every upload
 * paid: browser -> Vercel lambda (base64 in JSON, ~33% inflated) -> ImageKit,
 * plus a possible lambda cold start. Direct upload is one hop, binary, no cold
 * start in the critical path — this is the production slowness fix.
 *
 * Returns only the signature/token/expire + the (already public) public key and
 * URL endpoint. The private key never leaves the server. Admin-gated.
 */
export async function GET() {
  try {
    await requireAdmin();

    const ik = getImageKitInstance();
    const auth = ik.getAuthenticationParameters();

    return NextResponse.json({
      ...auth,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/imagekit/auth");
  }
}
