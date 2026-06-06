"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

export function NotificationBell({
	urgentCount = 0,
}: {
	urgentCount?: number;
}) {
	return (
		<Link
			href="/notifications"
			className="relative inline-flex"
			aria-label="Notifications"
		>
			{urgentCount > 0 ? (
				<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
					<Bell className="w-5 h-5 text-primary-foreground" />
					<span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
						{urgentCount}
					</span>
				</div>
			) : (
				<Bell className="w-5 h-5 text-muted-foreground" />
			)}
		</Link>
	);
}
