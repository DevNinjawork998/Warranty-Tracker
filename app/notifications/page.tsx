import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, CheckCircle2, User, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getStatus } from "@/lib/warranty-status";

type NotifKind = "expiring_soon" | "expired" | "receipt_processed";

interface NotifItem {
	id: string;
	kind: NotifKind;
	title: string;
	productName: string;
	warrantyId: string;
	category: string;
	daysLeft: number;
	timestamp: Date;
	isUnread: boolean;
}

function relativeTime(date: Date): string {
	const diffDays = differenceInDays(new Date(), date);
	if (diffDays === 0) return formatDistanceToNow(date, { addSuffix: true });
	if (diffDays === 1) return `Yesterday, ${format(date, "HH:mm")}`;
	if (diffDays < 7) return format(date, "EEEE, HH:mm");
	return format(date, "MMM d, yyyy");
}

const KIND_META: Record<
	NotifKind,
	{
		borderColor: string;
		iconBg: string;
		Icon: React.ElementType;
		iconColor: string;
	}
> = {
	expiring_soon: {
		borderColor: "border-l-red-500",
		iconBg: "bg-red-100",
		Icon: AlertTriangle,
		iconColor: "text-red-500",
	},
	expired: {
		borderColor: "border-l-red-400",
		iconBg: "bg-red-50",
		Icon: XCircle,
		iconColor: "text-red-400",
	},
	receipt_processed: {
		borderColor: "border-l-primary/30",
		iconBg: "bg-primary/10",
		Icon: CheckCircle2,
		iconColor: "text-primary",
	},
};

function NotifCard({ item }: { item: NotifItem }) {
	const meta = KIND_META[item.kind];
	const Icon = meta.Icon;

	return (
		<Link
			href={`/warranty/${item.warrantyId}`}
			className={`block px-4 py-4 border-l-4 ${meta.borderColor} hover:bg-muted/30 transition-colors`}
		>
			<div className="flex gap-3">
				<div
					className={`w-10 h-10 rounded-xl ${meta.iconBg} flex items-center justify-center shrink-0 mt-0.5`}
				>
					<Icon className={`w-5 h-5 ${meta.iconColor}`} />
				</div>

				<div className="flex-1 min-w-0 space-y-1.5">
					<div className="flex items-start justify-between gap-2">
						<p className="font-semibold text-sm leading-tight">
							{item.kind === "expiring_soon"
								? "Warranty Expiring Soon"
								: item.kind === "expired"
									? "Warranty Expired"
									: "Receipt Processed"}
						</p>
						<span className="text-xs text-muted-foreground shrink-0">
							{relativeTime(item.timestamp)}
						</span>
					</div>

					<p className="text-sm text-foreground/80 leading-snug">
						{item.kind === "expiring_soon" && (
							<>
								Your <strong>{item.productName}</strong> warranty expires in{" "}
								<strong className="text-red-500">
									{item.daysLeft} day{item.daysLeft !== 1 ? "s" : ""}
								</strong>
								. Tap to view details and options for extension.
							</>
						)}
						{item.kind === "expired" && (
							<>
								Your <strong>{item.productName}</strong> warranty expired{" "}
								{Math.abs(item.daysLeft)} day
								{Math.abs(item.daysLeft) !== 1 ? "s" : ""} ago.
							</>
						)}
						{item.kind === "receipt_processed" && (
							<>
								Your <strong>{item.productName}</strong> receipt has been
								successfully scanned and added to your dashboard.
							</>
						)}
					</p>

					{item.kind === "expiring_soon" && (
						<div className="flex items-center gap-2 pt-0.5">
							<span className="inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-xs text-muted-foreground">
								{item.category}
							</span>
							<span className="inline-flex items-center border border-red-200 bg-red-50 text-red-600 rounded-full px-2.5 py-0.5 text-xs font-medium">
								High Priority
							</span>
						</div>
					)}
				</div>
			</div>
		</Link>
	);
}

