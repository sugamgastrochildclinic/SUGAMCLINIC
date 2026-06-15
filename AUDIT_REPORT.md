# Sugam Clinic — Performance & Technical Audit Report

**Stack:** Next.js 15 (App Router) · React 18 · MongoDB/Mongoose · NextAuth · ImageKit CDN · Tailwind · Framer Motion
**Date:** 2026-06-13
**Scope:** Public marketing site (home + `/services`, `/gallery`, `/blogs`) and supporting API/DB layer.

> **Measurement honesty:** Lighthouse / Core Web Vitals numbers below are **engineering estimates** derived from code analysis, not captured runs. This environment has no browser to run Lighthouse. To get real numbers, run the commands in [§12](#12-how-to-measure-for-real). All *code* changes were applied and pass `tsc --noEmit`.

---

## 1. Architecture summary

- Homepage is a single server component ([page.tsx](src/app/page.tsx)) that reads 7 collections, then hands everything to one big **client** component [MainHome.tsx](src/components/MainHome.tsx) — the entire page (Hero → Footer + Chatbot) hydrates on the client.
- `export const dynamic = "force-dynamic"; revalidate = 0` on every page → **zero caching**, a fresh DB round-trip on every request.
- Images come from ImageKit; some used `next/image` (good), Hero + Gallery used raw `<img>` (no optimization).
- A full-screen [LoadingScreen](src/components/LoadingScreen.tsx) overlay blocked scroll for a **forced 1100 ms** minimum.
- Google Translate widget injected via `next/script` (afterInteractive).

---

## 2. Bottlenecks found (ranked)

| # | Severity | Issue | Impact |
|---|----------|-------|--------|
| 1 | 🔴 Critical | **Live secrets committed in [.env](.env)** — MongoDB URI+password, NextAuth secret, ImageKit private key, Gmail app password, admin password | Full DB/account compromise |
| 2 | 🔴 Critical | Admin auth compares **plaintext password**; hardcoded secret fallback in [auth.ts](src/lib/auth.ts) | Auth bypass / weak security |
| 3 | 🟠 High | Sequential DB queries (7 awaits) in [page.tsx](src/app/page.tsx) | High TTFB |
| 4 | 🟠 High | Raw `<img>` for Hero LCP + Gallery — no resize/WebP/AVIF, no `sizes`, no priority | Large LCP, big payload |
| 5 | 🟠 High | Forced 1100 ms loading overlay + scroll lock | Delayed perceived load, hurts LCP/INP |
| 6 | 🟠 High | No security/caching headers; no AVIF/WebP config | Best-Practices + payload |
| 7 | 🟡 Medium | `next/image fill` without `sizes` (Doctors, BlogGrid) → serves 100vw image | Oversized mobile downloads |
| 8 | 🟡 Medium | Chatbot + framer-motion shipped in initial bundle | Larger JS, slower hydration/INP |
| 9 | 🟡 Medium | No `Cache-Control` on public API GETs; full Mongoose hydration (no `.lean()`) | Repeat API cost |
| 10 | 🟡 Medium | Appointment POST awaits 2 emails sequentially | Slow booking response (~2× email latency) |
| 11 | 🟡 Medium | No DB indexes on queried/sorted fields | Slows as data grows |
| 12 | 🟡 Medium | Missing SEO: no sitemap/robots, no per-page metadata, no canonical/OG | Lower SEO score |
| 13 | 🟢 Low | All sections are client components w/ `whileInView` framer animations | Hydration cost |
| 14 | 🟢 Low | Dead/broken `:root` CSS vars (`18 +178 +166`) in [globals.css](src/app/globals.css) | Harmless cruft |
| 15 | 🟢 Low | New nodemailer transport created per email | Minor server overhead |

---

## 3. Core Web Vitals — estimated before → after

Mid-range Android, 4G, optimized ImageKit hero ~30–60 KB after transforms.

| Metric | Before (est.) | After (est.) | Driver |
|--------|---------------|--------------|--------|
| **LCP** | ~3.8–4.5 s | ~1.8–2.4 s | next/image+priority, preconnect, parallel TTFB, shorter loader |
| **TTFB** | ~600–900 ms | ~300–450 ms | `Promise.all` DB reads, `.lean()` |
| **FCP** | ~2.2 s | ~1.2 s | Loader 1100→400 ms, font `swap` |
| **CLS** | ~0.05–0.1 | <0.05 | `sizes`+intrinsic dims on images |
| **INP** | ~200–300 ms | ~120–180 ms | Chatbot code-split, smaller bundle |
| **Total transferred** | heavy (full-res imgs) | **−40–60 %** | AVIF/WebP + responsive `sizes` |

### Lighthouse (estimated)

| Category | Before | After |
|----------|--------|-------|
| Performance | ~55–65 | ~85–92 |
| Accessibility | ~85 | ~90 (see §9) |
| Best Practices | ~75 | ~95 (headers, no powered-by, HTTPS imgs) |
| SEO | ~80 | ~95–100 (sitemap, robots, metadata) |

---

## 4. Changes implemented (file-by-file)

| File | Change | Impact |
|------|--------|--------|
| [next.config.js](next.config.js) | AVIF/WebP formats, 1yr image cache, `optimizePackageImports` (lucide/framer/recharts), `removeConsole` (prod), `poweredByHeader:false`, `compress`, full security-header set incl. functional CSP, immutable cache for `/_next/static` | Smaller JS/images, security, Best-Practices |
| [layout.tsx](src/app/layout.tsx) | `preconnect`/`dns-prefetch` to ImageKit + Translate; font `display:swap`; rich metadata (`metadataBase`, OG, Twitter, robots, canonical, keywords) | Faster image start, SEO |
| [page.tsx](src/app/page.tsx) | 7 sequential queries → single `Promise.all`; same for seed-refetch | Lower TTFB |
| [services/page.tsx](src/app/services/page.tsx), [gallery/page.tsx](src/app/gallery/page.tsx), [blogs/page.tsx](src/app/blogs/page.tsx) | `Promise.all` queries + per-page `metadata` | TTFB + SEO |
| [Hero.tsx](src/components/Hero.tsx) | Hero `<img>` → `next/image` (`fill`, `priority`, `fetchPriority=high`, `sizes`), wrapped to preserve padding frame | Big LCP win |
| [GalleryGrid.tsx](src/components/GalleryGrid.tsx), [AllGalleryView.tsx](src/components/AllGalleryView.tsx) | `<img>` → `next/image` (grid: lazy + responsive `sizes`; lightbox: `sizes=100vw`) | −payload, format negotiation |
| [Doctors.tsx](src/components/Doctors.tsx), [BlogGrid.tsx](src/components/BlogGrid.tsx), [AllBlogsView.tsx](src/components/AllBlogsView.tsx), [Navbar.tsx](src/components/Navbar.tsx) | Added `sizes` (+ `loading`/`priority`) to `fill` images | Correct-size downloads |
| [MainHome.tsx](src/components/MainHome.tsx) | Chatbot → `next/dynamic` (`ssr:false`) | Smaller initial JS, better INP |
| [api/services](src/app/api/services/route.ts), [doctors](src/app/api/doctors/route.ts), [gallery](src/app/api/gallery/route.ts), [blog](src/app/api/blog/route.ts), [faqs](src/app/api/faqs/route.ts) | `Cache-Control: public, s-maxage=60, swr=300` + `.lean()` | CDN cache, lighter responses |
| [api/reviews](src/app/api/reviews/route.ts) | `.lean()` + `private, no-store` (session-dependent) | Correctness + speed |
| [api/appointments](src/app/api/appointments/route.ts) | Two emails sent concurrently via `Promise.all` | ~50 % faster booking response |
| [Gallery](src/models/Gallery.ts), [Review](src/models/Review.ts), [Appointment](src/models/Appointment.ts), [BlogPost](src/models/BlogPost.ts) | Added indexes on filtered/sorted fields | Scales query perf |
| [LoadingScreen.tsx](src/components/LoadingScreen.tsx) | Min delay 1100→400 ms, fallback 4000→3000, skip on `prefers-reduced-motion` | Faster perceived load, a11y |
| [sitemap.ts](src/app/sitemap.ts), [robots.ts](src/app/robots.ts) | New — sitemap + robots (disallow /admin,/api,/login) | SEO |

All edits preserve UI, business logic, and responsive behavior. `tsc --noEmit` passes.

---

## 5. Estimated overall gain

- **Initial transferred bytes:** −40–60 % (image format + responsive sizing + code-split + tree-shaking).
- **TTFB:** −40–50 % (parallel queries).
- **Perceived load (FCP/LCP):** roughly halved on the homepage.
- **Mobile initial load on 4G:** target **< 3 s** is realistic after these changes once images flow through `/_next/image`.

---

## 6–7. API & DB

- Public GET routes now CDN-cacheable (60 s + 5 min SWR) and `.lean()`-hydrated. Admin/site freshness unaffected (site pages remain `force-dynamic` and read the DB directly, not via these APIs).
- Indexes added match real access patterns (`Gallery{category,order,createdAt}`, `Review{approved,createdAt}`, `Appointment{createdAt}`, `BlogPost{createdAt}`).
- **Booking POST** target < 200 ms is gated by the external SMTP call; emails are now parallel. To fully hit the target, move email to a background queue / fire-and-forget after the DB write (deferred — changes user-visible timing, needs product sign-off).

---

## 8. SEO

Added: sitemap, robots, per-page titles/descriptions/canonicals, OG/Twitter, `metadataBase`, font `display:swap`.
**Recommended next (not yet done — needs content/asset):** `MedicalClinic` / `Physician` JSON-LD structured data, a real OG share image, FAQ `FAQPage` schema.

---

## 9. Accessibility (audit — partially addressed)

- ✅ Loader now respects `prefers-reduced-motion`.
- ⚠️ **To do:** the language dropdown and chatbot toggle need `aria-expanded`/`aria-label`; lightboxes need focus-trap + `Esc` close + `role="dialog"`; verify teal-on-white text contrast meets 4.5:1; mobile hamburger needs `aria-label`. These are markup-only follow-ups, low risk.

---

## 10. Security (audit — flagged, NOT auto-fixed)

🔴 **Act immediately — these are live credentials in the repo:**
1. **Rotate every secret in [.env](.env)** (Mongo password, `NEXTAUTH_SECRET`, ImageKit private key, Gmail app password, admin password). Treat all as compromised.
2. Move secrets to the host's env-var store; ensure `.env` is git-ignored; never commit real secrets.
3. **Hash the admin password** with the already-installed `bcryptjs` and compare hashes in [auth.ts](src/lib/auth.ts); remove the hardcoded `NEXTAUTH_SECRET` fallback (fail fast if unset).
4. Add rate limiting on `/api/auth` and `/api/appointments` (booking is unauthenticated → spam/abuse vector).

✅ Done: CSP + `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, removed `X-Powered-By`.

> Auth logic was left untouched to avoid locking out the admin; items 3–4 need a deploy + test cycle.

---

## 11. Mobile

Responsive `sizes` now stop phones downloading desktop-res images; lazy-loading below-fold; loader trimmed. Combined with AVIF/WebP this is the main lever for the **< 3 s on 4G** goal.

---

## 12. How to measure for real

```bash
cd sugam_clinic
npm run build           # confirms bundle splits + no build errors
npm run start           # serve production build on :3000
npx lighthouse http://localhost:3000 --view --preset=desktop
npx lighthouse http://localhost:3000 --view   # mobile/throttled
npx @next/bundle-analyzer   # (after adding the plugin) inspect chunk sizes
```
Capture before/after by running against the previous git revision if available.

---

## 13. Priority backlog (remaining)

**Critical:** rotate secrets, hash admin password (§10).
**High:** add JSON-LD structured data; add rate limiting; consider ISR (`revalidate=60`) instead of `force-dynamic` to enable HTML caching while keeping admin updates near-instant via on-demand `revalidatePath`.
**Medium:** a11y dialog/focus-trap fixes; OG image; nodemailer transport reuse; background email queue.
**Low:** remove dead `:root` CSS vars; trim unused font weights; `content-visibility:auto` on deep below-fold sections (test against `whileInView` first).
