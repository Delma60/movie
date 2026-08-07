import Link from "next/link";
import { Users, Eye, Clock, CreditCard } from "lucide-react";
import {
  getAnalyticsOverview,
  getGenreBreakdown,
  getMostWatchedTitles,
  getSignupsOverTime,
} from "@/lib/admin-analytics";
import { formatDuration } from "@/lib/titles";
import { GenreChart, SignupsChart } from "@/components/admin/AnalyticsCharts";
import { AdminTable, AdminTableCellLink } from "@/components/admin/AdminTable";

export default async function AdminAnalyticsPage() {
  const [overview, signups, mostWatched, genres] = await Promise.all([
    getAnalyticsOverview(),
    getSignupsOverTime(30),
    getMostWatchedTitles(8),
    getGenreBreakdown(8),
  ]);

  const statCards = [
    {
      label: "Total Users",
      value: overview.totalUsers,
      icon: Users,
      detail: `${overview.activeUsers30d} active in the last 30 days`,
    },
    {
      label: "Active Users (7d)",
      value: overview.activeUsers7d,
      icon: Eye,
      detail: `of ${overview.totalUsers} total accounts`,
    },
    {
      label: "Total Watch Time",
      value: `${Math.round(overview.totalWatchMinutes / 60).toLocaleString()}h`,
      icon: Clock,
      detail: `${overview.totalWatchMinutes.toLocaleString()} minutes logged`,
    },
    {
      label: "Active Subscriptions",
      value: overview.activeSubscriptions,
      icon: CreditCard,
      detail: `of ${overview.totalUsers} accounts`,
    },
  ];

  const hasSignups = signups.some((point) => point.count > 0);

  return (
    <main className="admin-page admin-analytics-page">
      <div className="admin-page-head">
        <div>
          <h1>Analytics</h1>
          <p>Monitor content performance and user engagement.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="admin-stat-card admin-stat-card-static"
          >
            <div className="admin-stat-card-top">
              <span className="admin-stat-icon">
                <stat.icon size={18} strokeWidth={2} />
              </span>
            </div>
            <span className="admin-stat-value">
              {typeof stat.value === "number"
                ? stat.value.toLocaleString()
                : stat.value}
            </span>
            <span className="admin-stat-label">{stat.label}</span>
            <span className="admin-stat-detail">{stat.detail}</span>
          </div>
        ))}
      </div>

      <div className="admin-panel-grid">
        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-head">
            <h2>Signups, Last 30 Days</h2>
          </div>
          {hasSignups ? (
            <SignupsChart data={signups} />
          ) : (
            <p className="admin-empty">No signups in this window yet.</p>
          )}
        </section>

        <section className="admin-panel admin-chart-panel">
          <div className="admin-panel-head">
            <h2>Viewers by Genre</h2>
          </div>
          {genres.length > 0 ? (
            <GenreChart data={genres} />
          ) : (
            <p className="admin-empty">No watch activity yet.</p>
          )}
        </section>
      </div>

      <section className="admin-panel admin-mostwatched-panel">
        <div className="admin-panel-head">
          <h2>Most-Watched Titles</h2>
          <Link href="/admin/titles">All titles</Link>
        </div>

        <AdminTable
          columns={["Title", "Type", "Viewers", "Watch Time"]}
          rows={mostWatched.map((title) => (
            <tr key={title.id}>
              <td>
                <AdminTableCellLink href={`/title/${title.slug}`} external>
                  {title.title}
                </AdminTableCellLink>
              </td>
              <td className="admin-table-dim">
                {title.type === "series" ? "Series" : "Movie"}
              </td>
              <td className="admin-table-dim">
                {title.viewerCount.toLocaleString()}
              </td>
              <td className="admin-table-dim">
                {formatDuration(Math.round(title.totalSecondsWatched / 60)) ??
                  "—"}
              </td>
            </tr>
          ))}
          emptyMessage="No watch activity recorded yet."
        />
      </section>
    </main>
  );
}
