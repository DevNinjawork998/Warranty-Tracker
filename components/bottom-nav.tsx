"use client";

import { Camera, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
	{ href: "/dashboard", label: "Dashboard", Icon: LayoutGrid },
	{ href: "/upload", label: "Upload", Icon: Camera },
	{ href: "/settings", label: "Settings", Icon: Settings },
];

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t flex items-center px-2">
			{TABS.map(({ href, label, Icon }) => {
				const active = pathname === href || pathname.startsWith(`${href}/`);
				return (
					<Link
						key={href}
						href={href}
						className="flex-1 flex justify-center py-2"
					>
						<div
							className={cn(
								"flex flex-col items-center gap-1 px-5 py-2 rounded-2xl text-xs font-medium transition-colors",
								active ? "bg-primary/10 text-primary" : "text-muted-foreground",
							)}
						>
							<Icon className="w-5 h-5" />
							{label}
						</div>
					</Link>
				);
			})}
		</nav>
	);
}
