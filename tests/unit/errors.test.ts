import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import {
  ApiError,
  handleApiError,
  Unauthorized,
  Forbidden,
  BadRequest,
  NotFound,
  Conflict,
} from "@/lib/api/errors";

describe("ApiError factories", () => {
  it("carry the right status codes", () => {
    expect(Unauthorized().status).toBe(401);
    expect(Forbidden().status).toBe(403);
    expect(BadRequest().status).toBe(400);
    expect(NotFound().status).toBe(404);
    expect(Conflict().status).toBe(409);
  });
});

describe("handleApiError", () => {
  it("returns the ApiError status + message", async () => {
    const res = handleApiError(new ApiError(404, "Doctor not found"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Doctor not found" });
  });

  it("includes issues when present", async () => {
    const res = handleApiError(BadRequest("Validation failed", { name: ["Required"] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Validation failed",
      issues: { name: ["Required"] },
    });
  });

  it("maps a ZodError to 400 with field issues", async () => {
    const schema = z.object({ name: z.string().min(1) });
    const parsed = schema.safeParse({ name: "" });
    const res = handleApiError(parsed.success ? null : parsed.error);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.issues.name).toBeDefined();
  });

  it("never leaks internals for unexpected errors", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = handleApiError(new Error("connection string mongodb://secret@host"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(body)).not.toContain("mongodb://");
    spy.mockRestore();
  });
});
