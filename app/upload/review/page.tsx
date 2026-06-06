"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	BookmarkCheck,
	Calendar,
	Camera,
	LayoutGrid,
	Maximize2,
	ShieldCheck,
	Store,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
	warrantyMonths: z.number().int().min(1, "Select warranty period"),
	category: z.enum(CATEGORIES),
	serialNumber: z.string().optional(),
	notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface OcrResult {
	product_name?: string | null;
	store_name?: string | null;
	purchase_date?: string | null;
	price_myr?: number | null;
	warranty_months?: number | null;
	category?: string | null;
	serial_number?: string | null;
	receipt_image_url?: string | null;
	receipt_preview?: string | null;
}

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

export default function ReviewPage() {
	const router = useRouter();
	const [ocr, setOcr] = useState<OcrResult>({});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

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
		const raw = sessionStorage.getItem("ocr_result");
		if (!raw) {
			router.push("/upload");
			return;
		}
		let data: OcrResult;
		try {
			data = JSON.parse(raw);
		} catch {
			router.push("/upload");
			return;
		}
		setOcr(data);

		if (data.product_name) setValue("productName", data.product_name);
		if (data.store_name) setValue("storeName", data.store_name);
		if (data.purchase_date) setValue("purchaseDate", data.purchase_date);
		if (data.price_myr) setValue("priceMyr", data.price_myr);
		if (data.serial_number) setValue("serialNumber", data.serial_number);
		if (
			data.category &&
			CATEGORIES.includes(data.category as (typeof CATEGORIES)[number])
		) {
			setValue("category", data.category as (typeof CATEGORIES)[number]);
		}
		if (data.warranty_months) {
			const closest = WARRANTY_OPTIONS.reduce((prev, cur) =>
				Math.abs(cur.value - data.warranty_months!) <
				Math.abs(prev.value - data.warranty_months!)
					? cur
					: prev,
			);
			setValue("warrantyMonths", closest.value);
		}
	}, [setValue, router]);

	async function onSubmit(data: FormValues) {
		setSubmitting(true);
		setError(null);

		const res = await fetch("/api/warranties", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				productName: data.productName,
				storeName: data.storeName ?? null,
				category: data.category,
				purchaseDate: data.purchaseDate,
				warrantyMonths: data.warrantyMonths,
				priceMyr: data.priceMyr ?? null,
				serialNumber: data.serialNumber ?? null,
				receiptImageUrl: ocr.receipt_image_url ?? null,
				notes: data.notes ?? null,
			}),
		});

		if (!res.ok) {
			setError("Failed to save warranty. Please try again.");
			setSubmitting(false);
			return;
		}

		sessionStorage.removeItem("ocr_result");
		router.push("/dashboard");
	}

	const isPdf = ocr.receipt_preview?.startsWith("data:application/pdf");

	return (
		<div className="min-h-screen bg-background pb-20">
			<header className="px-4 py-4 flex items-center gap-3">
				<button onClick={() => router.back()} className="text-foreground">
					←
				</button>
				<h1 className="font-bold text-xl">Review Details</h1>
			</header>

			<main className="max-w-lg mx-auto px-4 space-y-5">
				{/* Receipt preview */}
				{ocr.receipt_preview && (
					<section className="space-y-2">
						<p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
							Receipt Preview
						</p>
						<div className="relative rounded-2xl overflow-hidden border">
							{isPdf ? (
								<iframe
									src={ocr.receipt_preview}
									className="w-full"
									style={{ height: 260 }}
									title="Receipt"
								/>
							) : (
								<div className="relative w-full aspect-[4/3]">
									<Image
										src={ocr.receipt_preview}
										alt="Receipt"
										fill
										className="object-contain bg-muted"
										unoptimized
									/>
								</div>
							)}
							{ocr.receipt_image_url && (
								<a
									href={ocr.receipt_image_url}
									target="_blank"
									rel="noopener noreferrer"
									className="absolute bottom-3 right-3 bg-card/90 backdrop-blur rounded-full p-2 shadow"
									aria-label="View full receipt"
								>
									<Maximize2 className="w-4 h-4" />
								</a>
							)}
						</div>
					</section>
				)}

				{/* Extracted details form */}
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
							{/* Product Name */}
							<div className="p-4 space-y-1.5">
								<label className="text-sm font-medium">Product Name</label>
								<input
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

							{/* Merchant / Store */}
							<div className="p-4 space-y-1.5">
								<label className="text-sm font-medium">Merchant / Store</label>
								<FieldRow icon={Store}>
									<input
										{...register("storeName")}
										placeholder="e.g. Apple Malaysia"
										className="w-full text-sm bg-transparent outline-none"
									/>
								</FieldRow>
							</div>

							{/* Purchase Date */}
							<div className="p-4 space-y-1.5">
								<label className="text-sm font-medium">Purchase Date</label>
								<FieldRow icon={Calendar}>
									<input
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

							{/* Price */}
							<div className="p-4 space-y-1.5">
								<label className="text-sm font-medium">Price</label>
								<FieldRow icon={Wallet}>
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">RM</span>
										<input
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

							{/* Warranty Period */}
							<div className="p-4 space-y-1.5">
								<label className="text-sm font-medium">Warranty Period</label>
								<FieldRow icon={ShieldCheck}>
									<Controller
										name="warrantyMonths"
										control={control}
										render={({ field }) => (
											<select
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
								{errors.warrantyMonths && (
									<p className="text-xs text-destructive">
										{errors.warrantyMonths.message}
									</p>
								)}
							</div>

							{/* Category */}
							<div className="p-4 space-y-1.5">
								<label className="text-sm font-medium">Category</label>
								<FieldRow icon={LayoutGrid}>
									<Controller
										name="category"
										control={control}
										render={({ field }) => (
											<select
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

						{/* Action buttons */}
						<div className="space-y-3 mt-6">
							<button
								type="submit"
								disabled={submitting}
								className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-semibold disabled:opacity-50 transition-opacity"
							>
								<BookmarkCheck className="w-5 h-5" />
								{submitting ? "Saving…" : "Confirm & Save"}
							</button>

							<button
								type="button"
								onClick={() => router.push("/upload")}
								className="w-full flex items-center justify-center gap-2 border border-primary text-primary rounded-2xl py-4 font-semibold bg-card transition-colors hover:bg-primary/5"
							>
								<Camera className="w-5 h-5" />
								Retake Photo
							</button>
						</div>
					</form>
				</section>
			</main>

			<BottomNav />
		</div>
	);
}
