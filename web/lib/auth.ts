import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from "@/lib/session";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  if (!session?.email) return null;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, session.email))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({
      email: session.email,
      displayName: session.name ?? session.email,
      role: "user",
    })
    .returning({ id: users.id });

  return created?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) redirect("/login?returnTo=/my-list");
  return id;
}
