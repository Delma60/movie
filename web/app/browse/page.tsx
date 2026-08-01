import Link from "next/link";
import { BrowseFilters } from "@/components/BrowseFilters";
import { PosterCard } from "@/components/PosterCard";
import {
  getBrowseFilterOptions,
  getBrowseTitles,
  formatDuration,
  isRecent,
  type BrowseSort,
  type TitleType,
} from "@/lib/titles";

interface BrowsePageProps {
  searchParams: Promise<{
    genre?: string;
    year?: string;
    type?: string;
    sort?: string;
  }>;
}

const VALID_SORTS: BrowseSort[] = ["newest", "oldest", "title-asc", "title-desc"];
const VALID_TYPES: TitleType[] = ["movie", "series"];

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;

  const genre = params.genre || undefined;
  const year = params.year ? Number(params.year) : undefined;
  const type = VALID_TYPES.includes(params.type as TitleType)
    ? (params.type as TitleType)
    : undefined;
  const sort = VALID_SORTS.includes(params.sort as BrowseSort)
    ? (params.sort as BrowseSort)
    : "newest";

  const [{ genres, years }, results] = await Promise.all([
    getBrowseFilterOptions(),
    getBrowseTitles({ genre, year, type, sort }),
  ]);

  return (
    <main className="vp-root vp-browse">
      <div className="vp-browse-header">
        <h1 className="vp-browse-title">Browse</h1>
        <p className="vp-browse-subtitle">
          Every movie and series in the Velvet catalogue.
        </p>
      </div>

      <BrowseFilters genres={genres} years={years} resultCount={results.length} />

      {results.length === 0 ? (
        <div className="vp-browse-empty">
          <p>Nothing matches those filters yet.</p>
          <Link href="/browse" className="vp-btn vp-btn-secondary">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="vp-browse-grid">
          {results.map((t, i) => {
            const meta =
              t.type === "series"
                ? [t.year, "Series"].filter(Boolean).join(" · ")
                : [formatDuration(t.durationMinutes), t.year]
                    .filter(Boolean)
                    .join(" · ");

            const badge = t.isOriginal
              ? "Original"
              : isRecent(t.createdAt)
                ? "New"
                : undefined;

            return (
              <PosterCard
                key={t.id}
                variant={i}
                href={`/title/${t.slug}`}
                title={t.title}
                genre={t.genre}
                meta={meta}
                badge={badge}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}