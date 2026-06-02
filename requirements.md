# Warranty Tracker — POC Requirements

Malaysia-focused mobile web app (PWA) where users upload receipt photos, extract warranty details via OCR, track expiry dates, and receive push + email notifications before warranties expire.

---

## Features

### F1 — Receipt Upload & OCR Processing
- User uploads a receipt image (camera capture or file pick)
- OCR extracts: product name, purchase date, price, warranty period (months/years)
- Auto-suggest product category if identifiable from the receipt text
- Handle imperfect/low-quality scans gracefully (partial extraction is acceptable)

**Implemented:**
- Upload page at `/upload` accepts JPEG, PNG, WEBP, and PDF
- File is uploaded to Vercel Blob (private store) and simultaneously converted to base64 for Claude
- OCR via `claude-sonnet-4-6` vision API at `POST /api/ocr`; returns structured JSON with `product_name`, `purchase_date`, `price_myr`, `warranty_months`, `category`
- Partial extraction is acceptable — any null fields are left blank for the user to fill in
- Receipt preview stored as a local data URL in `sessionStorage` (images shown with `next/image`, PDFs rendered in an `<iframe>`)

---

### F2 — Manual Override & Corrections
- After OCR, display extracted fields in an editable form
- User can correct any field before saving: product name, date, warranty length, category, price
- This review/edit step is mandatory before data is persisted

**Implemented:**
- Review page at `/upload/review` reads OCR result from `sessionStorage`
- Auto-filled fields are labelled with an **Auto-filled** badge
- Warranty period split into Years + Months inputs for ease of entry
- Zod + react-hook-form validation; at least 1 month warranty required before saving
- On save, `POST /api/warranties` computes `expiryDate = addMonths(purchaseDate, warrantyMonths)` and persists to DB

---

### F3 — Warranty Dashboard
- List view of all saved warranty items showing:
  - Product name
  - Purchase date
  - Warranty expiration date (computed from purchase date + warranty period)
  - Status badge: **Active** (green) / **Expiring Soon** (yellow, ≤30 days) / **Expired** (red)
- Sort/filter by status

**Implemented:**
- Dashboard at `/dashboard` (server component); warranties sorted by `expiryDate` ascending
- Status computed at render time from `expiryDate` via `lib/warranty-status.ts`; never stored in DB
- `<WarrantyList>` client component handles status badge display
- Push permission prompt shown once on first dashboard visit

---

### F4 — Expiry Notifications
- User-configurable default alert window (default: 30 days before expiry)
- Delivery channels:
  - Push notifications (Web Push API / service worker)
  - Email to registered address
- Expired items are clearly flagged on the dashboard

**Implemented:**
- Settings page at `/settings` — configure `alertDaysBefore` (1–365), toggle email and push independently
- Vercel Cron at `GET /api/cron/notify` runs daily at 08:00 UTC (~4 PM MYT); secured with `CRON_SECRET`
- Push via `web-push` library with VAPID keys; stale subscriptions auto-deleted on delivery failure
- Email via Resend; `RESEND_FROM_EMAIL` configurable; HTML email lists all expiring warranties
- Service worker at `public/sw-push.js` handles `push` and `notificationclick` events
- Push subscription upserted by endpoint at `POST /api/push/subscribe`

---

### F5 — User Authentication
- Sign up / login so data persists across sessions and devices
- Each user's warranty items are private to their account

**Implemented:**
- Auth.js v5 (next-auth beta) with Credentials provider; JWT session strategy
- Sign up at `/auth/signup` — bcryptjs password hashing; `NotificationSettings` seeded on register
- Login at `/auth/login`; route guard in `proxy.ts` protects all non-auth routes
- `session.user.id` injected via session callback in `lib/auth.ts`
- Auth bypass flag (`BYPASS_AUTH=true` + `DEV_USER_ID`) for local development without login

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 App Router (Turbopack) |
| Auth | Auth.js v5 (`next-auth@beta`) — Credentials provider, JWT sessions |
| Database ORM | Prisma v7 — PostgreSQL 17 via Docker locally |
| Image storage | Vercel Blob (private store) |
| OCR | Claude Sonnet (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| UI | shadcn/ui + Tailwind v4 |
| Email | Resend |
| Push | Web Push API (`web-push`) + manual service worker |
| Scheduling | Vercel Cron (`vercel.json`) — 08:00 UTC daily |

---

## Out of Scope (POC)
- Bulk import
- Sharing warranties with other users
- Hardware barcode/QR scanning
- Retailer integrations
