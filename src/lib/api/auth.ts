import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Unauthorized } from "@/lib/api/errors";

export interface AdminSession extends Session {
  user: NonNullable<Session["user"]> & { role: string };
}

/** True if the session belongs to an authenticated admin. */
export function isAdminSession(session: Session | null): session is AdminSession {
  return !!session && (session.user as { role?: string } | undefined)?.role === "admin";
}

/**
 * Centralised admin gate for API route handlers. Returns the typed admin
 * session or throws `ApiError(401)` (caught by `handleApiError`). Use at the
 * top of every privileged handler instead of re-implementing the session check.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getServerSession(authOptions);
  if (!isAdminSession(session)) {
    throw Unauthorized();
  }
  return session;
}

/** Returns the session if an admin, otherwise null (no throw). For mixed public/admin reads. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions);
  return isAdminSession(session) ? session : null;
}
