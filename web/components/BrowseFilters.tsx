"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BROWSE_SORTS, type BrowseSort } from "@/lib/browse-options";

interface BrowseFiltersProps {
  genres: string[];
  years: number[];
  resultCount: number;
}

export function BrowseFilters({
  genres,
  years,
  resultCount,
}: BrowseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const genre = searchParams.get("genre") ?? "";
  const year = searchParams.get("year") ?? "";
  const type = searchParams.get("type") ?? "";
  const sort = (searchParams.get("sort") as BrowseSort | null) ?? "newest";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/browse${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const hasActiveFilters = genre || year || type;

  return (
    <div className="vp-browse-filters">
      <div className="vp-browse-filters-controls">
        <label className="vp-browse-filter">
          <span>Type</span>
          <select
            value={type}
            onChange={(e) => updateParam("type", e.target.value)}
          >
            <option value="">All</option>
            <option value="movie">Movies</option>
            <option value="series">Series</option>
          </select>
        </label>

        <label className="vp-browse-filter">
          <span>Genre</span>
          <select
            value={genre}
            onChange={(e) => updateParam("genre", e.target.value)}
          >
            <option value="">All genres</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="vp-browse-filter">
          <span>Year</span>
          <select
            value={year}
            onChange={(e) => updateParam("year", e.target.value)}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="vp-browse-filter">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
          >
            {BROWSE_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            className="vp-browse-clear"
            onClick={() => router.push("/browse")}
          >
            Clear filters
          </button>
        )}
      </div>

      <span className="vp-browse-count">
        {resultCount} {resultCount === 1 ? "title" : "titles"}
      </span>
    </div>
  );
}
