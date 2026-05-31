# Security Review — Warranty Tracker

You are performing a targeted security review of the Warranty Tracker codebase. This app handles user authentication, receipt images, and personal warranty data. Focus on the threat surface specific to this project.

## Review checklist

### Authentication & session
- [ ] `lib/auth.ts` — verify bcrypt work factor is ≥12, no timing-safe comparison bugs in Credentials provider
- [ ] JWT secret is sourced from `AUTH_SECRET` env var (never hardcoded)
- [ ] `proxy.ts` — confirm all routes under `/dashboard`, `/upload`, `/settings` require an authenticated session
- [ ] `app/api/auth/register/route.ts` — check for rate limiting on signup (brute-force protection); confirm email uniqueness check is atomic

### API route authorization
For every route under `app/api/`:
- [ ] Confirm `const session = await auth()` is called and `session?.user?.id` is checked before any DB or storage access
- [ ] Confirm user-owned resources (warranties, push subscriptions, notification settings) are always filtered by `userId: session.user.id` — no horizontal privilege escalation possible

### Input validation
- [ ] All POST/PATCH routes validate input with Zod before touching the DB
- [ ] File upload in `app/api/ocr/route.ts` — check MIME type is actually an image before sending to Claude, limit file size
- [ ] `warrantyMonths` must be a positive integer — confirm the Zod schema enforces this

### Secrets & environment
- [ ] No API keys in source code or committed `.env*` files — check `git log` and `.gitignore`
- [ ] `CRON_SECRET` header check in `/api/cron/notify` — verify it is a constant-time comparison
- [ ] `SUPABASE_*` or other legacy keys are not left in `.env.local`

### Vercel Blob storage
- [ ] Receipt images are stored under a user-specific prefix (`receipts/<userId>/...`) — verify in `app/api/ocr/route.ts`
- [ ] Blob URLs returned to the client are not guessable for other users' receipts (confirm public vs private access setting)

### Injection & XSS
- [ ] No `dangerouslySetInnerHTML` in any component
- [ ] The Resend email HTML template in `/api/cron/notify` must not render un-sanitised user input (product name, notes) — check for XSS

### Web Push
- [ ] VAPID keys are in env vars, not hardcoded
- [ ] `app/api/push/subscribe` does not allow one user to register another user's endpoint — subscription is always stored under `session.user.id`

## How to run
Read the files identified above, flag any issue with: **severity** (Critical / High / Medium / Low), **file:line**, and a **remediation** step. Do not make changes — report only.
