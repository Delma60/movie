import { db, titles } from "@/lib/db";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type { Title, TitleStatus, TitleType } from "@/lib/db/schema";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-query";

export interface AdminTitleFilters {
  q?: string;
  type?: TitleType;
  status?: TitleStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminTitlesResult {
  rows: Title[];
  total: number;
}

export async function getAdminTitles(filters: AdminTitleFilters): Promise<AdminTitlesResult> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(titles.title, pattern), ilike(titles.genre, pattern)));
  }
  if (filters.type) conditions.push(eq(titles.type, filters.type));
  if (filters.status) conditions.push(eq(titles.status, filters.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(titles)
      .where(where)
      .orderBy(desc(titles.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(titles).where(where),
  ]);

  return { rows, total: countRows[0].value };
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
