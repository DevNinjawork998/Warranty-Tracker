import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import webpush from "web-push";
import { Resend } from "resend";
import { format } from "date-fns";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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

  // Fetch all users who have notifications enabled
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

    const lines = upcoming.map(
      (w) => `• ${w.productName} — expires ${format(w.expiryDate, "d MMM yyyy")}`
    );

    // Push notifications
    if (pushEnabled) {
      for (const sub of user.pushSubscriptions) {
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
          // Subscription expired — clean up
          await db.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        }
      }
    }

    // Email
    if (emailEnabled && user.email) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Warranty Tracker <notifications@example.com>",
        to: user.email,
        subject: `${upcoming.length} warranty${upcoming.length > 1 ? "s" : ""} expiring soon`,
        html: `
          <p>Hi ${user.name ?? "there"},</p>
          <p>The following warranties are expiring within ${alertDaysBefore} days:</p>
          <ul>${lines.map((l: string) => `<li>${l.replace("•", "").trim()}</li>`).join("")}</ul>
          <p><a href="${process.env.NEXTAUTH_URL ?? ""}/dashboard">View your dashboard →</a></p>
        `,
      });
    }

    sent++;
  }

  return NextResponse.json({ notified: sent });
}
