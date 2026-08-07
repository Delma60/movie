"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

interface AdminTitleFiltersProps {
  resultCount: number;
}

export function AdminTitleFilters({ resultCount }: AdminTitleFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/titles${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    updateParam("q", q);
  }

  const hasActiveFilters = Boolean(searchParams.get("q") || type || status);

  return (
    <div className="admin-toolbar">
      <form onSubmit={handleSearchSubmit} className="admin-toolbar-search">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles or genre…"
          className="admin-search-input"
        />
      </form>

      <div className="admin-toolbar-filters">
        <select
          value={type}
          onChange={(e) => updateParam("type", e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All types</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
        </select>

        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-toolbar-clear"
            onClick={() => {
              setQ("");
              router.push("/admin/titles");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <span className="admin-toolbar-count">
        {resultCount} {resultCount === 1 ? "title" : "titles"}
      </span>
    </div>
  );
}
