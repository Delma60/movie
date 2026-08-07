import { db, episodes, titles, videoAssets } from "@/lib/db";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import type { VideoStatus } from "@/lib/db/schema";

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
}

/** Episodes joined to their parent series and (if attached) video asset
 * status. A left join on video_assets means episodes with no asset yet
 * come back with videoStatus: null, surfaced in the UI as "Missing". */
export async function getAdminEpisodes(filters: AdminEpisodeFilters): Promise<AdminEpisodeRow[]> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(episodes.name, pattern), ilike(titles.title, pattern)));
  }
  if (filters.titleId) conditions.push(eq(episodes.titleId, filters.titleId));
  if (filters.status && filters.status !== "missing") {
    conditions.push(eq(videoAssets.status, filters.status));
  }

  const rows = await db
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
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(titles.title), asc(episodes.season), asc(episodes.episodeNumber));

  return filters.status === "missing" ? rows.filter((r) => r.videoStatus === null) : rows;
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

  return {
    total,
    seriesCount,
    ready,
    processing,
    failed,
    missing: total - ready - processing - failed,
  };
}
