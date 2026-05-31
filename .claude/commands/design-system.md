# Design System — Warranty Tracker

This app is a **mobile-first PWA**. All UI decisions prioritise one-handed phone use, readable at arm's length, and clear status communication.

## Component library
Use **shadcn/ui** components. Do not build custom primitives for things that already exist in shadcn. Add missing components via `npx shadcn@latest add <component> --yes`.

Available components already installed:
`button`, `input`, `label`, `select`, `textarea`, `badge`, `card`, `tabs`, `separator`, `sonner` (toaster), `dialog`, `form`

## Layout rules
- Max content width: `max-w-lg mx-auto` — keeps the UI phone-width even on desktop.
- Sticky header pattern: `sticky top-0 z-10 bg-background border-b px-4 py-3`.
- Page padding: `px-4 py-6` with `space-y-6` for section gaps.
- Bottom CTAs (submit buttons) use `w-full` so they span the full width on mobile.

## Colour coding for warranty status
These are non-negotiable — they are the primary communication mechanism of the app:

| Status | Tailwind class | Meaning |
|--------|---------------|---------|
| Active | `bg-green-500 text-white` | Warranty is valid |
| Expiring Soon | `bg-amber-500 text-white` | ≤30 days until expiry |
| Expired | destructive (red) | Warranty has lapsed |

These are applied via `<StatusBadge>` in `components/status-badge.tsx`. Do not render status with text colour alone — always use a `<Badge>`.

## Typography
- Geist Sans (variable `--font-geist-sans`) is the only body font.
- Page titles: `font-semibold text-lg` in the sticky header.
- Card product names: `font-semibold truncate` (truncate prevents overflow on long names).
- Secondary/label text: `text-muted-foreground`.
- Micro labels: `text-xs`.

## Cards
Warranty items use `<WarrantyCard>` which follows this structure:
- `CardHeader`: product name + category on the left, `<StatusBadge>` on the right (flexrow, gap-2, items-start).
- `CardContent`: key-value pairs with `text-muted-foreground` labels and right-aligned values (`flex justify-between`).

## Empty states
Center-aligned, `py-10 sm:py-20`, a short sentence in `text-muted-foreground`, followed by a primary `<Button>` CTA.

## Forms
- Required field labels end with `*`.
- Field errors are displayed as `<p className="text-xs text-destructive">` immediately below the input.
- Auto-filled (OCR-extracted) fields show an `<Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>` chip next to the label.

## Navigation
- No bottom tab bar for this POC. Navigation is via buttons in the sticky header.
- Back navigation: a plain `←` text button (`text-muted-foreground hover:text-foreground`) on the left of the header; use `router.back()`.

## Icons
Use Lucide React (`lucide-react`) for any icons needed. Do not use emoji in production UI except as one-off illustration in empty states.

## Dark mode
Not in scope for this POC. Do not add `dark:` variants unless they come from shadcn components by default.
