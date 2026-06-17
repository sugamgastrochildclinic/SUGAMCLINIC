# Sugam Child & Gastro Care Clinic

Production website and admin dashboard for **Sugam Child & Gastro Care Clinic** — a
pediatric, neonatal and gastroenterology clinic. Public site for patients
(services, doctors, blog, gallery, online appointment booking) plus a secured
admin panel to manage appointments, patients, content and settings.

## Tech Stack

- **Framework:** Next.js 15 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS, framer-motion
- **Database:** MongoDB Atlas via Mongoose
- **Auth:** NextAuth (credentials) with bcrypt
- **Media:** ImageKit CDN
- **Email:** Nodemailer (SMTP)
- **Rate limiting:** Upstash Redis
- **Validation:** Zod + react-hook-form
- **Testing:** Vitest (unit), Playwright (e2e)

## Features

- Public site: home, services, doctors, blog, gallery, contact, multi-language (Google Translate)
- Online appointment booking with slot availability + email confirmation
- Admin dashboard: appointments, patients, doctors, services, blogs, gallery, reviews, messages, settings
- Patient records management with migration tooling
- SEO: dynamic `sitemap.xml`, `robots.txt`, canonical/OG metadata
- Security headers + CSP configured in `next.config.js`

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB Atlas connection string
- ImageKit, Upstash Redis and SMTP credentials

### Setup

```bash
# 1. Install (legacy-peer-deps required — see Notes)
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
#    then fill in real values

# 3. Run dev server
npm run dev
```

App runs at http://localhost:3000. Admin login: `/login` (uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

> **`.env` must live in this directory** (`sugamclinicfinal/`, the Next project root).
> Next only loads `.env` from the project root — a `.env` in the parent folder is ignored.

## Environment Variables

See [`.env.example`](.env.example). All are required — `auth.ts`/`db.ts` fail-fast
on missing `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MONGODB_URI`.

| Group | Vars |
|---|---|
| Database | `MONGODB_URI` |
| Auth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Site | `NEXT_PUBLIC_SITE_URL` (real domain in prod, else sitemap/OG emit localhost) |
| Admin | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| ImageKit | `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` |
| Email | `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` |
| Upstash | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Lint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run admin:reset` | Reset admin account |
| `npm run migrate:patients` | Run patient data migration |

## Deployment

Deploys to Vercel. Set all environment variables in the project settings and point
`NEXT_PUBLIC_SITE_URL` / `NEXTAUTH_URL` at the production domain. The build connects
to the live Atlas DB to prerender ISR pages with real data.

## Notes

- **`npm install --legacy-peer-deps`** is required — pre-existing peer conflict
  (next-auth wants nodemailer@7, project pins ^6.9.16).
- **Run a single `next build` at a time**, and only one dev/build process per `.next`.
  Concurrent processes corrupt `.next` chunks → runtime module errors. Fix:
  `rm -rf .next && npm run build`.
- Images upload to ImageKit and store the CDN URL (never base64 in the DB).

## Project Structure

```
src/
  app/         # App Router routes (public pages, admin, API routes)
  components/  # Shared UI components
  lib/         # db, auth, email, imagekit, rate limiting, helpers
  models/      # Mongoose models (registered via models/index.ts)
scripts/       # Admin reset, patient + image migrations
tests/         # unit + e2e
```
