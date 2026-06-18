# SEO Changes Log — sugamgastrochildclinic.com

All changes are code/metadata/structure only. No visual design, branding, colors, typography, or business content changed. Every change verified with a clean `npm run build`.

---

## 1. Title tag (Critical)
- **File:** `src/app/layout.tsx`
- **Before (88 chars):** `Pediatrician in Coimbatore | Neonatologist & Pediatric Gastroenterologist | Sugam Clinic`
- **After (57 chars):** `Pediatrician in Coimbatore | Sugam Child & Gastro Clinic`
- **Why:** Was truncating in search results (>60 chars). Now keeps primary keyword first + brand, no truncation.

## 2. Meta description (Critical)
- **Files:** `src/app/layout.tsx`, `src/lib/seo.ts`
- **Before (326 chars):** address-stuffed, truncated in SERP.
- **After (~158 chars):** `Expert pediatrician, neonatologist & gastro care in Venkittapuram, Coimbatore. Newborn care, vaccinations, jaundice & liver treatment. Book appointment today.`
- **Why:** Within the 120–160 char SERP limit, leads with intent + CTA. Address moved to schema (where Google actually reads it).

## 3. WWW canonicalization — 301 redirect (Critical)
- **File:** `next.config.js`
- **Change:** Added `redirects()` — `www.sugamgastrochildclinic.com` → apex (non-www), permanent 301.
- **Why:** Audit flagged www + non-www both resolving = duplicate content / split PageRank. Now one canonical host.
- **Note:** Requires DNS pointing www to the site for the redirect to fire (see DNS section).

## 4. GEO / AI crawlers — llms.txt (GEO grade was D)
- **File:** `public/llms.txt` (new)
- **Change:** Added structured `llms.txt` — clinic summary, contact, pages, doctors, sitemap link.
- **Why:** Helps LLM / AI search engines understand the site entity. Was missing entirely.

## 5. Heading hierarchy
- **Files:** `src/components/About.tsx`, `AllServicesView.tsx`, `AllBlogsView.tsx`
- **Changes:**
  - About mission/vision: `h4` → `h3` (correct nesting under section heading).
  - Services + Blogs list pages: added screen-reader-only `h2` to remove the h1→h3 jump.
- **Why:** Clean semantic outline for crawlers + accessibility. No visual change (sr-only / same classes).

## 6. Image optimization
- **Files:** `AllBlogsView.tsx`, `AllGalleryView.tsx`
- **Changes:**
  - Removed `unoptimized` flag from blog images → now served as AVIF/WebP via Next pipeline, with `sizes`.
  - Gallery thumbnails: native `<img>` → `next/image` (`fill` + `sizes` + lazy + quality).
  - Gallery lightbox `<img>`: added `decoding="async"`.
- **Why:** Smaller transfer, faster LCP, less layout shift (CLS).

## 7. Local SEO — areaServed schema expanded
- **File:** `src/lib/seo.ts` (`CLINIC_LOCATION.areaServed`)
- **Change:** Added nearby zones to LocalBusiness schema: Singanallur, Peelamedu, Ramanathapuram, Ondipudur, Saibaba Colony, Gandhipuram, Coimbatore South (alongside existing Coimbatore, Venkittapuram, Ambethkar Road, Sindhi Vidyalaya).
- **Why:** Signals local coverage for area-specific / "near me" searches.

## 8. Keyword targeting expanded
- **Files:** `src/lib/seo.ts` (`KEYWORDS`), `src/app/layout.tsx` (homepage `keywords`)
- **Changes:**
  - `brandLocal`: +child gastro doctor, pediatric liver specialist, best child clinic Venkittapuram.
  - `services`: +7 symptom/intent terms (stomach pain, jaundice for babies, liver disease, diarrhea, constipation, vomiting, growth monitoring).
  - New `local` group: 13 area + "near me" terms.
  - Homepage keywords: 12 → 19, added high-intent primaries + a local term.
- **Why:** Aligns meta + schema targeting with the keyword checklist. (Note: meta keywords are minor for Google; real ranking comes from items 9 + content + GBP.)

## 9. Indexable blog detail pages (biggest organic-growth lever)
- **Files:** `src/app/blogs/[slug]/page.tsx` (new), `src/lib/seo.ts`, `AllBlogsView.tsx`, `BlogGrid.tsx`, `src/app/sitemap.ts`
- **Changes:**
  - New route `/blogs/[slug]` — server-rendered article with `generateStaticParams` (prerender all) + ISR.
  - Per-post `generateMetadata`: unique title, description, canonical, OpenGraph (article type + image).
  - Per-post `BlogPosting` + `BreadcrumbList` JSON-LD.
  - SEO-friendly slugs: `slugify(title)-{id}` (no DB migration; stable across title edits).
  - Blog cards (list page + homepage) now link to detail pages instead of opening a modal → real crawlable internal links.
  - Sitemap: one entry per blog post.
- **Why:** Each article is now individually indexable and rankable (was modal-only, invisible to Google). Unlocks long-tail / symptom keyword ranking and fixes "too few internal links."

---

## Already in place (verified, no change needed)
- Canonical tags, `metadataBase`, robots.ts (allow all + sitemap), XML sitemap.
- OpenGraph + Twitter/X cards.
- Full Schema.org graph: Organization, MedicalClinic/LocalBusiness, Physician, FAQPage, WebSite, Breadcrumb, Blog, ItemList.
- `next/font` (self-hosted, zero-CLS), HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- AVIF/WebP image config, compression, ISR caching, `lang="en"`, viewport, favicon.

---

## NOT code — action required by you (DNS / dashboard)
1. **SPF record** (DNS TXT): `v=spf1 include:_spf.google.com ~all` — clinic Gmail deliverability.
2. **DMARC record** (DNS TXT `_dmarc`): `v=DMARC1; p=quarantine; rua=mailto:sugamgastrochildclinic@gmail.com; fo=1`.
3. **Point domain to Vercel** (nameservers / A+CNAME) — currently on parked nameservers (`*.dns-parking.com`); needed for www redirect + HTTP/2.
4. **Google Business Profile:** add service-area neighborhoods + keep NAP exact — drives "near me" ranking.
5. **AggregateRating** in schema is hardcoded 4.9/150 — make it reflect real reviews or remove (penalty risk).
6. Optional: add **GA4** for traffic analytics (none installed).

## Post-deploy checklist
1. Deploy code.
2. View-source on live homepage → confirm new title + description.
3. Google Search Console → resubmit sitemap → Request Indexing on homepage + a few `/blogs/[slug]` URLs.
4. Re-run Lighthouse (mobile) → check desktop CLS (was 0.45).
5. Write blog posts targeting symptom keywords (constipation, acid reflux, jaundice) — detail pages now exist to hold them.
