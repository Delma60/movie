"use client";

import { useState, useTransition } from "react";
import { toggleTitleStatus } from "@/lib/actions/admin-titles";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { TitleStatus } from "@/lib/db/schema";

interface ArchiveTitleButtonProps {
  id: string;
  title: string;
  status: TitleStatus;
}

export function ArchiveTitleButton({
  id,
  title,
  status,
}: ArchiveTitleButtonProps) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isArchived = current === "archived";

  function runToggle() {
    setError(null);
    startTransition(async () => {
      try {
        const next: TitleStatus = isArchived ? "draft" : "archived";
        await toggleTitleStatus(id, next);
        setCurrent(next);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Couldn't update status.",
        );
      }
    });
  }

  return (
    <div className="admin-status-toggle-wrap">
      <button
        type="button"
        className={`admin-btn ${isArchived ? "admin-btn-secondary" : "admin-btn-danger"}`}
        onClick={() => (isArchived ? runToggle() : setConfirmOpen(true))}
        disabled={isPending}
        style={{ minHeight: 32, padding: "4px 12px", fontSize: 12.5 }}
      >
        {isPending ? "…" : isArchived ? "Restore" : "Archive"}
      </button>
      {error && <span className="admin-status-error">{error}</span>}

      <ConfirmDialog
        open={confirmOpen}
        title={`Archive "${title}"?`}
        description="It's hidden from Browse until restored."
        confirmLabel="Archive"
        danger
        onConfirm={() => {
          setConfirmOpen(false);
          runToggle();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
