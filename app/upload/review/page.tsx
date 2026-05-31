"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["Electronics", "Appliance", "Furniture", "Automotive", "Other"] as const;

const schema = z.object({
  productName: z.string().min(1, "Product name is required"),
  category: z.enum(CATEGORIES),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  warrantyYears: z.number().min(0).max(50).optional(),
  warrantyMonthsExtra: z.number().min(0).max(11).optional(),
  priceMyr: z.number().min(0).nullable().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface OcrResult {
  product_name?: string | null;
  purchase_date?: string | null;
  price_myr?: number | null;
  warranty_months?: number | null;
  category?: string | null;
  receipt_image_url?: string | null;
}

function isAutoFilled(value: unknown): boolean {
  return value !== null && value !== undefined;
}

export default function ReviewPage() {
  const router = useRouter();
  const [ocr, setOcr] = useState<OcrResult>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "Other" as const, warrantyYears: 0, warrantyMonthsExtra: 0 },
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("ocr_result");
    if (!raw) { router.push("/upload"); return; }
    const data: OcrResult = JSON.parse(raw);
    setOcr(data);

    if (data.product_name) setValue("productName", data.product_name);
    if (data.purchase_date) setValue("purchaseDate", data.purchase_date);
    if (data.price_myr) setValue("priceMyr", data.price_myr);
    if (data.category && CATEGORIES.includes(data.category as (typeof CATEGORIES)[number])) {
      setValue("category", data.category as (typeof CATEGORIES)[number]);
    }
    if (data.warranty_months) {
      setValue("warrantyYears", Math.floor(data.warranty_months / 12));
      setValue("warrantyMonthsExtra", data.warranty_months % 12);
    }
  }, [setValue, router]);

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    setError(null);

    const warrantyMonths = ((data.warrantyYears ?? 0) * 12) + (data.warrantyMonthsExtra ?? 0);
    if (warrantyMonths < 1) {
      setError("Warranty period must be at least 1 month.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/warranties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: data.productName,
        category: data.category,
        purchaseDate: data.purchaseDate,
        warrantyMonths,
        priceMyr: data.priceMyr ?? null,
        receiptImageUrl: ocr.receipt_image_url ?? null,
        notes: data.notes ?? null,
      }),
    });

    if (!res.ok) {
      setError("Failed to save warranty. Please try again.");
      setSubmitting(false);
      return;
    }

    sessionStorage.removeItem("ocr_result");
    router.push("/dashboard");
  }

  const category = watch("category");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">←</button>
        <h1 className="font-semibold text-lg">Review Details</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Receipt image panel */}
          {ocr.receipt_image_url && (
            <div className="relative w-full rounded-lg overflow-hidden border aspect-[3/4] max-h-64">
              <Image
                src={ocr.receipt_image_url}
                alt="Your receipt"
                fill
                className="object-contain bg-muted"
              />
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Review the extracted details below. Fields marked{" "}
            <Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>{" "}
            were detected from your receipt — correct any errors before saving.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Product name */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="productName">Product name *</Label>
              {isAutoFilled(ocr.product_name) && <Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>}
            </div>
            <Input id="productName" {...register("productName")} placeholder="e.g. Samsung TV 55&quot;" />
            {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label>Category</Label>
              {isAutoFilled(ocr.category) && <Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>}
            </div>
            <Select value={category} onValueChange={(v) => setValue("category", v as (typeof CATEGORIES)[number])}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purchase date */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="purchaseDate">Purchase date *</Label>
              {isAutoFilled(ocr.purchase_date) && <Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>}
            </div>
            <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
            {errors.purchaseDate && <p className="text-xs text-destructive">{errors.purchaseDate.message}</p>}
          </div>

          {/* Warranty period */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label>Warranty period *</Label>
              {isAutoFilled(ocr.warranty_months) && <Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  min={0}
                  {...register("warrantyYears", { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground text-center">Years</p>
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  type="number"
                  min={0}
                  max={11}
                  {...register("warrantyMonthsExtra", { valueAsNumber: true })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground text-center">Months</p>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label htmlFor="priceMyr">Price (RM)</Label>
              {isAutoFilled(ocr.price_myr) && <Badge variant="outline" className="text-xs py-0">Auto-filled</Badge>}
            </div>
            <Input id="priceMyr" type="number" step="0.01" min={0} {...register("priceMyr", { valueAsNumber: true })} placeholder="0.00" />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Serial number, store name, etc." rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Save warranty"}
          </Button>
        </form>
      </main>
    </div>
  );
}
