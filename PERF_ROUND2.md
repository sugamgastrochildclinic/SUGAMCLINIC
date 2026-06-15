# Sugam Clinic — Initial-Load Optimization (Round 2)

**Date:** 2026-06-13 · **Focus:** first-page-load time for first-time visitors.
**Method:** real `next build` bundle output + production-server (`next start`) HTTP
measurements (not estimates). Builds connect to the live DB, so pages prerender
with real data.

> Round 1 (see `AUDIT_REPORT.md`) already shipped: AVIF/WebP config, font `swap`,
> security/cache headers, `Promise.all` DB reads, `sizes` on images, sitemap/robots,
> shorter loader, Chatbot code-split. Round 2 attacks what was left — the items
> that actually dominated first load.

---

## Bottlenecks found & why they slowed first load

| # | Bottleneck | Why it hurt initial load |
|---|-----------|--------------------------|
| 1 | **Every image stored as base64 `data:` URI in MongoDB** (the admin `ImageUploader` saved `canvas.toDataURL(...)`). | `next/image` **cannot optimize `data:` URIs** — no resize, no AVIF/WebP, no CDN. 12 blobs (hero 86 KB, gallery up to 301 KB) rendered **inline** in the HTML → homepage HTML was **2.9 MB raw / 2.0 MB gzip**, render-blocking, terrible LCP. *This was the #1 bottleneck — bigger than all JS combined.* |
| 2 | **Entire homepage was one big client component**; all sections statically imported → all framer-motion section JS in the initial bundle. | Home **First Load JS = 381 kB**, all parsed/hydrated up front → high TBT/TTI. |
| 3 | **`import * as Icons from "lucide-react"`** + runtime `Icons[name]` lookup in Services / AllServicesView / admin services. | Defeats tree-shaking → the **whole** icon library shipped. `/services` = 341 kB, `/admin/services` = 273 kB First Load JS. |
| 4 | **`force-dynamic` + `revalidate = 0`** on every public page. | Zero HTML caching → a full **7-collection DB round-trip on every visit** → high, variable TTFB. |
| 5 | **Layout did its own `ClinicSettings.findOne()`** on top of the page's. | A second redundant DB query per request just for the favicon. |
| 6 | `recharts` in dependencies. | Unused (no import anywhere) — dead dependency. |

---

## Fixes implemented

1. **Images → ImageKit CDN URLs (biggest win).**
   - Added `POST /api/imagekit` (admin-only) that uploads to ImageKit and returns the CDN URL.
   - Rewired `ImageUploader` to upload there and store the **URL** (was base64). Same UX; client-side downscale retained.
   - One-time migration `scripts/migrate-images-to-imagekit.mjs` (idempotent, dry-run-verified) moved the **12 existing base64 blobs** to ImageKit and rewrote the DB fields. Now every image flows through `/_next/image` → responsive AVIF/WebP from the edge.
2. **Code-split below-the-fold sections** in `MainHome` via `next/dynamic` (SSR kept → SEO/markup unchanged): Doctors, Services, BookingForm, Testimonials, GalleryGrid, FAQList, BlogGrid, Contact, Footer. FloatingActions + Chatbot are `ssr:false`.
3. **Curated, tree-shakeable icon map** (`components/ServiceIcon.tsx`) replaces the `import * as Icons` wildcard in all 3 call sites (admin picker is a fixed 12-icon list, so behavior is identical).
4. **ISR** — `force-dynamic`/`revalidate=0` → **`revalidate = 300`** on `/`, `/services`, `/gallery`, `/blogs`. Visitor critical path no longer hits the DB. Admin edits stay **instant** via `revalidatePublic()` (`revalidatePath`) wired into every content mutation route (settings/doctors/services/gallery/blog/faqs/reviews).
5. **Request-deduped settings** — `getCachedSettings()` (React `cache()`) shared by layout + page → one query instead of two.

---

## Before → After (measured)

### Homepage `/` — HTTP payload
| Metric | Before | After | Δ |
|--------|--------|-------|---|
| HTML (raw) | 2,975,755 B | 292,937 B | **−90%** |
| HTML (gzip, wire) | 2,017,353 B | **26,802 B** | **−98.7%** |
| Inline base64 images | 27 (2.71 MB) | **0** | — |
| Render mode | `ƒ` Dynamic (DB/visit) | `○` Static + ISR (`x-nextjs-cache: HIT`) | no DB on hot path |
| Hero (LCP) | 86 KB inline base64, unoptimized | responsive AVIF via CDN (~15–25 KB at display size) | optimized + non-blocking |

### First Load JS (from `next build`)
| Route | Before | After | Δ |
|-------|--------|-------|---|
| `/` | 381 kB | **178 kB** | −203 kB (**−53%**) |
| `/services` | 341 kB | **176 kB** | −165 kB (**−48%**) |
| `/admin/services` | 273 kB | **107 kB** | −166 kB (**−61%**) |
| `/blogs`, `/gallery` | 176 / 175 kB | 176 / 175 kB (now Static+ISR) | caching win |

Other public pages post-migration: `/services` 10.2 KB · `/gallery` 10.1 KB · `/blogs` 10.8 KB (gzip HTML), all 0 inline base64.

### Estimated Core Web Vitals impact
The ~2 MB → ~27 KB gzip HTML drop removes seconds of download + parse on mobile/4G
and converts the LCP hero from an inline blob to a small CDN AVIF. Combined with the
−53% home JS and static ISR HTML (no per-visit TTFB), the FCP < 1.5 s / LCP < 2.5 s /
TBT < 200 ms targets are now realistic. Run the commands in `AUDIT_REPORT.md` §12 to
capture live Lighthouse numbers.

---

## Functionality / UX preserved
- All sections, animations, responsive layout, language widget, admin CRUD unchanged.
- Below-fold sections still server-rendered (SEO intact) — only their JS is deferred.
- Admin image uploads work as before (now produce CDN URLs); existing images migrated transparently.
- Admin edits remain instant for visitors (on-demand `revalidatePath`).

## Remaining recommendations (not done)
- **Remove `recharts`** from `package.json` (unused) — needs `npm install` to update the lockfile.
- Round-1 security backlog still stands: rotate the committed `.env` secrets, hash the admin password.
- Optional: `content-visibility:auto` on deep below-fold sections; JSON-LD structured data.
