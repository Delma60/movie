"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

interface AdminUserFiltersProps {
  resultCount: number;
}

export function AdminUserFilters({ resultCount }: AdminUserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const role = searchParams.get("role") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin/users${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    updateParam("q", q);
  }

  const hasActiveFilters = Boolean(searchParams.get("q") || role);

  return (
    <div className="admin-toolbar">
      <form onSubmit={handleSearchSubmit} className="admin-toolbar-search">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="admin-search-input"
        />
      </form>

      <div className="admin-toolbar-filters">
        <select
          value={role}
          onChange={(e) => updateParam("role", e.target.value)}
          className="admin-filter-select"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="admin-toolbar-clear"
            onClick={() => {
              setQ("");
              router.push("/admin/users");
            }}
          >
            Clear
          </button>
        )}
      </div>

      <span className="admin-toolbar-count">
        {resultCount} {resultCount === 1 ? "user" : "users"}
      </span>
    </div>
  );
}
