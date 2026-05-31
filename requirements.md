# Warranty Tracker — POC Requirements

Malaysia-focused mobile web app (PWA) where users upload receipt photos, extract warranty details via OCR, track expiry dates, and receive push + email notifications before warranties expire.

---

## Features

### F1 — Receipt Upload & OCR Processing
- User uploads a receipt image (camera capture or file pick)
- OCR extracts: product name, purchase date, price, warranty period (months/years)
- Auto-suggest product category if identifiable from the receipt text
- Handle imperfect/low-quality scans gracefully (partial extraction is acceptable)

### F2 — Manual Override & Corrections
- After OCR, display extracted fields in an editable form
- User can correct any field before saving: product name, date, warranty length, category, price
- This review/edit step is mandatory before data is persisted

### F3 — Warranty Dashboard
- List view of all saved warranty items showing:
  - Product name
  - Purchase date
  - Warranty expiration date (computed from purchase date + warranty period)
  - Status badge: **Active** (green) / **Expiring Soon** (yellow, ≤30 days) / **Expired** (red)
- Sort/filter by status

### F4 — Expiry Notifications
- User-configurable default alert window (default: 30 days before expiry)
- Delivery channels:
  - Push notifications (Web Push API / service worker)
  - Email to registered address
- Expired items are clearly flagged on the dashboard

### F5 — User Authentication
- Sign up / login so data persists across sessions and devices
- Each user's warranty items are private to their account

---

## Out of Scope (POC)
- Bulk import
- Sharing warranties with other users
- Hardware barcode/QR scanning
- Retailer integrations
