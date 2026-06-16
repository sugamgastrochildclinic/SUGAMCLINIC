// Lightweight in-memory rate limiter + bot honeypot for the public POST
// endpoints (appointment booking, contact form). No external dependency.
//
// Serverless caveat: this lives in a single lambda instance's memory, so under
// heavy horizontal scale a flood could spread across instances and partially
// evade it. For a small clinic it blunts the common case (one bot/IP hammering)
// effectively. For hard guarantees behind many instances, back this with a
// shared store (e.g. Upstash Redis) — the call sites would not change.

type Timestamps = number[];
const store = new Map<string, Timestamps>();
let lastSweep = Date.now();
const SWEEP_INTERVAL = 5 * 60 * 1000; // 5 min
const MAX_RETENTION = 60 * 60 * 1000; // drop keys idle for 1h

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec: number;
}

/**
 * Sliding-window limiter. Allows `limit` hits per `windowMs` for a given key.
 * Call once per request; it records the hit when allowed.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Periodic memory sweep so the map can't grow unbounded.
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

/**
 * Best-effort client IP from proxy headers.
 *
 * Order matters for trust: `x-vercel-forwarded-for` is set by Vercel's edge and
 * cannot be spoofed by the client, so it's preferred. `x-real-ip` (also set by
 * the platform) is next. Only as a last resort do we read the leftmost entry of
 * the client-controllable `x-forwarded-for` — taking the *first* hop, since on
 * a trusted single-proxy deployment that is the real client; never trust the
 * whole header blindly. Returns "unknown" so a missing IP still yields a stable
 * (shared) rate-limit bucket rather than throwing.
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
