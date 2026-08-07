"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { updateVideoStatus } from "@/lib/actions/admin-video";
import type { VideoStatus } from "@/lib/db/schema";

const STATUSES: VideoStatus[] = ["processing", "ready", "failed"];

interface VideoStatusToggleProps {
  id: string;
  status: VideoStatus;
}

export function VideoStatusToggle({ id, status }: VideoStatusToggleProps) {
  const [current, setCurrent] = useState<VideoStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as VideoStatus;
    setError(null);
    startTransition(async () => {
      try {
        await updateVideoStatus(id, next);
        setCurrent(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't update status.");
      }
    });
  }

  return (
    <div className="admin-status-toggle-wrap">
      <select value={current} onChange={handleChange} disabled={isPending} className="admin-status-select">
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
      {error && <span className="admin-status-error">{error}</span>}
    </div>
  );
}
