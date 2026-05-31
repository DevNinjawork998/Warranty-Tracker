import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  alertDaysBefore: z.number().int().min(1).max(365),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.notificationSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(settings ?? { alertDaysBefore: 30, emailEnabled: true, pushEnabled: true });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const settings = await db.notificationSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json(settings);
}
