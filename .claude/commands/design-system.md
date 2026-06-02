# Design System — Warranty Tracker

Mobile-first PWA. All UI decisions prioritise one-handed phone use, readable at arm's length, clear status communication.

## Theme — Lavender / Purple (Stitch design)

CSS variables in `app/globals.css` (oklch color space):

```css
--background: oklch(0.965 0.012 280);   /* light lavender page bg */
--primary:    oklch(0.46 0.22 278);     /* deep purple */
--primary-foreground: oklch(0.99 0 0);
--card:       oklch(1 0 0);             /* white cards stand out from lavender bg */
```

White cards on lavender background is the core visual contrast. Never use `bg-background` for cards.

## Component library

Use **shadcn/ui** components. Do not build custom primitives for things that already exist in shadcn. Add missing components via `npx shadcn@latest add <component> --yes`.

Available installed: `button`, `input`, `label`, `select`, `textarea`, `badge`, `card`, `tabs`, `separator`, `sonner` (toaster), `dialog`, `form`

Custom components (do not recreate):
- `components/bottom-nav.tsx` — fixed bottom 3-tab nav
- `components/warranty-card.tsx` — clickable warranty card → detail page
- `components/warranty-list.tsx` — list with showAll toggle
- `components/status-badge.tsx` — outline pill badge
- `components/warranty-delete-button.tsx` — inline confirm delete

## Layout rules

- Max content width: `max-w-lg mx-auto`.
- Sticky header: `sticky top-0 z-10 bg-card border-b px-4 py-3`.
- Page padding: `px-4 py-6` with `space-y-6` for section gaps.
- All pages need `pb-20` to clear the fixed bottom nav.
- Bottom CTAs: `w-full rounded-2xl py-4 font-semibold`.

## Bottom navigation

`<BottomNav />` is present on all main pages (dashboard, upload, settings, warranty detail, edit).
Three tabs: Dashboard (`/dashboard`), Upload (`/upload`), Settings (`/settings`).
Active tab: pill `bg-primary/10 text-primary rounded-2xl`. Inactive: `text-muted-foreground`.
FAB for upload action: fixed `bottom-20 right-4`, purple circle `+` button, links to `/upload`.

## Status badge — outline pill

`components/status-badge.tsx` renders a plain `<span>` (not shadcn `<Badge>`):

| Status | Style |
|--------|-------|
| active | `border border-green-500 text-green-600 bg-green-50 rounded-full` |
| expiring_soon | `border border-amber-500 text-amber-600 bg-amber-50 rounded-full` |
| expired | `border border-red-300 text-red-400 bg-red-50 rounded-full` |

Do not use filled `bg-green-500` badges — that was the old design.

## Warranty card

`components/warranty-card.tsx` — full card is `<Link href="/warranty/${id}">`.

Structure:
```
product name (font-semibold)          [StatusBadge]
store name (text-xs muted)

┌─ bg-muted rounded-xl ──────────────────────────┐
│ Purchased         Expires                       │
│ 12 Oct 2023       12 Oct 2024                   │
│                   14 days left  (amber/green)   │
└─────────────────────────────────────────────────┘

S/N: XXXXX  (when present, text-xs muted)

RM 5,499.00                        ⋮ (MoreVertical)
```

Expired card: `opacity-60`.

## Cards / sections

- Card container: `bg-card rounded-2xl border p-4` or `p-5`.
- Section label: `text-xs font-bold tracking-widest text-muted-foreground uppercase`.
- Field rows (forms): `flex items-center gap-3 border rounded-xl px-4 py-3 bg-background min-h-[52px]` with icon + input.
- Dividers inside cards: `divide-y` on container, `py-3` on each row.

## Typography

- Geist Sans only.
- Page titles: `font-semibold text-lg` in header.
- Product names on detail page: `text-xl font-bold text-primary`.
- Card product names: `font-semibold text-base`.
- Secondary/label text: `text-muted-foreground`.
- Micro labels: `text-xs`.

## Forms (review / edit pages)

- Section header: `text-xs font-semibold tracking-widest text-muted-foreground uppercase`.
- OCR badge: `border border-primary/40 text-primary rounded-full px-3 py-0.5 text-xs font-medium bg-primary/5` with `✦ OCR Applied`.
- Field errors: `<p className="text-xs text-destructive">` below input.
- Warranty period: single `<select>` with preset month options (1, 3, 6, 12, 18, 24, 36, 48, 60).
- Primary CTA: `bg-primary text-primary-foreground rounded-2xl py-4 font-semibold` full-width.
- Secondary CTA: `border rounded-2xl py-4 font-semibold` full-width.

## Upload page

- Drop zone (no file selected): `rounded-2xl border-2 border-dashed border-primary/30 bg-card pt-20 pb-16 gap-10`.
- Icon container: `w-20 h-20 rounded-2xl bg-muted` with `<Scan>` icon.
- Title: `font-bold text-xl`.
- After file selected: show image (`aspect-[3/4]`) or PDF (`<iframe>` 480px) with "Change file/image" outline button below.
- Security note below CTA: `<Lock>` icon + "Securely encrypted and processed locally." in `text-xs text-muted-foreground`.

## Navigation

- Back button: `←` text, `router.back()`, left of header.
- `<Bell>` icon right of header (visual only for now).
- Bottom nav handles tab switching — no nav links in header except back.

## Icons

Lucide React only. No emoji in production UI.

Key icons in use: `LayoutGrid` (dashboard tab), `Camera` (upload tab), `Settings` (settings tab), `Scan` (drop zone), `Lock` (security note), `Bell` (header), `MoreVertical` (card kebab), `AlertTriangle` (status banners), `BookmarkCheck` (save CTA), `Trash2` (delete), `Pencil` (edit), `Download` (receipt), `Maximize2` (receipt zoom).

## Dark mode

Not in scope. Do not add `dark:` variants.
