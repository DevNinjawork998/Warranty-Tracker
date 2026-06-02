import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";
import { addMonths } from "date-fns";

const schema = z.object({
  productName: z.string().min(1),
  category: z.enum(["Electronics", "Appliance", "Furniture", "Automotive", "Other"]).default("Other"),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  warrantyMonths: z.number().int().min(1),
  priceMyr: z.number().nullable().optional(),
  storeName: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  receiptImageUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const warranties = await db.warranty.findMany({
    where: { userId: session.user.id },
    orderBy: { expiryDate: "asc" },
  });

  return NextResponse.json(warranties);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { productName, category, purchaseDate, warrantyMonths, priceMyr, storeName, serialNumber, receiptImageUrl, notes } = parsed.data;

  const purchase = new Date(purchaseDate);
  const expiry = addMonths(purchase, warrantyMonths);

  const warranty = await db.warranty.create({
    data: {
      userId: session.user.id,
      productName,
      category,
      purchaseDate: purchase,
      warrantyMonths,
      expiryDate: expiry,
      priceMyr: priceMyr ?? null,
      storeName: storeName ?? null,
      serialNumber: serialNumber ?? null,
      receiptImageUrl: receiptImageUrl ?? null,
      notes: notes ?? null,
    },
  });

  return NextResponse.json(warranty, { status: 201 });
}
