"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	BookmarkCheck,
	Calendar,
	LayoutGrid,
	Maximize2,
	ShieldCheck,
	Store,
	Wallet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { BottomNav } from "@/components/bottom-nav";

const CATEGORIES = [
	"Electronics",
	"Appliance",
	"Furniture",
	"Automotive",
	"Other",
] as const;

const WARRANTY_OPTIONS = [
	{ label: "1 Month", value: 1 },
	{ label: "3 Months", value: 3 },
	{ label: "6 Months", value: 6 },
	{ label: "12 Months", value: 12 },
	{ label: "18 Months", value: 18 },
	{ label: "24 Months", value: 24 },
	{ label: "36 Months", value: 36 },
	{ label: "48 Months", value: 48 },
	{ label: "60 Months", value: 60 },
];

const schema = z.object({
	productName: z.string().min(1, "Product name is required"),
	storeName: z.string().optional(),
	purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
	priceMyr: z.number().min(0).nullable().optional(),
	warrantyMonths: z.number().int().min(1),
	category: z.enum(CATEGORIES),
	serialNumber: z.string().optional(),
	notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function FieldRow({
	icon: Icon,
	children,
}: {
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-background min-h-[52px]">
			<Icon className="w-4 h-4 text-muted-foreground shrink-0" />
			<div className="flex-1 min-w-0">{children}</div>
		</div>
	);
}

export default function EditWarrantyPage() {
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = params.id;

	const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { category: "Other", warrantyMonths: 12 },
	});

	useEffect(() => {
		fetch(`/api/warranties/${id}`)
			.then((r) => r.json())
			.then((w) => {
				setValue("productName", w.productName);
				if (w.storeName) setValue("storeName", w.storeName);
				if (w.serialNumber) setValue("serialNumber", w.serialNumber);
				if (w.notes) setValue("notes", w.notes);
				if (w.priceMyr) setValue("priceMyr", Number(w.priceMyr));
				setValue("purchaseDate", w.purchaseDate.slice(0, 10));
				setValue("category", w.category);
				const closest = WARRANTY_OPTIONS.reduce((prev, cur) =>
					Math.abs(cur.value - w.warrantyMonths) <
					Math.abs(prev.value - w.warrantyMonths)
						? cur
						: prev,
				);
				setValue("warrantyMonths", closest.value);
				if (w.receiptImageUrl) setReceiptUrl(`/api/receipt/${id}`);
				setLoading(false);
			});
	}, [id, setValue]);

	async function onSubmit(data: FormValues) {
		setSubmitting(true);
		setError(null);

		const res = await fetch(`/api/warranties/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				productName: data.productName,
				storeName: data.storeName ?? null,
				category: data.category,
				purchaseDate: data.purchaseDate,
				warrantyMonths: data.warrantyMonths,
				priceMyr: data.priceMyr ?? null,
				serialNumber: data.serialNumber ?? null,
				notes: data.notes ?? null,
			}),
		});

		if (!res.ok) {
			setError("Failed to save. Please try again.");
			setSubmitting(false);
			return;
		}

		router.push(`/warranty/${id}`);
		router.refresh();
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
				Loading…
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-20">
			<header className="px-4 py-4 flex items-center gap-3">
				<button
					type="button"
					onClick={() => router.back()}
					className="text-foreground"
				>
					←
				</button>
				<h1 className="font-bold text-xl">Review Details</h1>
			</header>

			<main className="max-w-lg mx-auto px-4 space-y-5">
				{/* Receipt preview */}
				{receiptUrl && (
					<section className="space-y-2">
						<p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
							Receipt Preview
						</p>
						<div className="relative rounded-2xl overflow-hidden border">
							<iframe
								src={receiptUrl}
								className="w-full"
								style={{ height: 260 }}
								title="Receipt"
							/>
							<a
								href={receiptUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="absolute bottom-3 right-3 bg-card/90 backdrop-blur rounded-full p-2 shadow"
								aria-label="View full receipt"
							>
								<Maximize2 className="w-4 h-4" />
							</a>
						</div>
					</section>
				)}

				{/* Form */}
				<section className="space-y-2">
					<div className="flex items-center justify-between">
						<p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
							Extracted Details
						</p>
						<span className="flex items-center gap-1 border border-primary/40 text-primary rounded-full px-3 py-0.5 text-xs font-medium bg-primary/5">
							✦ OCR Applied
						</span>
					</div>

					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="bg-card rounded-2xl border divide-y">
							<div className="p-4 space-y-1.5">
								<label
									htmlFor="edit-productName"
									className="text-sm font-medium"
								>
									Product Name
								</label>
								<input
									id="edit-productName"
									{...register("productName")}
									placeholder="e.g. iPhone 15 Pro"
									className="w-full border rounded-xl px-4 py-3 text-sm bg-background outline-none focus:ring-2 focus:ring-primary/30"
								/>
								{errors.productName && (
									<p className="text-xs text-destructive">
										{errors.productName.message}
									</p>
								)}
							</div>

							<div className="p-4 space-y-1.5">
								<label htmlFor="edit-storeName" className="text-sm font-medium">
									Merchant / Store
								</label>
								<FieldRow icon={Store}>
									<input
										id="edit-storeName"
										{...register("storeName")}
										placeholder="e.g. Apple Malaysia"
										className="w-full text-sm bg-transparent outline-none"
									/>
								</FieldRow>
							</div>

							<div className="p-4 space-y-1.5">
								<label
									htmlFor="edit-purchaseDate"
									className="text-sm font-medium"
								>
									Purchase Date
								</label>
								<FieldRow icon={Calendar}>
									<input
										id="edit-purchaseDate"
										type="date"
										{...register("purchaseDate")}
										className="w-full text-sm bg-transparent outline-none"
									/>
								</FieldRow>
								{errors.purchaseDate && (
									<p className="text-xs text-destructive">
										{errors.purchaseDate.message}
									</p>
								)}
							</div>

							<div className="p-4 space-y-1.5">
								<label htmlFor="edit-priceMyr" className="text-sm font-medium">
									Price
								</label>
								<FieldRow icon={Wallet}>
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">RM</span>
										<input
											id="edit-priceMyr"
											type="number"
											step="0.01"
											min={0}
											{...register("priceMyr", { valueAsNumber: true })}
											placeholder="0.00"
											className="flex-1 text-sm bg-transparent outline-none"
										/>
									</div>
								</FieldRow>
							</div>

							<div className="p-4 space-y-1.5">
								<label
									htmlFor="edit-warrantyMonths"
									className="text-sm font-medium"
								>
									Warranty Period
								</label>
								<FieldRow icon={ShieldCheck}>
									<Controller
										name="warrantyMonths"
										control={control}
										render={({ field }) => (
											<select
												id="edit-warrantyMonths"
												value={field.value}
												onChange={(e) => field.onChange(Number(e.target.value))}
												className="w-full text-sm bg-transparent outline-none appearance-none"
											>
												{WARRANTY_OPTIONS.map((o) => (
													<option key={o.value} value={o.value}>
														{o.label}
													</option>
												))}
											</select>
										)}
									/>
								</FieldRow>
							</div>

							<div className="p-4 space-y-1.5">
								<label htmlFor="edit-category" className="text-sm font-medium">
									Category
								</label>
								<FieldRow icon={LayoutGrid}>
									<Controller
										name="category"
										control={control}
										render={({ field }) => (
											<select
												id="edit-category"
												value={field.value}
												onChange={(e) => field.onChange(e.target.value)}
												className="w-full text-sm bg-transparent outline-none appearance-none"
											>
												{CATEGORIES.map((c) => (
													<option key={c} value={c}>
														{c}
													</option>
												))}
											</select>
										)}
									/>
								</FieldRow>
							</div>
						</div>

						{error && (
							<p className="text-sm text-destructive text-center mt-3">
								{error}
							</p>
						)}

						<div className="mt-6">
							<button
								type="submit"
								disabled={submitting}
								className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-semibold disabled:opacity-50"
							>
								<BookmarkCheck className="w-5 h-5" />
								{submitting ? "Saving…" : "Confirm & Save"}
							</button>
						</div>
					</form>
				</section>
			</main>

			<BottomNav />
		</div>
	);
}
