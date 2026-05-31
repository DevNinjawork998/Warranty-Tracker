import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { format, differenceInDays } from "date-fns";

interface WarrantyCardProps {
  productName: string;
  category: string;
  purchaseDate: Date;
  expiryDate: Date;
  priceMyr?: number | null;
  receiptImageUrl?: string | null;
}

export function WarrantyCard({ productName, category, purchaseDate, expiryDate, priceMyr, receiptImageUrl }: WarrantyCardProps) {
  const daysLeft = differenceInDays(expiryDate, new Date());

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{productName}</p>
          <p className="text-xs text-muted-foreground">{category}</p>
        </div>
        <StatusBadge expiryDate={expiryDate} className="shrink-0" />
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Purchased</span>
          <span>{format(purchaseDate, "d MMM yyyy")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expires</span>
          <span>{format(expiryDate, "d MMM yyyy")}</span>
        </div>
        {daysLeft >= 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Days left</span>
            <span className="font-medium">{daysLeft}</span>
          </div>
        )}
        {priceMyr != null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span>RM {Number(priceMyr).toFixed(2)}</span>
          </div>
        )}
        {receiptImageUrl && (
          <a
            href={receiptImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-xs text-primary underline underline-offset-2"
          >
            View receipt
          </a>
        )}
      </CardContent>
    </Card>
  );
}
