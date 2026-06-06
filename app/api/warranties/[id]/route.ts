import { addMonths } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const patchSchema = z.object({
	productName: z.string().min(1).optional(),
	storeName: z.string().nullable().optional(),
	category: z
		.enum(["Electronics", "Appliance", "Furniture", "Automotive", "Other"])
		.optional(),
	purchaseDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	warrantyMonths: z.number().int().min(1).optional(),
	priceMyr: z.number().nullable().optional(),
	serialNumber: z.string().nullable().optional(),
	notes: z.string().nullable().optional(),
});

async function getOwned(id: string, userId: string) {
	return db.warranty.findFirst({ where: { id, userId } });
}

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { id } = await params;
	const warranty = await getOwned(id, session.user.id);
	if (!warranty)
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json(warranty);
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { id } = await params;
	const existing = await getOwned(id, session.user.id);
	if (!existing)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	const body = await req.json();
	const parsed = patchSchema.safeParse(body);
	if (!parsed.success)
		return NextResponse.json({ error: "Invalid input" }, { status: 400 });

	const data = parsed.data;
	const purchaseDate = data.purchaseDate
		? new Date(data.purchaseDate)
		: existing.purchaseDate;
	const warrantyMonths = data.warrantyMonths ?? existing.warrantyMonths;
	const expiryDate = addMonths(purchaseDate, warrantyMonths);

	const updated = await db.warranty.update({
		where: { id },
		data: {
			...(data.productName !== undefined && { productName: data.productName }),
			...(data.storeName !== undefined && { storeName: data.storeName }),
			...(data.category !== undefined && { category: data.category }),
			...(data.serialNumber !== undefined && {
				serialNumber: data.serialNumber,
			}),
			...(data.notes !== undefined && { notes: data.notes }),
			...(data.priceMyr !== undefined && { priceMyr: data.priceMyr }),
			purchaseDate,
			warrantyMonths,
			expiryDate,
		},
	});

	return NextResponse.json(updated);
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	const { id } = await params;
	const existing = await getOwned(id, session.user.id);
	if (!existing)
		return NextResponse.json({ error: "Not found" }, { status: 404 });
	await db.warranty.delete({ where: { id } });
	return new NextResponse(null, { status: 204 });
}
