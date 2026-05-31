# Test-Driven Development — Warranty Tracker

This project uses **Vitest** + **React Testing Library** + **MSW** (Mock Service Worker) for unit and integration tests. Follow the Red → Green → Refactor cycle.

## Setup (if not yet installed)

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

Add to `package.json`:
```json
"test": "vitest",
"test:run": "vitest run",
"test:coverage": "vitest run --coverage"
```

Add `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
```

`tests/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

## File conventions
- Test files: `*.test.ts` or `*.test.tsx`, co-located next to the file being tested, OR in `tests/` at the root.
- Unit tests for pure functions: `lib/*.test.ts`
- Component tests: `components/*.test.tsx`
- API route integration tests: `tests/api/*.test.ts` (use `msw` to intercept fetch)

## What to test in this project

### Must-test (high business value / bug risk)
1. `lib/warranty-status.ts` — `getStatus()` with boundary dates (0 days, 30 days, 31 days, -1 days)
2. `app/api/warranties/route.ts` — POST handler: correct `expiryDate` computation from various `purchaseDate` + `warrantyMonths` combinations
3. `app/upload/review/page.tsx` — form validation: required fields missing, warranty period of 0 months rejected
4. `components/warranty-card.tsx` — renders correct status badge colour for each status
5. `components/warranty-list.tsx` — filter tabs show the correct subset of warranties

### TDD workflow
1. **Red**: write the test first; run `npx vitest run path/to/file.test.ts` and confirm it fails.
2. **Green**: write the minimal implementation to make it pass.
3. **Refactor**: clean up without breaking the test.

## Example: warranty-status unit test

```ts
// lib/warranty-status.test.ts
import { describe, it, expect } from "vitest";
import { getStatus } from "./warranty-status";

const TODAY = new Date("2025-01-15");

describe("getStatus", () => {
  it("returns active when >30 days remain", () => {
    const expiry = new Date("2025-03-01");
    expect(getStatus(expiry, TODAY)).toBe("active");
  });

  it("returns expiring_soon on the 30-day boundary", () => {
    const expiry = new Date("2025-02-14"); // exactly 30 days
    expect(getStatus(expiry, TODAY)).toBe("expiring_soon");
  });

  it("returns expired when expiry is in the past", () => {
    const expiry = new Date("2025-01-14");
    expect(getStatus(expiry, TODAY)).toBe("expired");
  });
});
```

## Mocking Prisma in API tests
Do **not** mock Prisma directly. Use a test database (separate `DATABASE_URL` in `.env.test`) and Prisma migrations. Reset between tests using `prisma.$transaction` rollback or `prisma.warranty.deleteMany()` in `afterEach`.

## Mocking fetch / API calls in component tests
Use MSW v2:
```ts
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.post("/api/ocr", () => HttpResponse.json({ product_name: "TV", warranty_months: 12 }))
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Coverage target
- `lib/` utilities: 100%
- API route handlers: key happy-path + auth failure path
- Components: interaction tests for forms and filter tabs
