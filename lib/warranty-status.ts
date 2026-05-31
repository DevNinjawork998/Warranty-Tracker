import { differenceInDays } from "date-fns";

export type WarrantyStatus = "active" | "expiring_soon" | "expired";

export function getStatus(expiryDate: Date, today = new Date()): WarrantyStatus {
  const diff = differenceInDays(expiryDate, today);
  if (diff < 0) return "expired";
  if (diff <= 30) return "expiring_soon";
  return "active";
}

export const STATUS_LABELS: Record<WarrantyStatus, string> = {
  active: "Active",
  expiring_soon: "Expiring Soon",
  expired: "Expired",
};

export const STATUS_VARIANTS: Record<WarrantyStatus, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  expiring_soon: "secondary",
  expired: "destructive",
};
