"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminFilterBarProps {
  basePath: string;
  resultCount: number;
  searchPlaceholder?: string;
  searchLabel?: string;
  filters?: Array<{
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
  }>;
  clearLabel?: string;
  singularLabel?: string;
  pluralLabel?: string;
}

export function AdminFilterBar({
  basePath,
  resultCount,
  searchPlaceholder,
  searchLabel = "Search",
  filters = [],
  clearLabel = "Clear",
  singularLabel = "result",
  pluralLabel = "results",
}: AdminFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  const activeFilters = useMemo(() => {
    return filters.some((filter) => Boolean(searchParams.get(filter.key)));
  }, [filters, searchParams]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(
      `${basePath}${params.toString() ? `?${params.toString()}` : ""}`,
    );
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.delete("page");
    router.push(
      `${basePath}${params.toString() ? `?${params.toString()}` : ""}`,
    );
  }

  const hasActiveFilters = Boolean(q || activeFilters);

  return (
    <div className="admin-toolbar">
      {searchPlaceholder && (
        <form onSubmit={handleSearchSubmit} className="admin-toolbar-search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="admin-search-input"
            aria-label={searchLabel}
          />
        </form>
      )}

      <div className="admin-toolbar-filters">
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={searchParams.get(filter.key) ?? ""}
            onChange={(e) => updateParam(filter.key, e.target.value)}
            className="admin-filter-select"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-toolbar-clear"
            onClick={() => {
              setQ("");
              router.push(basePath);
            }}
          >
            {clearLabel}
          </button>
        )}
      </div>

      <span className="admin-toolbar-count">
        {resultCount} {resultCount === 1 ? singularLabel : pluralLabel}
      </span>
    </div>
  );
}
