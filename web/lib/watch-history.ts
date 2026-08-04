import { desc, eq } from "drizzle-orm";
import { db, titles, watchProgress } from "@/lib/db";
import type { Title } from "@/lib/db/schema";

export type WatchHistoryItem = Title & { lastWatchedAt: Date | null };

export async function getWatchHistory(userId: string): Promise<WatchHistoryItem[]> {
  const rows = await db
    .select({ title: titles, lastWatchedAt: watchProgress.updatedAt })
    .from(watchProgress)
    .innerJoin(titles, eq(watchProgress.titleId, titles.id))
    .where(eq(watchProgress.userId, userId))
    .orderBy(desc(watchProgress.updatedAt));

  return rows.map((row) => ({ ...row.title, lastWatchedAt: row.lastWatchedAt }));
}
