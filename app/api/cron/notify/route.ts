import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import webpush from "web-push";
import { Resend } from "resend";
import { format } from "date-fns";

// H1: escape HTML to prevent XSS in email content
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: Request) {
  // H1: timing-safe comparison + guard against empty secret
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const auth = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(auth);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const settings = await db.notificationSettings.findMany({
    where: { OR: [{ emailEnabled: true }, { pushEnabled: true }] },
    include: {
      user: {
        include: {
          warranties: true,
          pushSubscriptions: true,
        },
      },
    },
  });

  let sent = 0;

  for (const setting of settings) {
    const { user, alertDaysBefore, emailEnabled, pushEnabled } = setting;

    const upcoming = user.warranties.filter((w) => {
      const diff = Math.ceil((w.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= alertDaysBefore;
    });

    if (upcoming.length === 0) continue;

    // Push notifications — #9: send concurrently instead of sequentially
    if (pushEnabled) {
      await Promise.allSettled(
        user.pushSubscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              sub.subscription as unknown as webpush.PushSubscription,
              JSON.stringify({
                title: "Warranty Expiring Soon",
                body: upcoming.length === 1
                  ? `${upcoming[0].productName} expires on ${format(upcoming[0].expiryDate, "d MMM yyyy")}`
                  : `${upcoming.length} warranties expiring soon`,
                url: "/dashboard",
              })
            );
          } catch {
            await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
        })
      );
    }

    // Email — M1: escape all user-controlled strings before interpolating into HTML
    if (emailEnabled && user.email) {
      const listItems = upcoming
        .map((w) => `<li>${esc(w.productName)} — expires ${format(w.expiryDate, "d MMM yyyy")}</li>`)
        .join("");

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Warranty Tracker <notifications@example.com>",
        to: user.email,
        subject: `${upcoming.length} warranty${upcoming.length > 1 ? "s" : ""} expiring soon`,
        html: `
          <p>Hi ${esc(user.name ?? "there")},</p>
          <p>The following warranties are expiring within ${alertDaysBefore} days:</p>
          <ul>${listItems}</ul>
          <p><a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard">View your dashboard →</a></p>
        `,
      });
    }

    sent++;
  }

  return NextResponse.json({ notified: sent });
}
