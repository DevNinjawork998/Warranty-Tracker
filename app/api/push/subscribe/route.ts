import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const subscription = await req.json();
	const { endpoint } = subscription;

	// L1: re-assert userId on update so an existing endpoint can't be claimed by another user
	await db.pushSubscription.upsert({
		where: { endpoint },
		create: { userId: session.user.id, endpoint, subscription },
		update: { userId: session.user.id, subscription },
	});

	return NextResponse.json({ ok: true });
}
