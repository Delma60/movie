// web/lib/my-list.ts
import { and, desc, eq } from "drizzle-orm";
import { db, myList, titles } from "@/lib/db";
import type { Title } from "@/lib/db/schema";

export type MyListItem = Title & { addedAt: Title["createdAt"] };

/** Titles a user has saved, newest-added first. */
export async function getMyListTitles(userId: string): Promise<MyListItem[]> {
  const rows = await db
    .select({ title: titles, addedAt: myList.addedAt })
    .from(myList)
    .innerJoin(titles, eq(myList.titleId, titles.id))
    .where(eq(myList.userId, userId))
    .orderBy(desc(myList.addedAt));

  return rows.map((row) => ({ ...row.title, addedAt: row.addedAt }));
}

export async function addToMyList(userId: string, titleId: string): Promise<void> {
  const existing = await db
    .select()
    .from(myList)
    .where(and(eq(myList.userId, userId), eq(myList.titleId, titleId)))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(myList).values({ userId, titleId });
}

export async function removeFromMyList(
  userId: string,
  titleId: string
): Promise<void> {
  await db
    .delete(myList)
    .where(and(eq(myList.userId, userId), eq(myList.titleId, titleId)));
}
