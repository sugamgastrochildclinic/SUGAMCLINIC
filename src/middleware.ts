import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge gate for privileged surfaces. This is defense-in-depth: every admin API
 * route still verifies the session server-side, and the admin layout still
 * redirects — but the middleware blocks unauthenticated traffic before it ever
 * reaches a handler, and centralises the rule in one place.
 *
 * - `/admin/*` pages → redirect unauthenticated users to /login (preserving the
 *   intended destination as ?callbackUrl).
 * - `/api/admin/*` and `/api/setup` → return 401 JSON (never an HTML redirect)
 *   so programmatic callers get a clean machine-readable response.
 *
 * Mixed public/admin API routes (e.g. GET /api/reviews is public, PUT is admin)
 * are intentionally NOT gated here by method — they enforce auth per-handler.
 */
const ADMIN_PAGE_PREFIX = "/admin";
const ADMIN_API_PREFIXES = ["/api/admin", "/api/setup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAdmin = (token as { role?: string } | null)?.role === "admin";

  if (isAdmin) return NextResponse.next();

  // Admin-only API surfaces → 401 JSON.
  if (ADMIN_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin pages → redirect to login with a callback.
  if (pathname === ADMIN_PAGE_PREFIX || pathname.startsWith(`${ADMIN_PAGE_PREFIX}/`)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/setup"],
};
