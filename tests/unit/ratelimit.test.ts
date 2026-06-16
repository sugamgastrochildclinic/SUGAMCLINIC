import { describe, it, expect } from "vitest";
import {
  rateLimit,
  getClientIp,
  isHoneypotTripped,
  normalizePhone,
  HONEYPOT_FIELD,
  isDistributedRateLimitEnabled,
} from "@/lib/rateLimit";

// These run against the in-memory fallback (no UPSTASH_* env in the test env).
describe("rateLimit (in-memory fallback)", () => {
  it("uses the in-memory limiter when Upstash is not configured", () => {
    expect(isDistributedRateLimitEnabled).toBe(false);
  });

  it("allows up to `limit` hits then blocks with Retry-After", async () => {
    const key = `test:${Math.random()}`;
    const r1 = await rateLimit(key, 3, 60_000);
    const r2 = await rateLimit(key, 3, 60_000);
    const r3 = await rateLimit(key, 3, 60_000);
    const r4 = await rateLimit(key, 3, 60_000);
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    expect(r4.ok).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
  });

  it("keys are independent", async () => {
    const a = await rateLimit(`a:${Math.random()}`, 1, 60_000);
    const bKey = `b:${Math.random()}`;
    await rateLimit(bKey, 1, 60_000);
    const bBlocked = await rateLimit(bKey, 1, 60_000);
    expect(a.ok).toBe(true);
    expect(bBlocked.ok).toBe(false);
  });
});

describe("getClientIp", () => {
  const make = (h: Record<string, string>) => new Request("https://x", { headers: h });

  it("prefers x-vercel-forwarded-for (unspoofable) over x-forwarded-for", () => {
    expect(
      getClientIp(make({ "x-vercel-forwarded-for": "9.9.9.9", "x-forwarded-for": "1.1.1.1" }))
    ).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip then first x-forwarded-for hop", () => {
    expect(getClientIp(make({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(getClientIp(make({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe("1.1.1.1");
  });

  it("returns 'unknown' when no IP headers present", () => {
    expect(getClientIp(make({}))).toBe("unknown");
  });
});

describe("isHoneypotTripped", () => {
  it("trips when the hidden field is filled", () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "http://spam" })).toBe(true);
  });
  it("does not trip when empty or absent", () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "" })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
    expect(isHoneypotTripped(null)).toBe(false);
  });
});

describe("normalizePhone", () => {
  it("strips non-digits", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("919876543210");
  });
});
