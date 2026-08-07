"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { moveEpisode } from "@/lib/actions/admin-episodes";

export function EpisodeReorderButtons({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function move(direction: "up" | "down") {
    startTransition(() => {
      void moveEpisode(id, direction);
    });
  }

  return (
    <div style={{ display: "flex", gap: 4 }}>
      <button
        type="button"
        className="vp-icon-btn"
        onClick={() => move("up")}
        disabled={isPending}
        aria-label="Move up"
        style={{ minWidth: 28, minHeight: 28 }}
      >
        <ArrowUp size={14} strokeWidth={2.25} />
      </button>
      <button
        type="button"
        className="vp-icon-btn"
        onClick={() => move("down")}
        disabled={isPending}
        aria-label="Move down"
        style={{ minWidth: 28, minHeight: 28 }}
      >
        <ArrowDown size={14} strokeWidth={2.25} />
      </button>
    </div>
  );
}
