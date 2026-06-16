import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Centralised API error handling.
 *
 * Goal: never leak internal error detail (stack traces, Mongoose/Mongo driver
 * messages, connection strings) to a client. Routes throw `ApiError` for
 * expected, client-facing failures (401/400/404/...). Everything else is an
 * unexpected server fault: it is logged server-side with full detail and the
 * client receives a generic 500 with no internals.
 */
export class ApiError extends Error {
  readonly status: number;
  /** Optional machine-readable field issues (e.g. from Zod). */
  readonly issues?: Record<string, string[] | undefined>;

  constructor(status: number, message: string, issues?: Record<string, string[] | undefined>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

export const Unauthorized = (msg = "Unauthorized") => new ApiError(401, msg);
export const Forbidden = (msg = "Forbidden") => new ApiError(403, msg);
export const BadRequest = (msg = "Bad request", issues?: Record<string, string[] | undefined>) =>
  new ApiError(400, msg, issues);
export const NotFound = (msg = "Not found") => new ApiError(404, msg);
export const Conflict = (msg = "Conflict") => new ApiError(409, msg);

/**
 * Convert any thrown value into a safe NextResponse.
 * - `ApiError` → its status + message (intentionally client-safe).
 * - `ZodError` → 400 with field issues.
 * - anything else → 500 generic message, full detail logged server-side only.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      error.issues ? { error: error.message, issues: error.issues } : { error: error.message },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // Unexpected — log everything server-side, reveal nothing to the client.
  console.error(`[API error]${context ? ` ${context}` : ""}:`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
