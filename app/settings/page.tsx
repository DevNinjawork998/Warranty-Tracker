"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  alertDaysBefore: z.number().int().min(1).max(365),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function SettingsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => reset(data));
  }, [reset]);

  async function onSubmit(data: FormValues) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">←</button>
        <h1 className="font-semibold text-lg">Settings</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription>Choose how you want to be alerted before warranties expire.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <Label htmlFor="alertDaysBefore">Alert me this many days before expiry</Label>
                <Input
                  id="alertDaysBefore"
                  type="number"
                  min={1}
                  max={365}
                  {...register("alertDaysBefore", { valueAsNumber: true })}
                  className="w-24"
                />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="emailEnabled" {...register("emailEnabled")} className="h-4 w-4" />
                <Label htmlFor="emailEnabled">Email notifications</Label>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="pushEnabled" {...register("pushEnabled")} className="h-4 w-4" />
                <Label htmlFor="pushEnabled">Push notifications</Label>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {saved ? "Saved!" : isSubmitting ? "Saving…" : "Save settings"}
              </Button>
            </CardContent>
          </Card>
        </form>

        <Separator />

        <Button
          variant="destructive"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          Sign out
        </Button>
      </main>
    </div>
  );
}
