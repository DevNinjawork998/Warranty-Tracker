import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReviewPage from "./page";

// Stable router — hoisted so vi.mock factory can access it before variable declarations
const mockRouter = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));

vi.mock("next/navigation", () => ({
	useRouter: () => mockRouter,
}));

vi.mock("next/image", () => ({
	default: ({ src, alt }: { src: string; alt: string }) => (
		<img src={src} alt={alt} />
	),
}));

vi.mock("@/components/bottom-nav", () => ({
	BottomNav: () => null,
}));

const VALID_OCR = JSON.stringify({
	product_name: "Samsung TV",
	purchase_date: "2024-01-01",
	warranty_months: 12,
	category: "Electronics",
	receipt_preview: null,
	receipt_image_url: null,
});

function mockFetch(status: number, body: unknown) {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue(
			new Response(JSON.stringify(body), {
				status,
				headers: { "Content-Type": "application/json" },
			}),
		),
	);
}

beforeEach(() => {
	sessionStorage.setItem("ocr_result", VALID_OCR);
	mockRouter.push.mockClear();
	mockRouter.back.mockClear();
	mockFetch(201, { id: "w1", productName: "Samsung TV" });
});

afterEach(() => {
	sessionStorage.clear();
	vi.unstubAllGlobals();
});

describe("ReviewPage", () => {
	it("redirects to /upload when sessionStorage is empty", async () => {
		sessionStorage.clear();
		render(<ReviewPage />);
		await waitFor(() =>
			expect(mockRouter.push).toHaveBeenCalledWith("/upload"),
		);
	});

	it("populates product name from OCR result", async () => {
		render(<ReviewPage />);
		await waitFor(() =>
			expect(screen.getByPlaceholderText("e.g. iPhone 15 Pro")).toHaveValue(
				"Samsung TV",
			),
		);
	});

	it("shows validation error when product name is cleared and form submitted", async () => {
		const user = userEvent.setup();
		render(<ReviewPage />);

		await waitFor(() =>
			expect(screen.getByPlaceholderText("e.g. iPhone 15 Pro")).toHaveValue(
				"Samsung TV",
			),
		);

		await user.clear(screen.getByPlaceholderText("e.g. iPhone 15 Pro"));
		await user.click(screen.getByRole("button", { name: /confirm & save/i }));

		await screen.findByText("Product name is required");
	});

	it("does not call fetch when product name is empty", async () => {
		const user = userEvent.setup();
		render(<ReviewPage />);
		await waitFor(() =>
			expect(screen.getByPlaceholderText("e.g. iPhone 15 Pro")).toHaveValue(
				"Samsung TV",
			),
		);

		await user.clear(screen.getByPlaceholderText("e.g. iPhone 15 Pro"));
		await user.click(screen.getByRole("button", { name: /confirm & save/i }));

		await screen.findByText("Product name is required");
		expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled();
	});

	it("redirects to /dashboard on successful submit", async () => {
		const user = userEvent.setup();
		render(<ReviewPage />);

		await waitFor(() =>
			expect(screen.getByPlaceholderText("e.g. iPhone 15 Pro")).toHaveValue(
				"Samsung TV",
			),
		);

		await user.click(screen.getByRole("button", { name: /confirm & save/i }));

		await waitFor(() =>
			expect(mockRouter.push).toHaveBeenCalledWith("/dashboard"),
		);
	});

	it("shows error message when API returns failure", async () => {
		mockFetch(500, { error: "Server error" });

		const user = userEvent.setup();
		render(<ReviewPage />);

		await waitFor(() =>
			expect(screen.getByPlaceholderText("e.g. iPhone 15 Pro")).toHaveValue(
				"Samsung TV",
			),
		);

		await user.click(screen.getByRole("button", { name: /confirm & save/i }));

		await screen.findByText("Failed to save warranty. Please try again.");
	});
});
