import { and, desc, eq } from "drizzle-orm";
import { db, watchProgress } from "@/lib/db";

export interface WatchProgressRow {
  id: string;
  titleId: string | null;
  episodeId: string | null;
  secondsWatched: number;
  updatedAt: Date;
}

export async function listWatchProgress(userId: string): Promise<WatchProgressRow[]> {
  return db
    .select()
    .from(watchProgress)
    .where(eq(watchProgress.userId, userId))
    .orderBy(desc(watchProgress.updatedAt));
}

export interface UpsertWatchProgressInput {
  userId: string;
  titleId?: string | null;
  episodeId?: string | null;
  secondsWatched: number;
}

/** Insert or update progress on a title/episode. Exactly one of titleId /
 * episodeId should be set, matching the two unique indexes on the table. */
export async function upsertWatchProgress(input: UpsertWatchProgressInput): Promise<void> {
  const { userId, secondsWatched } = input;
  const titleId = input.titleId ?? null;
  const episodeId = input.episodeId ?? null;
  if (!titleId && !episodeId) throw new Error("titleId or episodeId is required.");

  const condition = episodeId
    ? and(eq(watchProgress.userId, userId), eq(watchProgress.episodeId, episodeId))
    : and(eq(watchProgress.userId, userId), eq(watchProgress.titleId, titleId!));

  const [existing] = await db
    .select({ id: watchProgress.id })
    .from(watchProgress)
    .where(condition)
    .limit(1);

  if (existing) {
    await db
      .update(watchProgress)
      .set({ secondsWatched, updatedAt: new Date() })
      .where(eq(watchProgress.id, existing.id));
  } else {
    await db.insert(watchProgress).values({ userId, titleId, episodeId, secondsWatched });
  }
}
