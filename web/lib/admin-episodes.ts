import { db, episodes, titles, videoAssets } from "@/lib/db";
import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import type { VideoStatus } from "@/lib/db/schema";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-query";

export interface AdminEpisodeRow {
  id: string;
  name: string;
  season: number;
  episodeNumber: number;
  durationMinutes: number | null;
  createdAt: Date;
  titleId: string;
  titleName: string;
  titleSlug: string;
  videoStatus: VideoStatus | null;
}

export interface AdminEpisodeFilters {
  q?: string;
  titleId?: string;
  status?: VideoStatus | "missing";
  page?: number;
  pageSize?: number;
}

export interface AdminEpisodesResult {
  rows: AdminEpisodeRow[];
  total: number;
}

export async function getAdminEpisodes(filters: AdminEpisodeFilters): Promise<AdminEpisodesResult> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(episodes.name, pattern), ilike(titles.title, pattern)));
  }
  if (filters.titleId) conditions.push(eq(episodes.titleId, filters.titleId));
  if (filters.status === "missing") conditions.push(isNull(videoAssets.status));
  else if (filters.status) conditions.push(eq(videoAssets.status, filters.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: episodes.id,
        name: episodes.name,
        season: episodes.season,
        episodeNumber: episodes.episodeNumber,
        durationMinutes: episodes.durationMinutes,
        createdAt: episodes.createdAt,
        titleId: titles.id,
        titleName: titles.title,
        titleSlug: titles.slug,
        videoStatus: videoAssets.status,
      })
      .from(episodes)
      .innerJoin(titles, eq(episodes.titleId, titles.id))
      .leftJoin(videoAssets, eq(videoAssets.episodeId, episodes.id))
      .where(where)
      .orderBy(asc(titles.title), asc(episodes.season), asc(episodes.episodeNumber))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(episodes)
      .innerJoin(titles, eq(episodes.titleId, titles.id))
      .leftJoin(videoAssets, eq(videoAssets.episodeId, episodes.id))
      .where(where),
  ]);

  return { rows, total: countRows[0].value };
}

export async function getSeriesTitlesForFilter(): Promise<{ id: string; title: string }[]> {
  return db
    .select({ id: titles.id, title: titles.title })
    .from(titles)
    .where(eq(titles.type, "series"))
    .orderBy(asc(titles.title));
}

export interface AdminEpisodeCounts {
  total: number;
  seriesCount: number;
  ready: number;
  processing: number;
  failed: number;
  missing: number;
}

export async function getAdminEpisodeCounts(): Promise<AdminEpisodeCounts> {
  const [[{ value: total }], [{ value: seriesCount }], statusRows] = await Promise.all([
    db.select({ value: count() }).from(episodes),
    db.select({ value: count() }).from(titles).where(eq(titles.type, "series")),
    db
      .select({ status: videoAssets.status, value: count() })
      .from(videoAssets)
      .innerJoin(episodes, eq(videoAssets.episodeId, episodes.id))
      .groupBy(videoAssets.status),
  ]);

  const byStatus: Partial<Record<VideoStatus, number>> = {};
  for (const row of statusRows) byStatus[row.status] = row.value;

  const ready = byStatus.ready ?? 0;
  const processing = byStatus.processing ?? 0;
  const failed = byStatus.failed ?? 0;

  return { total, seriesCount, ready, processing, failed, missing: total - ready - processing - failed };
}
