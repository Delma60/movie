"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEpisode } from "@/lib/actions/admin-episodes";

export function DeleteEpisodeButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete episode "${name}"? This can't be undone.`)) return;
    startTransition(() => {
      void deleteEpisode(id);
    });
  }

  return (
    <button
      type="button"
      className="admin-btn admin-btn-danger"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={`Delete ${name}`}
      style={{ minHeight: 32, padding: "4px 10px" }}
    >
      <Trash2 size={13} strokeWidth={2.25} />
    </button>
  );
}
