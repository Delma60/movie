"use client";

import { useState, useTransition } from "react";
import { toggleTitleStatus } from "@/lib/actions/admin-titles";
import type { TitleStatus } from "@/lib/db/schema";

interface TitleStatusToggleProps {
  id: string;
  status: TitleStatus;
}

export function TitleStatusToggle({ id, status }: TitleStatusToggleProps) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next: TitleStatus = current === "published" ? "draft" : "published";
    setError(null);
    startTransition(async () => {
      try {
        await toggleTitleStatus(id, next);
        setCurrent(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update status.");
      }
    });
  }

  return (
    <div className="admin-status-toggle-wrap">
      <button
        type="button"
        className={`admin-pill admin-pill-${current} admin-pill-btn`}
        onClick={handleToggle}
        disabled={isPending}
        title={`Click to mark as ${current === "published" ? "draft" : "published"}`}
      >
        {isPending ? "…" : current}
      </button>
      {error && <span className="admin-status-error">{error}</span>}
    </div>
  );
}
