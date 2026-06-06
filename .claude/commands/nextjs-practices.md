# Next.js 16 Best Practices — Warranty Tracker

You are reviewing or writing code for a Next.js 16 App Router project. Apply the following rules specific to this codebase.

## Server vs Client Components

- Default to **Server Components**. Add `"use client"` only when the component needs browser APIs, React state, or event handlers.
- Do **not** pass non-serialisable values (class instances, Dates, Decimals) from Server to Client components. Convert in the server component first (e.g. `.toISOString()`, `Number()`).
- Server Components can `await` directly — no need for `useEffect` to fetch data.

## Data fetching

- Fetch data in the nearest Server Component, not in a layout above it, unless multiple routes share the same data.
- Use Prisma directly in server components/API routes via `lib/db.ts`. Do not create a separate data-fetching abstraction unless it is reused 3+ times.
- Always filter by `userId` in every Prisma query that returns user data.

## API routes

- Every API route that mutates data must `await auth()` first and return 401 if `session?.user?.id` is missing.
- Use Zod to validate request bodies before touching the DB. Return 400 with `{ error, details }` on failure.
- Do not call `db` from Client Components — always go through an API route.

## Routing conventions (Next.js 16)

- Route guards live in `proxy.ts` (not `middleware.ts` — renamed in Next.js 16).
- Dynamic segments use `[param]` folders. Catch-all uses `[...param]`.
- `useSearchParams()` must be wrapped in `<Suspense>` at the page level (Next.js build requirement).

## Prisma v7 rules

- Run `npx prisma generate` after any schema change before running TypeScript or the dev server.
- Import `PrismaClient` from `@/lib/generated/prisma/client`, not from `@prisma/client`.
- Do not put `url` in the `datasource` block in `schema.prisma` — that is set in `prisma.config.ts`.

## Forms

- Use `react-hook-form` + `zodResolver`. Use `z.number()` (not `z.coerce.number()`) and pair with `{ valueAsNumber: true }` in `register()` for numeric inputs.
- For enum fields, use `setValue()` from `react-hook-form` inside `<Select onValueChange>` (shadcn Select does not use a native `<select>`).

## PWA

- The service worker is registered manually via `<ServiceWorkerRegister />` in `app/layout.tsx`.
- Do not add `@ducanh2912/next-pwa` — it conflicts with Next.js 16's Turbopack build.
- The manifest is at `public/manifest.json`; icons go in `public/icons/`.

## Performance

- Avoid client-side fetching on the dashboard — the server component already passes data as props.
- `<Image>` from `next/image` must be used for all receipt thumbnails. Remote images from Vercel Blob need a `remotePatterns` entry in `next.config.ts`.

## What to avoid

- `export const dynamic = "force-dynamic"` is almost never needed in this app.
- Do not use `useEffect` to load initial data that a Server Component could provide.
- Do not store computed values (`expiryDate` status) in the DB — compute them at render time.
