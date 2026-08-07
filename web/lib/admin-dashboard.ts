import { db, titles, users, subscriptions, episodes } from "@/lib/db";
import { count, eq, desc, gte } from "drizzle-orm";
import type { TitleStatus, TitleType } from "@/lib/db/schema";
import type { UserRole } from "@/lib/roles";

export interface DashboardStats {
  totalTitles: number;
  publishedTitles: number;
  draftTitles: number;
  totalSeries: number;
  totalMovies: number;
  totalEpisodes: number;
  totalUsers: number;
  newUsers7d: number;
  activeSubscriptions: number;
}

export interface RecentTitle {
  id: string;
  slug: string;
  title: string;
  type: TitleType;
  status: TitleStatus;
  createdAt: Date;
}

export interface RecentUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

/** Counts powering the dashboard stat cards. Runs as parallel queries. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [{ value: totalTitles }],
    [{ value: publishedTitles }],
    [{ value: totalSeries }],
    [{ value: totalMovies }],
    [{ value: totalEpisodes }],
    [{ value: totalUsers }],
    [{ value: newUsers7d }],
    [{ value: activeSubscriptions }],
  ] = await Promise.all([
    db.select({ value: count() }).from(titles),
    db.select({ value: count() }).from(titles).where(eq(titles.status, "published")),
    db.select({ value: count() }).from(titles).where(eq(titles.type, "series")),
    db.select({ value: count() }).from(titles).where(eq(titles.type, "movie")),
    db.select({ value: count() }).from(episodes),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
    db
      .select({ value: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "active")),
  ]);

  return {
    totalTitles,
    publishedTitles,
    draftTitles: totalTitles - publishedTitles,
    totalSeries,
    totalMovies,
    totalEpisodes,
    totalUsers,
    newUsers7d,
    activeSubscriptions,
  };
}

export async function getRecentTitles(limit = 6): Promise<RecentTitle[]> {
  return db
    .select({
      id: titles.id,
      slug: titles.slug,
      title: titles.title,
      type: titles.type,
      status: titles.status,
      createdAt: titles.createdAt,
    })
    .from(titles)
    .orderBy(desc(titles.createdAt))
    .limit(limit);
}

export async function getRecentUsers(limit = 6): Promise<RecentUser[]> {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}
