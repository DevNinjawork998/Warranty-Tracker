import { describe, expect, it } from "vitest";
import { getStatus } from "./warranty-status";

const TODAY = new Date("2025-01-15T12:00:00Z");

describe("getStatus", () => {
	it("returns active when more than 30 days remain", () => {
		expect(getStatus(new Date("2025-03-15T12:00:00Z"), TODAY)).toBe("active");
	});

	it("returns active when exactly 31 days remain", () => {
		expect(getStatus(new Date("2025-02-15T12:00:00Z"), TODAY)).toBe("active");
	});

	it("returns expiring_soon on exactly 30-day boundary", () => {
		expect(getStatus(new Date("2025-02-14T12:00:00Z"), TODAY)).toBe("expiring_soon");
	});

	it("returns expiring_soon when 1 day remains", () => {
		expect(getStatus(new Date("2025-01-16T12:00:00Z"), TODAY)).toBe("expiring_soon");
	});

	it("returns expiring_soon when expiry is today (0 days)", () => {
		expect(getStatus(new Date("2025-01-15T12:00:00Z"), TODAY)).toBe("expiring_soon");
	});

	it("returns expired when expiry was yesterday", () => {
		expect(getStatus(new Date("2025-01-14T12:00:00Z"), TODAY)).toBe("expired");
	});

	it("returns expired for a date far in the past", () => {
		expect(getStatus(new Date("2023-01-01T12:00:00Z"), TODAY)).toBe("expired");
	});
});
