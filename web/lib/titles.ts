import { db, titles } from "@/lib/db";
import type { Title } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export type TitleType = "movie" | "series";

export type BrowseSort = "newest" | "oldest" | "title-asc" | "title-desc";

export const BROWSE_SORTS: { value: BrowseSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

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