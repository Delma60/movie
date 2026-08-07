import { db, titles, users, watchProgress, subscriptions } from "@/lib/db";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import type { TitleType } from "@/lib/db/schema";

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalWatchMinutes: number;
  activeSubscriptions: number;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [{ value: totalUsers }],
    [{ value: activeUsers7dRaw }],
    [{ value: activeUsers30dRaw }],
    [{ value: totalSecondsRaw }],
    [{ value: activeSubscriptions }],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: sql<number>`count(distinct ${watchProgress.userId})` })
      .from(watchProgress)
      .where(gte(watchProgress.updatedAt, sevenDaysAgo)),
    db
      .select({ value: sql<number>`count(distinct ${watchProgress.userId})` })
      .from(watchProgress)
      .where(gte(watchProgress.updatedAt, thirtyDaysAgo)),
    db
      .select({ value: sql<number>`coalesce(sum(${watchProgress.secondsWatched}), 0)` })
      .from(watchProgress),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
  ]);

  return {
    totalUsers,
    activeUsers7d: Number(activeUsers7dRaw),
    activeUsers30d: Number(activeUsers30dRaw),
    totalWatchMinutes: Math.round(Number(totalSecondsRaw) / 60),
    activeSubscriptions,
  };
}

export interface SignupPoint {
  date: string;
  count: number;
}

export async function getSignupsOverTime(days = 30): Promise<SignupPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      date: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(users)
    .where(gte(users.createdAt, since))
    .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`);

  const byDate = new Map(rows.map((row) => [row.date, row.count]));

  const points: SignupPoint[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(Date.now() - index * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    points.push({ date: key, count: byDate.get(key) ?? 0 });
  }

  return points;
}

export interface MostWatchedTitleRow {
  id: string;
  title: string;
  slug: string;
  type: TitleType;
  viewerCount: number;
  totalSecondsWatched: number;
}

export async function getMostWatchedTitles(limit = 8): Promise<MostWatchedTitleRow[]> {
  const rows = await db
    .select({
      id: titles.id,
      title: titles.title,
      slug: titles.slug,
      type: titles.type,
      viewerCount: sql<number>`count(distinct ${watchProgress.userId})`,
      totalSecondsWatched: sql<number>`coalesce(sum(${watchProgress.secondsWatched}), 0)`,
    })
    .from(watchProgress)
    .innerJoin(titles, eq(watchProgress.titleId, titles.id))
    .groupBy(titles.id, titles.title, titles.slug, titles.type)
    .orderBy(desc(sql`coalesce(sum(${watchProgress.secondsWatched}), 0)`))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    viewerCount: Number(row.viewerCount),
    totalSecondsWatched: Number(row.totalSecondsWatched),
  }));
}

export interface GenreBreakdownRow {
  genre: string;
  viewerCount: number;
}

export async function getGenreBreakdown(limit = 8): Promise<GenreBreakdownRow[]> {
  const rows = await db
    .select({
      genre: titles.genre,
      viewerCount: sql<number>`count(distinct ${watchProgress.userId})`,
    })
    .from(watchProgress)
    .innerJoin(titles, eq(watchProgress.titleId, titles.id))
    .groupBy(titles.genre)
    .orderBy(desc(sql`count(distinct ${watchProgress.userId})`))
    .limit(limit);

  return rows.map((row) => ({
    genre: row.genre,
    viewerCount: Number(row.viewerCount),
  }));
}
