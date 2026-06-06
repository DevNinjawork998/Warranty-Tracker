import { AlertTriangle, CheckCircle2, Plus, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationBell } from "@/components/notification-bell";
import { PushPermissionPrompt } from "@/components/push-permission-prompt";
import { WarrantyList } from "@/components/warranty-list";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getStatus } from "@/lib/warranty-status";

export default async function DashboardPage() {
	const session = await getSession();
	if (!session?.user?.id) redirect("/auth/login");

	const warranties = await db.warranty.findMany({
		where: { userId: session.user.id },
		orderBy: { expiryDate: "asc" },
	});

	const serialized = warranties.map((w) => ({
		id: w.id,
		productName: w.productName,
		category: w.category,
		purchaseDate: w.purchaseDate.toISOString(),
		expiryDate: w.expiryDate.toISOString(),
		priceMyr: w.priceMyr ? Number(w.priceMyr) : null,
		storeName: w.storeName,
		serialNumber: w.serialNumber,
		receiptImageUrl: w.receiptImageUrl,
	}));

	const counts = { active: 0, expiring_soon: 0, expired: 0 };
	for (const w of warranties) counts[getStatus(w.expiryDate)]++;

	const statCards = [
		{
			label: "Active",
			count: counts.active,
			Icon: CheckCircle2,
			color: "text-green-500",
		},
		{
			label: "Expiring Soon",
			count: counts.expiring_soon,
			Icon: AlertTriangle,
			color: "text-amber-500",
		},
		{
			label: "Expired",
			count: counts.expired,
			Icon: XCircle,
			color: "text-red-400",
		},
	];

	return (
		<div className="min-h-screen bg-background pb-20">
			<header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center justify-between">
				<h1 className="font-semibold text-lg">WarrantyGuard</h1>
				<NotificationBell urgentCount={counts.expiring_soon + counts.expired} />
			</header>

			<main className="max-w-lg mx-auto px-4 py-6 space-y-6">
				<PushPermissionPrompt />

				<section>
					<h2 className="font-semibold text-xl mb-3">Overview</h2>
					<div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
						{statCards.map(({ label, count, Icon, color }) => (
							<div
								key={label}
								className="bg-card rounded-2xl border p-4 min-w-[140px] flex-shrink-0 space-y-2"
							>
								<div className="flex items-center gap-1.5">
									<Icon className={`w-4 h-4 ${color}`} />
									<span className="text-sm text-muted-foreground">{label}</span>
								</div>
								<p className="text-3xl font-bold">{count}</p>
							</div>
						))}
					</div>
				</section>

				{warranties.length === 0 ? (
					<div className="text-center py-20 space-y-4">
						<p className="text-muted-foreground">No warranties yet.</p>
						<Link
							href="/upload"
							className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-medium"
						>
							Upload your first receipt
						</Link>
					</div>
				) : (
					<WarrantyList warranties={serialized} />
				)}
			</main>

			<Link
				href="/upload"
				className="fixed bottom-20 right-4 z-40 bg-primary text-primary-foreground w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
				aria-label="Add warranty"
			>
				<Plus className="w-6 h-6" />
			</Link>

			<BottomNav />
		</div>
	);
}
