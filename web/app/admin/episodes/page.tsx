import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getAdminEpisodeCounts,
  getAdminEpisodes,
  getSeriesTitlesForFilter,
} from "@/lib/admin-episodes";
import type { VideoStatus } from "@/lib/db/schema";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable, AdminTableCellLink } from "@/components/admin/AdminTable";
import { getAdminPaginationMeta } from "@/lib/admin-query";

interface AdminEpisodesPageProps {
  searchParams: Promise<{
    q?: string;
    titleId?: string;
    status?: string;
    page?: string;
  }>;
}

const VALID_STATUSES: (VideoStatus | "missing")[] = [
  "ready",
  "processing",
  "failed",
  "missing",
];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default async function AdminEpisodesPage({
  searchParams,
}: AdminEpisodesPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const titleId = params.titleId?.trim() || undefined;
  const page = Number.parseInt(params.page ?? "1", 10);
  const status = VALID_STATUSES.includes(
    params.status as VideoStatus | "missing",
  )
    ? (params.status as VideoStatus | "missing")
    : undefined;

  const [result, counts, seriesOptions] = await Promise.all([
    getAdminEpisodes({ q, titleId, status, page }),
    getAdminEpisodeCounts(),
    getSeriesTitlesForFilter(),
  ]);
  const rows = result.rows;
  const pagination = getAdminPaginationMeta(page, 20, result.total);

  return (
    <main className="admin-page admin-episodes-page">
      <div className="admin-page-head">
        <div>
          <h1>Episodes</h1>
          <p>
            {counts.total} across {counts.seriesCount} series · {counts.ready}{" "}
            ready · {counts.processing} processing
            {counts.failed > 0 && ` · ${counts.failed} failed`}
            {counts.missing > 0 && ` · ${counts.missing} missing video`}
          </p>
        </div>
        <Link
          href="/admin/episodes/new"
          className="admin-btn admin-btn-primary"
        >
          <Plus size={16} strokeWidth={2.25} />
          Add Episode
        </Link>
      </div>

      <AdminFilterBar
        basePath="/admin/episodes"
        resultCount={result.total}
        searchPlaceholder="Search episode or series…"
        filters={[
          {
            key: "titleId",
            label: "All series",
            value: titleId ?? "",
            options: [{ value: "", label: "All series" }].concat(
              seriesOptions.map((series) => ({
                value: series.id,
                label: series.title,
              })),
            ),
          },
          {
            key: "status",
            label: "All video statuses",
            value: status ?? "",
            options: [
              { value: "", label: "All video statuses" },
              { value: "ready", label: "Ready" },
              { value: "processing", label: "Processing" },
              { value: "failed", label: "Failed" },
              { value: "missing", label: "Missing" },
            ],
          },
        ]}
        singularLabel="episode"
        pluralLabel="episodes"
      />

      <AdminTable
        columns={["Series", "Episode", "Duration", "Video", "Added", ""]}
        rows={rows.flatMap((e) => [
          <td key={`${e.id}-series`}>
            <AdminTableCellLink href={`/title/${e.titleSlug}`} external>
              {e.titleName}
            </AdminTableCellLink>
          </td>,
          <td key={`${e.id}-episode`}>
            <span className="admin-table-primary">
              S{e.season} · E{e.episodeNumber}
            </span>
            <span className="admin-table-sub">{e.name}</span>
          </td>,
          <td key={`${e.id}-duration`} className="admin-table-dim">
            {formatDuration(e.durationMinutes)}
          </td>,
          <td key={`${e.id}-video`}>
            <span
              className={`admin-pill admin-pill-video-${e.videoStatus ?? "missing"}`}
            >
              {e.videoStatus ?? "missing"}
            </span>
          </td>,
          <td key={`${e.id}-added`} className="admin-table-dim">
            {formatDate(e.createdAt)}
          </td>,
          <td key={`${e.id}-preview`}>
            <AdminTableCellLink
              href={`/watch/${e.titleSlug}?ep=${e.id}`}
              external
            >
              Preview
            </AdminTableCellLink>
          </td>,
        ])}
        emptyMessage="No episodes match those filters."
      />

      <AdminPagination
        basePath="/admin/episodes"
        meta={pagination}
        searchParams={new URLSearchParams(params as Record<string, string>)}
      />
    </main>
  );
}
