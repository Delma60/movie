import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminTitleCounts, getAdminTitles } from "@/lib/admin-titles";
import { AdminTitleFilters } from "@/components/admin/AdminTitleFilters";
import { TitleStatusToggle } from "@/components/admin/TitleStatusToggle";
import { formatDuration } from "@/lib/titles";
import type { TitleStatus, TitleType } from "@/lib/db/schema";

interface AdminTitlesPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    created?: string;
  }>;
}

const VALID_TYPES: TitleType[] = ["movie", "series"];
const VALID_STATUSES: TitleStatus[] = ["draft", "published"];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminTitlesPage({
  searchParams,
}: AdminTitlesPageProps) {
  const params = await searchParams;
  const { created, q, type: typeParam, status: statusParam } = params;
  const qValue = q?.trim() || undefined;
  const type = VALID_TYPES.includes(typeParam as TitleType)
    ? (params.type as TitleType)
    : undefined;
  const status = VALID_STATUSES.includes(params.status as TitleStatus)
    ? (params.status as TitleStatus)
    : undefined;

  const [rows, counts] = await Promise.all([
    getAdminTitles({ q: qValue, type, status }),
    getAdminTitleCounts(),
  ]);

  return (
    <main className="admin-page admin-titles-page">
      <div className="admin-page-head">
        <div>
          <h1>Titles</h1>
          <p>
            {counts.total} total · {counts.published} published · {counts.draft}{" "}
            draft
          </p>
        </div>
        <Link href="/admin/titles/new" className="admin-btn admin-btn-primary">
          <Plus size={16} strokeWidth={2.25} />
          Add Title
        </Link>
      </div>

      <AdminTitleFilters resultCount={rows.length} />

      {created && <div className="admin-form-success">Title created.</div>}

      {rows.length === 0 ? (
        <div className="admin-panel admin-empty-block">
          <p className="admin-empty">No titles match those filters.</p>
        </div>
      ) : (
        <div className="admin-panel admin-titles-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Genre</th>
                <th>Year</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Added</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="admin-table-primary">{t.title}</span>
                    {t.isOriginal && (
                      <span className="admin-table-sub">Original</span>
                    )}
                  </td>
                  <td className="admin-table-dim">
                    {t.type === "series" ? "Series" : "Movie"}
                  </td>
                  <td className="admin-table-dim">{t.genre}</td>
                  <td className="admin-table-dim">{t.year ?? "—"}</td>
                  <td className="admin-table-dim">
                    {t.type === "series"
                      ? "—"
                      : (formatDuration(t.durationMinutes) ?? "—")}
                  </td>
                  <td>
                    <TitleStatusToggle id={t.id} status={t.status} />
                  </td>
                  <td className="admin-table-dim">{formatDate(t.createdAt)}</td>
                  <td>
                    <Link
                      href={`/title/${t.slug}`}
                      className="admin-table-link"
                      target="_blank"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
