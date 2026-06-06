import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { WarrantyCard } from "./warranty-card";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

const FIXED_NOW = new Date("2025-01-15T12:00:00Z");

beforeAll(() => {
	vi.useFakeTimers();
	vi.setSystemTime(FIXED_NOW);
});

afterAll(() => {
	vi.useRealTimers();
});

const base = {
	id: "w1",
	productName: "Samsung TV",
	category: "Electronics",
	purchaseDate: new Date("2024-01-15T12:00:00Z"),
	priceMyr: null,
	storeName: null,
	serialNumber: null,
	receiptImageUrl: null,
};

describe("WarrantyCard — status badge", () => {
	it("shows Active badge (green) when more than 30 days remain", () => {
		render(
			<WarrantyCard {...base} expiryDate={new Date("2025-04-01T12:00:00Z")} />,
		);
		const badge = screen.getByText("Active");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("text-green-600");
	});

	it("shows Expiring Soon badge (amber) when ≤30 days remain", () => {
		render(
			<WarrantyCard {...base} expiryDate={new Date("2025-02-10T12:00:00Z")} />,
		);
		const badge = screen.getByText("Expiring Soon");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("text-amber-600");
	});

	it("shows Expired badge (red) when past expiry", () => {
		render(
			<WarrantyCard {...base} expiryDate={new Date("2025-01-01T12:00:00Z")} />,
		);
		const badge = screen.getByText("Expired");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("text-red-400");
	});

	it("renders product name", () => {
		render(
			<WarrantyCard {...base} expiryDate={new Date("2025-04-01T12:00:00Z")} />,
		);
		expect(screen.getByText("Samsung TV")).toBeInTheDocument();
	});

	it("shows days left for active warranty", () => {
		// Jan 15 → Apr 15 = 90 days
		render(
			<WarrantyCard {...base} expiryDate={new Date("2025-04-15T12:00:00Z")} />,
		);
		expect(screen.getByText("90 days left")).toBeInTheDocument();
	});

	it("shows days left in amber for expiring soon", () => {
		// Jan 15 → Feb 10 = 26 days
		render(
			<WarrantyCard {...base} expiryDate={new Date("2025-02-10T12:00:00Z")} />,
		);
		expect(screen.getByText("26 days left")).toBeInTheDocument();
	});

	it("renders store name when provided", () => {
		render(
			<WarrantyCard
				{...base}
				expiryDate={new Date("2025-04-01T12:00:00Z")}
				storeName="Apple Malaysia"
			/>,
		);
		expect(screen.getByText("Apple Malaysia")).toBeInTheDocument();
	});

	it("renders serial number when provided", () => {
		render(
			<WarrantyCard
				{...base}
				expiryDate={new Date("2025-04-01T12:00:00Z")}
				serialNumber="SN-12345"
			/>,
		);
		expect(screen.getByText("S/N: SN-12345")).toBeInTheDocument();
	});

	it("renders price when provided", () => {
		render(
			<WarrantyCard
				{...base}
				expiryDate={new Date("2025-04-01T12:00:00Z")}
				priceMyr={1299.99}
			/>,
		);
		expect(screen.getByText("RM 1299.99")).toBeInTheDocument();
	});
});
