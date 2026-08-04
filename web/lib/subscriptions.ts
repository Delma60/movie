import { desc, eq } from "drizzle-orm";
import { db, subscriptions } from "@/lib/db";
import type { Subscription } from "@/lib/db/schema";

/** Most recent subscription row for a user, if any. */
export async function getSubscriptionForUser(
  userId: string
): Promise<Subscription | null> {
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return sub ?? null;
}
