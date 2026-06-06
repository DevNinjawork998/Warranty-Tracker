import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
	db: {
		warranty: {
			create: vi.fn().mockResolvedValue({
				id: "w1",
				userId: "user-1",
				productName: "Test",
				category: "Electronics",
				purchaseDate: new Date("2024-01-01"),
				warrantyMonths: 12,
				expiryDate: new Date("2025-01-01"),
				priceMyr: null,
				storeName: null,
				serialNumber: null,
				receiptImageUrl: null,
				notes: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			findMany: vi.fn().mockResolvedValue([]),
		},
	},
}));

vi.mock("@/lib/session", () => ({
	getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

import { POST } from "@/app/api/warranties/route";
import { db } from "@/lib/db";

function makeRequest(body: Record<string, unknown>) {
	return new Request("http://localhost/api/warranties", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/warranties — expiryDate computation", () => {
	it("computes expiryDate as purchaseDate + warrantyMonths (12 months)", async () => {
		await POST(
			makeRequest({
				productName: "TV",
				purchaseDate: "2024-01-01",
				warrantyMonths: 12,
				category: "Electronics",
			}),
		);
		const call = vi.mocked(db.warranty.create).mock.calls[0][0];
		expect(call.data.expiryDate).toEqual(new Date("2025-01-01"));
	});

	it("handles end-of-month: Jan 31 + 1 month → Feb 29 (2024 leap year)", async () => {
		vi.mocked(db.warranty.create).mockClear();
		await POST(
			makeRequest({
				productName: "TV",
				purchaseDate: "2024-01-31",
				warrantyMonths: 1,
				category: "Electronics",
			}),
		);
		const call = vi.mocked(db.warranty.create).mock.calls[0][0];
		expect(call.data.expiryDate).toEqual(new Date("2024-02-29"));
	});

	it("handles end-of-month: Jan 31 + 1 month → Feb 28 (2023 non-leap year)", async () => {
		vi.mocked(db.warranty.create).mockClear();
		await POST(
			makeRequest({
				productName: "TV",
				purchaseDate: "2023-01-31",
				warrantyMonths: 1,
				category: "Electronics",
			}),
		);
		const call = vi.mocked(db.warranty.create).mock.calls[0][0];
		expect(call.data.expiryDate).toEqual(new Date("2023-02-28"));
	});

	it("returns 400 when warrantyMonths is 0", async () => {
		const res = await POST(
			makeRequest({
				productName: "TV",
				purchaseDate: "2024-01-01",
				warrantyMonths: 0,
				category: "Electronics",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 when productName is missing", async () => {
		const res = await POST(
			makeRequest({
				purchaseDate: "2024-01-01",
				warrantyMonths: 12,
				category: "Electronics",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 when purchaseDate format is invalid", async () => {
		const res = await POST(
			makeRequest({
				productName: "TV",
				purchaseDate: "01-01-2024",
				warrantyMonths: 12,
				category: "Electronics",
			}),
		);
		expect(res.status).toBe(400);
	});
});
