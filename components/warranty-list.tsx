"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WarrantyCard } from "@/components/warranty-card";
import { getStatus, WarrantyStatus } from "@/lib/warranty-status";

interface Warranty {
  id: string;
  productName: string;
  category: string;
  purchaseDate: string;
  expiryDate: string;
  priceMyr?: number | null;
  receiptImageUrl?: string | null;
}

interface WarrantyListProps {
  warranties: Warranty[];
}

const TABS: { value: WarrantyStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expiring_soon", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

export function WarrantyList({ warranties }: WarrantyListProps) {
  const [tab, setTab] = useState<WarrantyStatus | "all">("all");

  const filtered = warranties.filter((w) => {
    if (tab === "all") return true;
    return getStatus(new Date(w.expiryDate)) === tab;
  });

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as WarrantyStatus | "all")}>
        <TabsList className="w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">No warranties found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <WarrantyCard
              key={w.id}
              productName={w.productName}
              category={w.category}
              purchaseDate={new Date(w.purchaseDate)}
              expiryDate={new Date(w.expiryDate)}
              priceMyr={w.priceMyr}
              receiptImageUrl={w.receiptImageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
