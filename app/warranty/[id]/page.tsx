import { differenceInDays, format } from "date-fns";
import { AlertTriangle, Download, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationBell } from "@/components/notification-bell";
import { WarrantyDeleteButton } from "@/components/warranty-delete-button";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getStatus } from "@/lib/warranty-status";

function formatWarrantyPeriod(months: number): string {
	const years = Math.floor(months / 12);
	const rem = months % 12;
	if (years === 0) return `${months} Month${months !== 1 ? "s" : ""}`;
	if (rem === 0) return `${years} Year${years !== 1 ? "s" : ""}`;
	return `${years}Y ${rem}M`;
}

export default async function WarrantyDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await getSession();
	if (!session?.user?.id) redirect("/auth/login");

	const { id } = await params;
	const warranty = await db.warranty.findFirst({
		where: { id, userId: session.user.id },
	});
	if (!warranty) notFound();

	const status = getStatus(warranty.expiryDate);
	const daysLeft = differenceInDays(warranty.expiryDate, new Date());
	const hasReceipt = !!warranty.receiptImageUrl;

	return (
		<div className="min-h-screen bg-background pb-20">
			<header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center gap-3">
				<Link href="/dashboard" className="text-foreground">
					←
				</Link>
				<h1 className="font-semibold text-lg flex-1">WarrantyGuard</h1>
				<NotificationBell />
			</header>

			<main className="max-w-lg mx-auto px-4 py-5 space-y-4">
				{/* Status banner */}
				{status === "expiring_soon" && (
					<div className="flex items-center gap-3 bg-amber-100 border border-amber-300 rounded-2xl px-4 py-3">
						<AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
						<div>
							<p className="font-semibold text-amber-800 text-sm">
								Expiring Soon
							</p>
							<p className="text-xs text-amber-700">{daysLeft} days left</p>
						</div>
					</div>
				)}
				{status === "expired" && (
					<div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
						<AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
						<div>
							<p className="font-semibold text-red-700 text-sm">
								Warranty Expired
							</p>
							<p className="text-xs text-red-600">
								Expired {format(warranty.expiryDate, "d MMM yyyy")}
							</p>
						</div>
					</div>
				)}

				{/* Product info card */}
				<div className="bg-card rounded-2xl border p-5 space-y-3">
					<h2 className="text-xl font-bold text-primary">
						{warranty.productName}
					</h2>
					<div className="grid grid-cols-2 gap-3 text-sm">
						{warranty.storeName && (
							<div>
								<p className="text-muted-foreground text-xs">Merchant</p>
								<p className="font-medium">{warranty.storeName}</p>
							</div>
						)}
						<div>
							<p className="text-muted-foreground text-xs">Category</p>
							<p className="font-medium">{warranty.category}</p>
						</div>
					</div>
					{warranty.priceMyr && (
						<div className="text-sm">
							<p className="text-muted-foreground text-xs">Purchase Price</p>
							<p className="font-medium">
								RM {Number(warranty.priceMyr).toFixed(2)}
							</p>
						</div>
					)}
					{warranty.serialNumber && (
						<div className="text-sm">
							<p className="text-muted-foreground text-xs">Serial Number</p>
							<p className="font-medium font-mono text-xs">
								{warranty.serialNumber}
							</p>
						</div>
					)}
				</div>

				{/* Timeline card */}
				<div className="bg-card rounded-2xl border p-5 space-y-3">
					<p className="text-xs font-bold tracking-widest text-primary uppercase">
						Timeline
					</p>
					<div className="space-y-0 divide-y">
						<div className="flex items-center justify-between py-3 text-sm">
							<span className="text-muted-foreground">Purchase Date</span>
							<span className="font-medium">
								{format(warranty.purchaseDate, "d MMM yyyy")}
							</span>
						</div>
						<div className="flex items-center justify-between py-3 text-sm">
							<span className="text-muted-foreground">Warranty Period</span>
							<span className="font-medium">
								{formatWarrantyPeriod(warranty.warrantyMonths)}
							</span>
						</div>
						<div className="flex items-center justify-between py-3 text-sm">
							<span className="text-muted-foreground">Expiry Date</span>
							<span
								className={`font-medium ${status !== "active" ? "text-red-500" : ""}`}
							>
								{format(warranty.expiryDate, "d MMM yyyy")}
							</span>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="space-y-3">
					{hasReceipt && (
						<a
							href={`/api/receipt/${warranty.id}`}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-semibold text-sm"
						>
							<Download className="w-5 h-5" />
							Download Receipt PDF
						</a>
					)}

					<Link
						href={`/warranty/${warranty.id}/edit`}
						className="w-full flex items-center justify-center gap-2 border border-border bg-card rounded-2xl py-4 font-semibold text-sm hover:bg-muted transition-colors"
					>
						<Pencil className="w-4 h-4" />
						Edit Details
					</Link>

					<WarrantyDeleteButton warrantyId={warranty.id} />
				</div>

				{/* Original receipt preview */}
				{hasReceipt && (
					<section className="space-y-2">
						<p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
							Original Receipt
						</p>
						<div className="rounded-2xl overflow-hidden border bg-muted">
							<iframe
								src={`/api/receipt/${warranty.id}`}
								className="w-full"
								style={{ height: 360 }}
								title="Original receipt"
							/>
						</div>
					</section>
				)}
			</main>

			<BottomNav />
		</div>
	);
}
