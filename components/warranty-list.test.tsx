import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { WarrantyList } from "./warranty-list";

vi.mock("./warranty-card", () => ({
	WarrantyCard: ({ productName }: { productName: string }) => (
		<div data-testid="warranty-card">{productName}</div>
	),
}));

function makeWarranty(id: string, name: string) {
	return {
		id,
		productName: name,
		category: "Electronics",
		purchaseDate: "2024-01-01",
		expiryDate: "2026-01-01",
		priceMyr: null,
		storeName: null,
		serialNumber: null,
		receiptImageUrl: null,
	};
}

const SIX = Array.from({ length: 6 }, (_, i) => makeWarranty(`w${i + 1}`, `Product ${i + 1}`));
const FIVE = SIX.slice(0, 5);

describe("WarrantyList", () => {
	it("shows empty message when no warranties", () => {
		render(<WarrantyList warranties={[]} />);
		expect(screen.getByText("No warranties found.")).toBeInTheDocument();
	});

	it("renders all cards when 5 or fewer", () => {
		render(<WarrantyList warranties={FIVE} />);
		expect(screen.getAllByTestId("warranty-card")).toHaveLength(5);
	});

	it("hides View All button when 5 or fewer warranties", () => {
		render(<WarrantyList warranties={FIVE} />);
		expect(screen.queryByText("View All")).not.toBeInTheDocument();
	});

	it("shows only first 5 when more than 5 warranties", () => {
		render(<WarrantyList warranties={SIX} />);
		expect(screen.getAllByTestId("warranty-card")).toHaveLength(5);
	});

	it("shows View All button when more than 5 warranties", () => {
		render(<WarrantyList warranties={SIX} />);
		expect(screen.getByText("View All")).toBeInTheDocument();
	});

	it("shows all 6 cards after clicking View All", async () => {
		const user = userEvent.setup();
		render(<WarrantyList warranties={SIX} />);
		await user.click(screen.getByText("View All"));
		expect(screen.getAllByTestId("warranty-card")).toHaveLength(6);
	});

	it("hides View All button after clicking it", async () => {
		const user = userEvent.setup();
		render(<WarrantyList warranties={SIX} />);
		await user.click(screen.getByText("View All"));
		expect(screen.queryByText("View All")).not.toBeInTheDocument();
	});

	it("shows correct product names", () => {
		render(<WarrantyList warranties={FIVE} />);
		for (let i = 1; i <= 5; i++) {
			expect(screen.getByText(`Product ${i}`)).toBeInTheDocument();
		}
	});
});
