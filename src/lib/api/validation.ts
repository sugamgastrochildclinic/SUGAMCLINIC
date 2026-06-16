import mongoose from "mongoose";
import { z } from "zod";
import { BadRequest } from "@/lib/api/errors";

/**
 * Assert that `id` is a valid Mongo ObjectId, throwing a client-safe 400
 * otherwise. Stops malformed/NoSQL-injection-shaped ids reaching the driver.
 */
export function assertValidObjectId(id: unknown, label = "id"): string {
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    throw BadRequest(`Invalid ${label}`);
  }
  return id;
}

/** Reusable Zod refinement for ObjectId-shaped strings. */
export const objectIdSchema = z
  .string()
  .trim()
  .refine((v) => mongoose.isValidObjectId(v), "Invalid id");

/**
 * Parse a request body with a Zod schema, throwing a client-safe 400 (with
 * field issues) on failure. The returned object contains ONLY schema-declared
 * fields, which is what closes mass-assignment: unknown keys are stripped.
 */
export function parseBody<T extends z.ZodTypeAny>(schema: T, raw: unknown): z.infer<T> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw BadRequest("Validation failed", parsed.error.flatten().fieldErrors);
  }
  return parsed.data;
}

/** Clamp/validate pagination query params with sane defaults and hard caps. */
export function parsePagination(searchParams: URLSearchParams, defaultLimit = 50, maxLimit = 200) {
  const rawPage = Number(searchParams.get("page"));
  const rawLimit = Number(searchParams.get("limit"));
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit >= 1
      ? Math.min(Math.floor(rawLimit), maxLimit)
      : defaultLimit;
  return { page, limit, skip: (page - 1) * limit };
}
