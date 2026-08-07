"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

interface AdminEpisodeFiltersProps {
  seriesOptions: { id: string; title: string }[];
  resultCount: number;
}

export function AdminEpisodeFilters({ seriesOptions, resultCount }: AdminEpisodeFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const titleId = searchParams.get("titleId") ?? "";
  const status = searchParams.get("status") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/episodes${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    updateParam("q", q);
  }

  const hasActiveFilters = Boolean(searchParams.get("q") || titleId || status);

  return (
    <div className="admin-toolbar">
      <form onSubmit={handleSearchSubmit} className="admin-toolbar-search">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search episode or series…"
          className="admin-search-input"
        />
      </form>

      <div className="admin-toolbar-filters">
        <select
          value={titleId}
          onChange={(e) => updateParam("titleId", e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All series</option>
          {seriesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All video statuses</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="missing">Missing</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-toolbar-clear"
            onClick={() => {
              setQ("");
              router.push("/admin/episodes");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <span className="admin-toolbar-count">
        {resultCount} {resultCount === 1 ? "episode" : "episodes"}
      </span>
    </div>
  );
}
