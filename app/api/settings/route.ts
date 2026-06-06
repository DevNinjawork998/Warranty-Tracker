import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const schema = z.object({
	alert30Days: z.boolean(),
	alert14Days: z.boolean(),
	alert7Days: z.boolean(),
	monthlySummary: z.boolean(),
	systemUpdates: z.boolean(),
	pushEnabled: z.boolean(),
	emailEnabled: z.boolean(),
	whatsappEnabled: z.boolean(),
});

const DEFAULTS = {
	alert30Days: true,
	alert14Days: true,
	alert7Days: false,
	monthlySummary: true,
	systemUpdates: false,
	pushEnabled: true,
	emailEnabled: true,
	whatsappEnabled: false,
};

export async function GET() {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const settings = await db.notificationSettings.findUnique({
		where: { userId: session.user.id },
	});

	return NextResponse.json(
		settings ?? { ...DEFAULTS, userId: session.user.id },
	);
}

export async function PATCH(req: Request) {
	const session = await getSession();
	if (!session?.user?.id)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json();
	const parsed = schema.safeParse(body);
	if (!parsed.success)
		return NextResponse.json({ error: "Invalid input" }, { status: 400 });

	const settings = await db.notificationSettings.upsert({
		where: { userId: session.user.id },
		create: { userId: session.user.id, ...parsed.data },
		update: parsed.data,
	});

	return NextResponse.json(settings);
}
