import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(10),
});

export async function POST(req: Request) {
	// #6: take last IP in x-forwarded-for — appended by the upstream proxy, not spoofable by the client
	const forwarded = req.headers.get("x-forwarded-for") ?? "";
	const ip =
		forwarded.split(",").at(-1)?.trim() ||
		req.headers.get("x-real-ip") ||
		"unknown";
	if (!rateLimit(`register:${ip}`, 5, 60_000)) {
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	const body = await req.json();
	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid input" }, { status: 400 });
	}

	const { name, email, password } = parsed.data;

	try {
		// #3 + #8: interactive transaction makes user + settings atomic; bcrypt inside try
		const user = await db.$transaction(async (tx) => {
			const passwordHash = await bcrypt.hash(password, 12);
			const created = await tx.user.create({
				data: { name, email, passwordHash },
			});
			await tx.notificationSettings.create({ data: { userId: created.id } });
			return created;
		});

		return NextResponse.json({ id: user.id }, { status: 201 });
	} catch (e: unknown) {
		// #4: check meta.target so P2002 on notificationSettings doesn't return a misleading message
		const err = e as { code?: string; meta?: { target?: string[] } };
		if (err.code === "P2002" && err.meta?.target?.includes("email")) {
			return NextResponse.json(
				{ error: "Email already registered" },
				{ status: 409 },
			);
		}
		throw e;
	}
}
