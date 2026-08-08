import { db, titles, episodes as episodesTable, videoAssets } from "@/lib/db";
import { signedPlaybackUrl } from "@/lib/s3";
import type { Title } from "@/lib/db/schema";
import { and, asc, desc, eq, ilike, ne, or } from "drizzle-orm";
import { BROWSE_SORTS, type BrowseSort } from "@/lib/browse-options";

export type TitleType = "movie" | "series";

export { BROWSE_SORTS };
export type { BrowseSort };

export interface BrowseFilters {
  genre?: string;
  year?: number;
  type?: TitleType;
  sort?: BrowseSort;
}

/** Distinct genres + years available across published titles, for filter dropdowns. */
export async function getBrowseFilterOptions(): Promise<{
  genres: string[];
  years: number[];
}> {
  const [genreRows, yearRows] = await Promise.all([
    db
      .selectDistinct({ genre: titles.genre })
      .from(titles)
      .where(eq(titles.status, "published"))
      .orderBy(asc(titles.genre)),
    db
      .selectDistinct({ year: titles.year })
      .from(titles)
      .where(eq(titles.status, "published"))
      .orderBy(desc(titles.year)),
  ]);

  return {
    genres: genreRows.map((r) => r.genre).filter(Boolean),
    years: yearRows.map((r) => r.year).filter((y): y is number => y != null),
  };
}

function sortColumns(sort: BrowseSort) {
  switch (sort) {
    case "oldest":
      return [asc(titles.year), asc(titles.title)];
    case "title-asc":
      return [asc(titles.title)];
    case "title-desc":
      return [desc(titles.title)];
    case "newest":
    default:
      return [desc(titles.year), desc(titles.createdAt)];
  }
}

/** Published titles matching the given filters, for the /browse catalog. */
export async function getBrowseTitles(filters: BrowseFilters): Promise<Title[]> {
  const conditions = [eq(titles.status, "published")];

  if (filters.genre) conditions.push(eq(titles.genre, filters.genre));
  if (filters.year) conditions.push(eq(titles.year, filters.year));
  if (filters.type) conditions.push(eq(titles.type, filters.type));

  return db
    .select()
    .from(titles)
    .where(and(...conditions))
    .orderBy(...sortColumns(filters.sort ?? "newest"));
}

/** Published titles matching a free-text query (title or genre), for /search. */
export async function searchTitles(query: string, limit = 24): Promise<Title[]> {
  const q = query.trim();
  if (!q) return [];

  const pattern = `%${q}%`;

  return db
    .select()
    .from(titles)
    .where(
      and(
        eq(titles.status, "published"),
        or(ilike(titles.title, pattern), ilike(titles.genre, pattern))
      )
    )
    .orderBy(desc(titles.year), desc(titles.createdAt))
    .limit(limit);
}

/** A single published title by slug, for the title detail page. */
export async function getTitleBySlug(slug: string): Promise<Title | null> {
  const [title] = await db
    .select()
    .from(titles)
    .where(and(eq(titles.slug, slug), eq(titles.status, "published")))
    .limit(1);

  return title ?? null;
}

/** Ordered episode list for a series title. */
export async function getEpisodesForTitle(titleId: string) {
  return db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.titleId, titleId))
    .orderBy(asc(episodesTable.season), asc(episodesTable.episodeNumber));
}

export interface WatchData {
  title: Title;
  episodes: Awaited<ReturnType<typeof getEpisodesForTitle>>;
  currentEpisode: Awaited<ReturnType<typeof getEpisodesForTitle>>[number] | null;
  videoAsset: typeof videoAssets.$inferSelect | null;
}

/** Everything the /watch page needs: the title, its episode list (if a
 * series), which episode is currently selected, and the video source
 * to attempt to play. */
export async function getWatchData(
  slug: string,
  episodeId?: string
): Promise<WatchData | null> {
  const title = await getTitleBySlug(slug);
  if (!title) return null;

  const episodes = title.type === "series" ? await getEpisodesForTitle(title.id) : [];

  const currentEpisode =
    title.type === "series"
      ? (episodeId ? episodes.find((e) => e.id === episodeId) : episodes[0]) ?? null
      : null;

  const [videoAssetRaw] = await db
    .select()
    .from(videoAssets)
    .where(
      currentEpisode
        ? eq(videoAssets.episodeId, currentEpisode.id)
        : eq(videoAssets.titleId, title.id)
    )
    .limit(1);

  let videoAsset = videoAssetRaw ?? null;
  if (videoAsset?.sourceUrl) {
    const signedUrl = await signedPlaybackUrl(videoAsset.sourceUrl);
    if (signedUrl) {
      videoAsset = { ...videoAsset, sourceUrl: signedUrl };
    }
    // if signedUrl is null (URL didn't match our storage format), fall back
    // to the stored value as-is rather than silently dropping the source
  }

  return { title, episodes, currentEpisode, videoAsset };
}

/** Other published titles sharing a genre, for "More Like This". */
export async function getRelatedTitles(title: Title, limit = 6): Promise<Title[]> {
  return db
    .select()
    .from(titles)
    .where(
      and(
        eq(titles.status, "published"),
        eq(titles.genre, title.genre),
        ne(titles.id, title.id)
      )
    )
    .limit(limit);
}

/** e.g. 128 -> "2h 8m" */
export function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Whether a title was added recently enough to show a "New" badge. */
export function isRecent(createdAt: string | Date, days = 30): boolean {
  const created = new Date(createdAt).getTime();
  return Date.now() - created < days * 24 * 60 * 60 * 1000;
}