import { cn } from "@/lib/utils";
import { getStatus, type WarrantyStatus } from "@/lib/warranty-status";

interface StatusBadgeProps {
	expiryDate: Date;
	className?: string;
}

const styles: Record<WarrantyStatus, string> = {
	active: "border border-green-500 text-green-600 bg-green-50",
	expiring_soon: "border border-amber-500 text-amber-600 bg-amber-50",
	expired: "border border-red-300   text-red-400   bg-red-50",
};

const labels: Record<WarrantyStatus, string> = {
	active: "Active",
	expiring_soon: "Expiring Soon",
	expired: "Expired",
};

export function StatusBadge({ expiryDate, className }: StatusBadgeProps) {
	const status = getStatus(expiryDate);
	return (
		<span
			className={cn(
				"rounded-full px-3 py-0.5 text-xs font-medium",
				styles[status],
				className,
			)}
		>
			{labels[status]}
		</span>
	);
}
