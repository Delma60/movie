"use client";

import { useState, useTransition } from "react";
import { toggleAdActive } from "@/lib/actions/admin-ads";

interface AdActiveToggleProps {
  id: string;
  active: boolean;
}

export function AdActiveToggle({ id, active }: AdActiveToggleProps) {
  const [current, setCurrent] = useState(active);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);
    startTransition(async () => {
      try {
        await toggleAdActive(id, !current);
        setCurrent(!current);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update ad status.");
      }
    });
  }

  return (
    <div className="admin-status-toggle-wrap">
      <button
        type="button"
        className={`admin-pill admin-pill-${current ? "active" : "inactive"} admin-pill-btn`}
        onClick={handleToggle}
        disabled={isPending}
        title={current ? "Deactivate ad" : "Activate ad"}
      >
        {isPending ? "…" : current ? "Active" : "Inactive"}
      </button>
      {error && <span className="admin-status-error">{error}</span>}
    </div>
  );
}
