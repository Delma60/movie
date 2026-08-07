import { db, titles } from "@/lib/db";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { Title, TitleStatus, TitleType } from "@/lib/db/schema";

export interface AdminTitleFilters {
  q?: string;
  type?: TitleType;
  status?: TitleStatus;
}

export async function getAdminTitles(filters: AdminTitleFilters): Promise<Title[]> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(titles.title, pattern), ilike(titles.genre, pattern)));
  }
  if (filters.type) conditions.push(eq(titles.type, filters.type));
  if (filters.status) conditions.push(eq(titles.status, filters.status));

  return db
    .select()
    .from(titles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(titles.createdAt));
}

export async function getAdminTitleCounts(): Promise<{
  total: number;
  published: number;
  draft: number;
}> {
  const [[{ value: total }], [{ value: published }]] = await Promise.all([
    db.select({ value: count() }).from(titles),
    db.select({ value: count() }).from(titles).where(eq(titles.status, "published")),
  ]);

  return { total, published, draft: total - published };
}