export default async function NotificationsPage() {
	const session = await getSession();
	if (!session?.user?.id) redirect("/auth/login");

	const warranties = await db.warranty.findMany({
		where: { userId: session.user.id },
		orderBy: { expiryDate: "asc" },
	});

	const now = new Date();
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

	const notifs: NotifItem[] = [];

	for (const w of warranties) {
		const status = getStatus(w.expiryDate);
		const daysLeft = differenceInDays(w.expiryDate, now);

		if (status === "expiring_soon") {
			notifs.push({
				id: `expiring-${w.id}`,
				kind: "expiring_soon",
				title: "Warranty Expiring Soon",
				productName: w.productName,
				warrantyId: w.id,
				category: w.category,
				daysLeft,
				timestamp: w.updatedAt,
				isUnread: true,
			});
		} else if (status === "expired" && w.expiryDate > sevenDaysAgo) {
			notifs.push({
				id: `expired-${w.id}`,
				kind: "expired",
				title: "Warranty Expired",
				productName: w.productName,
				warrantyId: w.id,
				category: w.category,
				daysLeft,
				timestamp: w.expiryDate,
				isUnread: false,
			});
		}
	}

	// Receipt processed — warranties added in last 7 days
	const recent = await db.warranty.findMany({
		where: { userId: session.user.id, createdAt: { gte: sevenDaysAgo } },
		orderBy: { createdAt: "desc" },
	});
	for (const w of recent) {
		notifs.push({
			id: `receipt-${w.id}`,
			kind: "receipt_processed",
			title: "Receipt Processed",
			productName: w.productName,
			warrantyId: w.id,
			category: w.category,
			daysLeft: 0,
			timestamp: w.createdAt,
			isUnread: false,
		});
	}

	// Sort: unread first, then by timestamp desc
	notifs.sort((a, b) => {
		if (a.isUnread !== b.isUnread) return a.isUnread ? -1 : 1;
		return b.timestamp.getTime() - a.timestamp.getTime();
	});

	const unreadCount = notifs.filter((n) => n.isUnread).length;

	return (
		<div className="min-h-screen bg-background pb-20">
			{/* Header */}
			<header className="sticky top-0 z-10 bg-card border-b px-4 py-3 flex items-center gap-3">
				<div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
					<User className="w-5 h-5 text-foreground" />
				</div>
				<h1 className="font-semibold text-lg flex-1">WarrantyGuard</h1>
				<div className="relative">
					<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
						<Bell className="w-5 h-5 text-primary-foreground" />
					</div>
					{unreadCount > 0 && (
						<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
							{unreadCount}
						</span>
					)}
				</div>
			</header>

			<main className="max-w-lg mx-auto px-4 py-6 space-y-5">
				{/* Title */}
				<div className="space-y-1">
					<h2 className="text-2xl font-bold">Notification Center</h2>
					<p className="text-sm text-muted-foreground">
						Stay updated on your warranty statuses and receipt processing.
					</p>
				</div>

				{/* Mark all as read */}
				{unreadCount > 0 && (
					<button className="flex items-center gap-2 text-primary text-sm font-medium">
						<svg
							className="w-4 h-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2.5}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M4.5 12.75l4.5 4.5 9-9M9 12.75l4.5 4.5"
							/>
						</svg>
						Mark all as read
					</button>
				)}

				{/* Notification list */}
				{notifs.length === 0 ? (
					<div className="text-center py-20 space-y-2">
						<Bell className="w-10 h-10 text-muted-foreground/40 mx-auto" />
						<p className="text-muted-foreground text-sm">
							No notifications yet.
						</p>
					</div>
				) : (
					<div className="bg-card rounded-2xl border overflow-hidden divide-y">
						{notifs.map((item) => (
							<NotifCard key={item.id} item={item} />
						))}
					</div>
				)}
			</main>

			<BottomNav />
		</div>
	);
}
