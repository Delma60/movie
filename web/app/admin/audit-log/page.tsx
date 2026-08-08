import { requireRole } from "@/lib/auth";
import {
  getAdminAuditLog,
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from "@/lib/admin-audit";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import { getAdminPaginationMeta } from "@/lib/admin-query";

interface AdminAuditLogPageProps {
  searchParams: Promise<{
    q?: string;
    action?: string;
    targetType?: string;
    page?: string;
  }>;
}

const ACTION_LABELS: Record<string, string> = {
  "title.created": "Title created",
  "title.status_changed": "Title status changed",
  "title.updated": "Title updated",
  "episode.created": "Episode created",
  "episode.updated": "Episode updated",
  "episode.deleted": "Episode deleted",
  "episode.reordered": "Episode reordered",
  "video.attached": "Video attached",
  "video.status_changed": "Video status changed",
  "ad.created": "Ad created",
  "ad.active_toggled": "Ad active toggled",
  "subscription.created": "Subscription created",
  "subscription.status_changed": "Subscription status changed",
  "user.role_changed": "User role changed",
};

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMetadata(
  metadata: Record<string, unknown> | null,
): string | null {
  if (!metadata) return null;
  if ("from" in metadata || "to" in metadata) {
    // @ts-ignore
    return `${String(metadata.from ?? "—")} → ${String(metadata.to ?? "—")}`;
  }
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined,
  );
  return entries.length
    ? entries.map(([k, v]) => `${k}: ${v}`).join(" · ")
    : null;
}

export default async function AdminAuditLogPage({
  searchParams,
}: AdminAuditLogPageProps) {
  await requireRole("admin", "/admin");

  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const action = AUDIT_ACTIONS.includes(params.action as any)
    ? params.action
    : undefined;
  const targetType = AUDIT_TARGET_TYPES.includes(params.targetType ?? "")
    ? params.targetType
    : undefined;
  const page = Number.parseInt(params.page ?? "1", 10);

  const result = await getAdminAuditLog({ q, action, targetType, page });
  const pagination = getAdminPaginationMeta(page, 20, result.total);

  return (
    <main className="admin-page admin-audit-page">
      <div className="admin-page-head">
        <div>
          <h1>Audit Log</h1>
          <p>{result.total} recorded admin actions.</p>
        </div>
      </div>

      <AdminFilterBar
        basePath="/admin/audit-log"
        resultCount={result.total}
        searchPlaceholder="Search actor or target…"
        filters={[
          {
            key: "action",
            label: "All actions",
            value: action ?? "",
            options: [{ value: "", label: "All actions" }].concat(
              AUDIT_ACTIONS.map((a) => ({
                value: a,
                label: ACTION_LABELS[a] ?? a,
              })),
            ),
          },
          {
            key: "targetType",
            label: "All target types",
            value: targetType ?? "",
            options: [{ value: "", label: "All target types" }].concat(
              AUDIT_TARGET_TYPES.map((t) => ({
                value: t,
                label: t[0].toUpperCase() + t.slice(1),
              })),
            ),
          },
        ]}
        singularLabel="entry"
        pluralLabel="entries"
      />

      <AdminTable
        columns={["When", "Actor", "Action", "Target", "Details"]}
        rows={result.rows.map((entry) => (
          <tr key={entry.id}>
            <td className="admin-table-dim">
              {formatDateTime(entry.createdAt)}
            </td>
            <td>
              <span className="admin-table-primary">{entry.actorName}</span>
              <span className="admin-table-sub">{entry.actorEmail}</span>
            </td>
            <td>{ACTION_LABELS[entry.action] ?? entry.action}</td>
            <td className="admin-table-dim">
              {entry.targetLabel ?? entry.targetId ?? "—"}
            </td>
            <td className="admin-table-dim">
              {formatMetadata(entry.metadata as any) ?? "—"}
            </td>
          </tr>
        ))}
        emptyMessage="No admin actions recorded yet."
      />

      <AdminPagination
        basePath="/admin/audit-log"
        meta={pagination}
        searchParams={new URLSearchParams(params as Record<string, string>)}
      />
    </main>
  );
}
