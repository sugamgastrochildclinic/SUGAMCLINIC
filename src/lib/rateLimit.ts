// Rate limiter + bot honeypot for public POST endpoints (reviews, contact,
// appointments, availability) and the admin login flow.
//
// Backing store:
//   - Production / horizontal scale: Upstash Redis sliding-window limiter
//     (shared across every Vercel lambda instance), enabled automatically when
//     UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
//   - Local dev / tests / unconfigured: in-memory sliding window fallback so
//     the app and tests run with no external dependency.
//
// `rateLimit()` is async (Redis is a network call). All call sites await it.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

// ---------------------------------------------------------------------------
// In-memory fallback (single-instance only).
// ---------------------------------------------------------------------------
type Timestamps = number[];
const store = new Map<string, Timestamps>();
let lastSweep = Date.now();
const SWEEP_INTERVAL = 5 * 60 * 1000;
const MAX_RETENTION = 60 * 60 * 1000;

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > SWEEP_INTERVAL) {
    for (const [k, arr] of store) {
      const fresh = arr.filter((t) => now - t < MAX_RETENTION);
      if (fresh.length) store.set(k, fresh);
      else store.delete(k);
    }
    lastSweep = now;
  }

  const recent = (store.get(key) ?? []).filter((t) => now - t < windowMs);

  if (recent.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
    store.set(key, recent);
    return { ok: false, retryAfterSec };
  }

  recent.push(now);
  store.set(key, recent);
  return { ok: true, retryAfterSec: 0 };
}

// ---------------------------------------------------------------------------
// Upstash Redis sliding-window limiter (shared across instances).
// ---------------------------------------------------------------------------
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/** True when the distributed limiter is configured. Exported for tests/diagnostics. */
export const isDistributedRateLimitEnabled = !!(UPSTASH_URL && UPSTASH_TOKEN);

// In production the in-memory fallback is per-lambda and easily evaded under
// horizontal scale — warn loudly if the distributed store isn't configured.
if (process.env.NODE_ENV === "production" && !isDistributedRateLimitEnabled) {
  console.warn(
    "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to per-instance " +
      "in-memory rate limiting. Set them in the Vercel environment for effective limits."
  );
}

let redis: Redis | null = null;
// One Ratelimit instance per (limit, windowMs) pair — `Ratelimit` is configured
// with a fixed limiter, so we memoise by the limit signature.
const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });
  }
  return redis;
}

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const sig = `${limit}:${windowMs}`;
  let rl = limiterCache.get(sig);
  if (!rl) {
    rl = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rl",
      analytics: false,
    });
    limiterCache.set(sig, rl);
  }
  return rl;
}

/**
 * Sliding-window limiter. Allows `limit` hits per `windowMs` for a given key.
 * Records the hit when allowed. Uses Upstash Redis when configured, otherwise
 * an in-memory fallback. Never throws — a Redis outage degrades to "allow"
 * (fail-open) so the limiter can't take the whole site down, while still
 * being effective in the normal case.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!isDistributedRateLimitEnabled) {
    return memoryRateLimit(key, limit, windowMs);
  }

  try {
    const res = await getLimiter(limit, windowMs).limit(key);
    if (res.success) {
      return { ok: true, retryAfterSec: 0 };
    }
    const retryAfterSec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSec };
  } catch (err) {
    // Redis unreachable → fail open but log. Better to serve traffic than to
    // hard-fail every public POST on a transient Redis blip.
    console.error("Distributed rate limiter error (failing open):", err);
    return { ok: true, retryAfterSec: 0 };
  }
}

// ---------------------------------------------------------------------------
// Helpers (unchanged API).
// ---------------------------------------------------------------------------

/**
 * Best-effort client IP. Prefers platform-set, unspoofable headers
 * (`x-vercel-forwarded-for`, `x-real-ip`) over the client-controllable
 * `x-forwarded-for`. Returns "unknown" so a missing IP still yields a stable
 * bucket rather than throwing.
 */
export function getClientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  return "unknown";
}

/** Digits-only phone, used as a per-number rate-limit key. */
export function normalizePhone(phone: unknown): string {
  return String(phone ?? "").replace(/\D/g, "");
}

// Hidden form field a human never sees or fills. Any value = almost certainly a
// bot. Keep this name in sync with the hidden input in the public forms.
export const HONEYPOT_FIELD = "website";

/** True if the bot honeypot field was filled in. */
export function isHoneypotTripped(body: any): boolean {
  const v = body?.[HONEYPOT_FIELD];
  return typeof v === "string" && v.trim().length > 0;
}
