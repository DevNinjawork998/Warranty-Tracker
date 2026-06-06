"use client";

import { useState } from "react";
import { WarrantyCard } from "@/components/warranty-card";

interface Warranty {
	id: string;
	productName: string;
	category: string;
	purchaseDate: string;
	expiryDate: string;
	priceMyr?: number | null;
	storeName?: string | null;
	serialNumber?: string | null;
	receiptImageUrl?: string | null;
}

interface WarrantyListProps {
	warranties: Warranty[];
}

const RECENT_LIMIT = 5;

export function WarrantyList({ warranties }: WarrantyListProps) {
	const [showAll, setShowAll] = useState(false);

	const visible = showAll ? warranties : warranties.slice(0, RECENT_LIMIT);
	const hasMore = warranties.length > RECENT_LIMIT;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">Recent Warranties</h2>
				{hasMore && !showAll && (
					<button
						type="button"
						onClick={() => setShowAll(true)}
						className="text-sm font-medium text-primary"
					>
						View All
					</button>
				)}
			</div>

			{visible.length === 0 ? (
				<p className="text-center text-muted-foreground py-10 text-sm">
					No warranties found.
				</p>
			) : (
				<div className="space-y-3">
					{visible.map((w) => (
						<WarrantyCard
							key={w.id}
							id={w.id}
							productName={w.productName}
							category={w.category}
							purchaseDate={new Date(w.purchaseDate)}
							expiryDate={new Date(w.expiryDate)}
							priceMyr={w.priceMyr}
							storeName={w.storeName}
							serialNumber={w.serialNumber}
							receiptImageUrl={w.receiptImageUrl}
						/>
					))}
				</div>
			)}
		</div>
	);
}
