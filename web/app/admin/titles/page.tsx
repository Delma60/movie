import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminTitleCounts, getAdminTitles } from "@/lib/admin-titles";
import { TitleStatusToggle } from "@/components/admin/TitleStatusToggle";
import { formatDuration } from "@/lib/titles";
import type { TitleStatus, TitleType } from "@/lib/db/schema";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable, AdminTableCellLink } from "@/components/admin/AdminTable";
import { getAdminPaginationMeta } from "@/lib/admin-query";

interface AdminTitlesPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    created?: string;
    page?: string;
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
  const {
    created,
    q,
    type: typeParam,
    status: statusParam,
    page: pageParam,
  } = params;
  const qValue = q?.trim() || undefined;
  const type = VALID_TYPES.includes(typeParam as TitleType)
    ? (params.type as TitleType)
    : undefined;
  const status = VALID_STATUSES.includes(params.status as TitleStatus)
    ? (params.status as TitleStatus)
    : undefined;

  const page = Number.parseInt(pageParam ?? "1", 10);
  const [result, counts] = await Promise.all([
    getAdminTitles({ q: qValue, type, status, page }),
    getAdminTitleCounts(),
  ]);
  const rows = result.rows;
  const pagination = getAdminPaginationMeta(page, 20, result.total);

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

      <AdminFilterBar
        basePath="/admin/titles"
        resultCount={result.total}
        searchPlaceholder="Search titles or genre…"
        filters={[
          {
            key: "type",
            label: "All types",
            value: type ?? "",
            options: [
              { value: "", label: "All types" },
              { value: "movie", label: "Movies" },
              { value: "series", label: "Series" },
            ],
          },
          {
            key: "status",
            label: "All statuses",
            value: status ?? "",
            options: [
              { value: "", label: "All statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ],
          },
        ]}
        singularLabel="title"
        pluralLabel="titles"
      />

      {created && <div className="admin-form-success">Title created.</div>}

      <AdminTable
        columns={[
          "Title",
          "Type",
          "Genre",
          "Year",
          "Duration",
          "Status",
          "Added",
          "",
        ]}
        rows={rows.flatMap((t) => [
          <td key={`${t.id}-title`}>
            <span className="admin-table-primary">{t.title}</span>
            {t.isOriginal && <span className="admin-table-sub">Original</span>}
          </td>,
          <td key={`${t.id}-type`} className="admin-table-dim">
            {t.type === "series" ? "Series" : "Movie"}
          </td>,
          <td key={`${t.id}-genre`} className="admin-table-dim">
            {t.genre}
          </td>,
          <td key={`${t.id}-year`} className="admin-table-dim">
            {t.year ?? "—"}
          </td>,
          <td key={`${t.id}-duration`} className="admin-table-dim">
            {t.type === "series"
              ? "—"
              : (formatDuration(t.durationMinutes) ?? "—")}
          </td>,
          <td key={`${t.id}-status`}>
            <TitleStatusToggle id={t.id} status={t.status} />
          </td>,
          <td key={`${t.id}-added`} className="admin-table-dim">
            {formatDate(t.createdAt)}
          </td>,
          <td key={`${t.id}-view`}>
            <AdminTableCellLink href={`/title/${t.slug}`} external>
              View
            </AdminTableCellLink>
          </td>,
        ])}
        emptyMessage="No titles match those filters."
      />

      <AdminPagination
        basePath="/admin/titles"
        meta={pagination}
        searchParams={new URLSearchParams(params as Record<string, string>)}
      />
    </main>
  );
}
