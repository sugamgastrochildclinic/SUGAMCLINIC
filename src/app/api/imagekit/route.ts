import { NextRequest, NextResponse } from "next/server";
import { getImageKitInstance } from "@/lib/imagekit";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError, BadRequest } from "@/lib/api/errors";

// Accepted upload formats and a hard ceiling on payload size. The admin picker
// resizes/compresses client-side; this is the server-side backstop so a crafted
// request can't push an arbitrary type or a huge payload through to the CDN.
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB decoded
const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

export async function GET() {
  try {
    await requireAdmin();
    const ik = getImageKitInstance();
    const authParams = ik.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    return handleApiError(error, "GET /api/imagekit");
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
    await requireAdmin();

    const { file, fileName } = await req.json();
    if (!file || typeof file !== "string") {
      throw BadRequest("Missing file");
    }

    // Only accept a base64 image data URL, verify the declared MIME type, and
    // enforce a size cap on the decoded bytes before sending to ImageKit.
    const match = DATA_URL_RE.exec(file.trim());
    if (!match) {
      throw BadRequest("File must be a base64-encoded image data URL");
    }
    const mime = match[1].toLowerCase();
    if (!ALLOWED_MIME.includes(mime)) {
      throw BadRequest(`Unsupported image type: ${mime}`);
    }
    // base64 length → decoded byte size (4 chars ≈ 3 bytes, minus padding).
    const b64 = match[2];
    const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
    const sizeBytes = Math.floor((b64.length * 3) / 4) - padding;
    if (sizeBytes > MAX_UPLOAD_BYTES) {
      throw BadRequest("Image exceeds the 8 MB upload limit");
    }

    // Sanitize the supplied file name: strip path separators / control chars.
    const safeName = String(fileName || "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 120);

    const ik = getImageKitInstance();
    const result = await ik.upload({
      file,
      fileName: safeName || `upload-${Date.now()}`,
      folder: "/sugam-clinic",
      useUniqueFileName: true,
    });

    return NextResponse.json({ url: result.url, fileId: result.fileId });
  } catch (error) {
    return handleApiError(error, "POST /api/imagekit");
  }
}
