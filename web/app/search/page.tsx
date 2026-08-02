import Link from "next/link";
import { PosterCard } from "@/components/PosterCard";
import { searchTitles, formatDuration } from "@/lib/titles";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchTitles(query) : [];

  return (
    <main className="vp-root vp-browse vp-search-page">
      <div className="vp-browse-header">
        <h1 className="vp-browse-title">Search</h1>
        <p className="vp-browse-subtitle">
          Find movies and series by title or genre.
        </p>
      </div>

      <form action="/search" method="get" className="vp-search-form">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search titles, genres…"
          className="vp-search-input"
          autoFocus
        />
        <button type="submit" className="vp-btn vp-btn-primary">
          Search
        </button>
      </form>

      {!query ? (
        <div className="vp-browse-empty">
          <p>Start typing to search the Velvet catalogue.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="vp-browse-empty">
          <p>No titles match &ldquo;{query}&rdquo;.</p>
          <Link href="/browse" className="vp-btn vp-btn-secondary">
            Browse Catalogue
          </Link>
        </div>
      ) : (
        <>
          <p className="vp-browse-count vp-search-count">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;
            {query}&rdquo;
          </p>
          <div className="vp-browse-grid">
            {results.map((t, i) => {
              const meta =
                t.type === "series"
                  ? [t.year, "Series"].filter(Boolean).join(" · ")
                  : [formatDuration(t.durationMinutes), t.year]
                      .filter(Boolean)
                      .join(" · ");

              return (
                <PosterCard
                  key={t.id}
                  variant={i}
                  href={`/title/${t.slug}`}
                  title={t.title}
                  genre={t.genre}
                  meta={meta}
                  badge={t.isOriginal ? "Original" : undefined}
                />
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
