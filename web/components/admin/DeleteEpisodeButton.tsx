"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteEpisode } from "@/lib/actions/admin-episodes";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

export function DeleteEpisodeButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    setConfirmOpen(false);
    startTransition(() => {
      void deleteEpisode(id);
    });
  }

  return (
    <>
      <button
        type="button"
        className="admin-btn admin-btn-danger"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        aria-label={`Delete ${name}`}
        style={{ minHeight: 32, padding: "4px 10px" }}
      >
        <Trash2 size={13} strokeWidth={2.25} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete episode "${name}"?`}
        description="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
