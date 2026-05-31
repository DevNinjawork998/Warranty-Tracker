# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

**Warranty Tracker** — a Malaysia-focused PWA where users photograph receipts, Claude vision API extracts warranty details, users review/correct, and the app sends push + email alerts before warranties expire. Full feature spec: [`requirements.md`](./requirements.md).

Key flows:
1. Upload receipt photo → `/api/ocr` (Claude Sonnet vision) → `sessionStorage` result
2. Review/edit extracted fields on `/upload/review` (side-by-side: image + form) → save
3. Dashboard at `/dashboard` shows warranties with Active / Expiring Soon / Expired status
4. Daily Vercel Cron (`/api/cron/notify`) sends Web Push + Resend email alerts

## Commands

```bash
npm run dev          # dev server (http://localhost:3000) — Turbopack
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint

# Database (Docker)
npm run db:up        # start Postgres container
npm run db:down      # stop container (data persists)
npm run db:reset     # nuke volume + restart + re-migrate
npm run db:migrate   # apply pending Prisma migrations
npm run db:seed      # re-insert dev user (idempotent)
npm run db:studio    # open Prisma Studio
npm run setup        # first-time: install + db:up + migrate + seed

# Prisma
npx prisma generate  # regenerate client after schema changes
npx prisma migrate dev --name <name>  # create and apply a migration
npx vitest run path/to/file.test.ts   # run a single test
```

Generate VAPID keys (one-time): `npx web-push generate-vapid-keys`

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 App Router (Turbopack) |
| Auth | Auth.js v5 (`next-auth@beta`) — Credentials provider, JWT sessions |
| Database ORM | Prisma v7 (`prisma-client` generator → `lib/generated/prisma/`) |
| Database | PostgreSQL 17 via Docker + `@prisma/adapter-pg` |
| Image storage | Vercel Blob |
| OCR | Claude Sonnet (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| UI | shadcn/ui + Tailwind v4 |
| Email | Resend |
| Push | Web Push API (`web-push`) + manual service worker |
| Scheduling | Vercel Cron (`vercel.json`) — 08:00 UTC daily (~4 PM MYT) |

## Architecture

### Route layout
- `app/api/auth/[...nextauth]/` — Auth.js catch-all
- `app/api/auth/register/` — signup: hashes password with bcryptjs, seeds `NotificationSettings`
- `app/api/ocr/` — uploads image to Vercel Blob → calls Claude vision → returns structured JSON
- `app/api/warranties/` — GET list + POST create (computes `expiryDate = addMonths(purchaseDate, warrantyMonths)`)
- `app/api/cron/notify/` — queries expiring warranties, sends Web Push + Resend email
- `app/api/push/subscribe/` — upserts `PushSubscription` by endpoint
- `app/api/settings/` — GET/PATCH notification preferences per user
- `app/auth/` — login + signup client components
- `app/dashboard/` — server component; serialises Prisma results to pass into `<WarrantyList>` client component
- `app/upload/` — camera/file receipt capture; `/upload/review` — two-panel review + edit form
- `app/settings/` — notification preferences UI with sign-out

### Key files
- `lib/auth.ts` — Auth.js config (providers, JWT/session callbacks that inject `session.user.id`)
- `lib/db.ts` — Prisma singleton with `PrismaPg` adapter
- `lib/session.ts` — `getSession()` wrapper; returns mock session when `BYPASS_AUTH=true`
- `lib/warranty-status.ts` — `getStatus(expiryDate)` → `active | expiring_soon | expired`
- `prisma/schema.prisma` — DB schema; **no `url` in datasource** (Prisma v7 breaking change)
- `prisma/seed.sql` — idempotent dev user seed (run via `npm run db:seed`)
- `prisma.config.ts` — migration datasource URL (loads `.env.local` then `.env`)
- `proxy.ts` — Next.js 16 route guard (renamed from `middleware.ts`); skipped when `BYPASS_AUTH=true`
- `public/sw-push.js` — handles `push` and `notificationclick` service worker events
- `vercel.json` — Vercel Cron schedule
- `docker-compose.yml` — local Postgres 17 on port 5432

### Prisma v7 key rules
- Generator is `prisma-client`, not `prisma-client-js`; output is `lib/generated/prisma/` (gitignored)
- Import PrismaClient from `@/lib/generated/prisma/client`, not `@prisma/client`
- Always run `npx prisma generate` after schema changes before running TypeScript
- Client requires `new PrismaPg({ connectionString })` adapter — see `lib/db.ts`

### Auth.js v5 key rules
- Route guard is `proxy.ts` (not `middleware.ts`) — Next.js 16 rename
- Session strategy is JWT; access the user id via `session.user.id` (injected in the `session` callback in `lib/auth.ts`)
- All server components and API routes call `getSession()` from `lib/session.ts` (not `auth()` directly) to support the bypass flag

### Data rules
- `expiryDate` is always computed on write (`addMonths` from `date-fns`) — never stored as user input
- Status (`active/expiring_soon/expired`) is computed at render time from `expiryDate` — never stored
- Push subscriptions are upserted by `endpoint`; stale ones are deleted on failed delivery

## Auth bypass (local dev)

Set in `.env.local`:
```
BYPASS_AUTH=true
DEV_USER_ID=dev-user   # must exist in the DB — run npm run db:seed
```

Remove `BYPASS_AUTH` before deploying to production.

## Custom skills (invoke with /skill-name)
- `/security-review` — security audit focused on this app's threat surface
- `/nextjs-practices` — Next.js 16 / Prisma v7 / Auth.js v5 rules
- `/design-system` — layout, colour, typography, component conventions
- `/tdd` — test-driven development workflow with Vitest + Testing Library
