import { auth } from "@/lib/auth";

// DEV_USER_ID is used when BYPASS_AUTH=true in .env.local.
// Set it to a real user ID in your database, or run the seed script first.
const DEV_USER_ID = process.env.DEV_USER_ID ?? "dev-user";

export interface AppSession {
  user: { id: string; email?: string | null; name?: string | null };
}

export async function getSession(): Promise<AppSession | null> {
  if (process.env.BYPASS_AUTH === "true") {
    return { user: { id: DEV_USER_ID, email: "dev@local", name: "Dev User" } };
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AppSession;
}
