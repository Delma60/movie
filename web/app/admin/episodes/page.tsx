import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getAdminEpisodeCounts,
  getAdminEpisodes,
  getSeriesTitlesForFilter,
} from "@/lib/admin-episodes";
import { AdminEpisodeFilters } from "@/components/admin/AdminEpisodeFilters";
import type { VideoStatus } from "@/lib/db/schema";

interface AdminEpisodesPageProps {
  searchParams: Promise<{ q?: string; titleId?: string; status?: string }>;
}

const VALID_STATUSES: (VideoStatus | "missing")[] = ["ready", "processing", "failed", "missing"];

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

export default async function AdminEpisodesPage({ searchParams }: AdminEpisodesPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const titleId = params.titleId?.trim() || undefined;
  const status = VALID_STATUSES.includes(params.status as VideoStatus | "missing")
    ? (params.status as VideoStatus | "missing")
    : undefined;

  const [rows, counts, seriesOptions] = await Promise.all([
    getAdminEpisodes({ q, titleId, status }),
    getAdminEpisodeCounts(),
    getSeriesTitlesForFilter(),
  ]);

  return (
    <main className="admin-page admin-episodes-page">
      <div className="admin-page-head">
        <div>
          <h1>Episodes</h1>
          <p>
            {counts.total} across {counts.seriesCount} series · {counts.ready} ready · {counts.processing} processing
            {counts.failed > 0 && ` · ${counts.failed} failed`}
            {counts.missing > 0 && ` · ${counts.missing} missing video`}
          </p>
        </div>
        <Link href="/admin/episodes/new" className="admin-btn admin-btn-primary">
          <Plus size={16} strokeWidth={2.25} />
          Add Episode
        </Link>
      </div>

      <AdminEpisodeFilters seriesOptions={seriesOptions} resultCount={rows.length} />

      {rows.length === 0 ? (
        <div className="admin-panel admin-empty-block">
          <p className="admin-empty">No episodes match those filters.</p>
        </div>
      ) : (
        <div className="admin-panel admin-episodes-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Series</th>
                <th>Episode</th>
                <th>Duration</th>
                <th>Video</th>
                <th>Added</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={`/title/${e.titleSlug}`} className="admin-table-link" target="_blank">
                      {e.titleName}
                    </Link>
                  </td>
                  <td>
                    <span className="admin-table-primary">
                      S{e.season} · E{e.episodeNumber}
                    </span>
                    <span className="admin-table-sub">{e.name}</span>
                  </td>
                  <td className="admin-table-dim">{formatDuration(e.durationMinutes)}</td>
                  <td>
                    <span className={`admin-pill admin-pill-video-${e.videoStatus ?? "missing"}`}>
                      {e.videoStatus ?? "missing"}
                    </span>
                  </td>
                  <td className="admin-table-dim">{formatDate(e.createdAt)}</td>
                  <td>
                    <Link
                      href={`/watch/${e.titleSlug}?ep=${e.id}`}
                      className="admin-table-link"
                      target="_blank"
                    >
                      Preview
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
