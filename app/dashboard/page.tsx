import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WarrantyList } from "@/components/warranty-list";
import { PushPermissionPrompt } from "@/components/push-permission-prompt";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/auth/login");

  const warranties = await db.warranty.findMany({
    where: { userId: session.user.id },
    orderBy: { expiryDate: "asc" },
  });

  const serialized = warranties.map((w) => ({
    id: w.id,
    productName: w.productName,
    category: w.category,
    purchaseDate: w.purchaseDate.toISOString(),
    expiryDate: w.expiryDate.toISOString(),
    priceMyr: w.priceMyr ? Number(w.priceMyr) : null,
    receiptImageUrl: w.receiptImageUrl,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">My Warranties</h1>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="ghost" size="sm">Settings</Button>
          </Link>
          <Link href="/upload">
            <Button size="sm">+ Add</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <PushPermissionPrompt />
        {warranties.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">No warranties yet.</p>
            <Link href="/upload">
              <Button>Upload your first receipt</Button>
            </Link>
          </div>
        ) : (
          <WarrantyList warranties={serialized} />
        )}
      </main>
    </div>
  );
}
