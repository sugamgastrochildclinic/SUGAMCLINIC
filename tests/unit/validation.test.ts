import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import {
  assertValidObjectId,
  parseBody,
  parsePagination,
  objectIdSchema,
} from "@/lib/api/validation";
import { ApiError } from "@/lib/api/errors";
import { z } from "zod";

describe("assertValidObjectId", () => {
  it("returns the id for a valid ObjectId", () => {
    const id = new mongoose.Types.ObjectId().toString();
    expect(assertValidObjectId(id)).toBe(id);
  });

  it("throws ApiError(400) for a malformed id", () => {
    expect(() => assertValidObjectId("not-an-id")).toThrowError(ApiError);
    try {
      assertValidObjectId("nope", "doctor id");
    } catch (e) {
      expect((e as ApiError).status).toBe(400);
      expect((e as ApiError).message).toContain("doctor id");
    }
  });

  it("rejects non-string input (NoSQL-injection shapes)", () => {
    expect(() => assertValidObjectId({ $ne: null } as unknown)).toThrowError(ApiError);
    expect(() => assertValidObjectId(undefined)).toThrowError(ApiError);
  });
});

describe("objectIdSchema", () => {
  it("accepts a valid id, rejects junk", () => {
    const id = new mongoose.Types.ObjectId().toString();
    expect(objectIdSchema.safeParse(id).success).toBe(true);
    expect(objectIdSchema.safeParse("xyz").success).toBe(false);
  });
});

describe("parseBody", () => {
  const schema = z.object({ name: z.string().min(1), age: z.coerce.number() });

  it("strips unknown keys (mass-assignment guard)", () => {
    const out = parseBody(schema, { name: "a", age: 3, _id: "evil", role: "admin" });
    expect(out).toEqual({ name: "a", age: 3 });
    expect("_id" in out).toBe(false);
    expect("role" in out).toBe(false);
  });

  it("throws ApiError(400) with field issues on invalid input", () => {
    try {
      parseBody(schema, { name: "" });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(400);
      expect((e as ApiError).issues).toBeDefined();
    }
  });
});

describe("parsePagination", () => {
  it("defaults page=1 and clamps limit to max", () => {
    const p = parsePagination(new URLSearchParams(""), 50, 200);
    expect(p.page).toBe(1);
    expect(p.limit).toBe(50);
    expect(p.skip).toBe(0);
  });

  it("respects valid params and computes skip", () => {
    const p = parsePagination(new URLSearchParams("page=3&limit=20"), 50, 200);
    expect(p).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it("clamps an over-large limit and rejects junk", () => {
    expect(parsePagination(new URLSearchParams("limit=99999"), 50, 200).limit).toBe(200);
    expect(parsePagination(new URLSearchParams("page=-5&limit=abc"), 50, 200)).toEqual({
      page: 1,
      limit: 50,
      skip: 0,
    });
  });
});
