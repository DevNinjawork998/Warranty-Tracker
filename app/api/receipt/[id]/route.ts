import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const warranty = await db.warranty.findFirst({
		where: { id, userId: session.user.id },
		select: { receiptImageUrl: true },
	});

	if (!warranty?.receiptImageUrl)
		return NextResponse.json({ error: "Not found" }, { status: 404 });

	const blobRes = await fetch(warranty.receiptImageUrl, {
		headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
	});

	if (!blobRes.ok)
		return NextResponse.json(
			{ error: "Failed to fetch receipt" },
			{ status: 502 },
		);

	const contentType =
		blobRes.headers.get("content-type") ?? "application/octet-stream";
	return new NextResponse(blobRes.body, {
		headers: {
			"Content-Type": contentType,
			"Cache-Control": "private, max-age=3600",
		},
	});
}
