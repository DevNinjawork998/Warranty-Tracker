import { Badge } from "@/components/ui/badge";
import { getStatus, STATUS_LABELS, STATUS_VARIANTS } from "@/lib/warranty-status";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  expiryDate: Date;
  className?: string;
}

export function StatusBadge({ expiryDate, className }: StatusBadgeProps) {
  const status = getStatus(expiryDate);
  return (
    <Badge
      variant={STATUS_VARIANTS[status]}
      className={cn(
        status === "active" && "bg-green-500 hover:bg-green-500/80 text-white",
        status === "expiring_soon" && "bg-amber-500 hover:bg-amber-500/80 text-white",
        className
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
