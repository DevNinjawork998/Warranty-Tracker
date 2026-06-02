import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { format, differenceInDays } from "date-fns";
import { getStatus } from "@/lib/warranty-status";
import { cn } from "@/lib/utils";
import { MoreVertical } from "lucide-react";

interface WarrantyCardProps {
  id: string;
  productName: string;
  category: string;
  purchaseDate: Date;
  expiryDate: Date;
  priceMyr?: number | null;
  storeName?: string | null;
  serialNumber?: string | null;
  receiptImageUrl?: string | null;
}

export function WarrantyCard({ id, productName, purchaseDate, expiryDate, priceMyr, storeName, serialNumber }: WarrantyCardProps) {
  const status = getStatus(expiryDate);
  const daysLeft = differenceInDays(expiryDate, new Date());

  return (
    <Link href={`/warranty/${id}`} className={cn("block bg-card rounded-2xl border p-4 space-y-3", status === "expired" && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-base leading-tight">{productName}</p>
          {storeName && <p className="text-xs text-muted-foreground mt-0.5">{storeName}</p>}
        </div>
        <StatusBadge expiryDate={expiryDate} className="shrink-0 mt-0.5" />
      </div>

      <div className="bg-muted rounded-xl p-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Purchased</p>
          <p className="font-medium">{format(purchaseDate, "d MMM yyyy")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expires</p>
          <p className="font-medium">{format(expiryDate, "d MMM yyyy")}</p>
          {status === "expiring_soon" && (
            <p className="text-xs font-medium text-amber-500">{daysLeft} days left</p>
          )}
          {status === "active" && (
            <p className="text-xs font-medium text-green-600">{daysLeft} days left</p>
          )}
        </div>
      </div>

      {serialNumber && (
        <p className="text-xs text-muted-foreground">S/N: {serialNumber}</p>
      )}

      <div className="flex items-center justify-between">
        {priceMyr != null
          ? <p className="text-sm font-medium">RM {Number(priceMyr).toFixed(2)}</p>
          : <span />
        }
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </div>
    </Link>
  );
}
