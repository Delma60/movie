import Link from "next/link";
import {
  Film,
  MonitorPlay,
  UsersRound,
  CreditCard,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import {
  getDashboardStats,
  getRecentTitles,
  getRecentUsers,
} from "@/lib/admin-dashboard";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(d: Date | string) {
  const diffMs = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export default async function AdminDashboardPage() {
  const [stats, recentTitles, recentUsers] = await Promise.all([
    getDashboardStats(),
    getRecentTitles(),
    getRecentUsers(),
  ]);

  const statCards = [
    {
      label: "Titles",
      value: stats.totalTitles,
      icon: Film,
      detail: `${stats.publishedTitles} published · ${stats.draftTitles} draft`,
      href: "/admin/titles",
    },
    {
      label: "Episodes",
      value: stats.totalEpisodes,
      icon: MonitorPlay,
      detail: `across ${stats.totalSeries} series`,
      href: "/admin/episodes",
    },
    {
      label: "Users",
      value: stats.totalUsers,
      icon: UsersRound,
      detail: `+${stats.newUsers7d} in the last 7 days`,
      href: "/admin/users",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      detail: `of ${stats.totalUsers} accounts`,
      href: "/admin/settings",
    },
  ];

  return (
    <main className="admin-page admin-dashboard">
      <div className="admin-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of Velvet content, users, and activity.</p>
        </div>
        <Link href="/admin/titles/new" className="admin-btn admin-btn-primary">
          <Plus size={16} strokeWidth={2.25} />
          Add Title
        </Link>
      </div>

      <div className="admin-stat-grid">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href} className="admin-stat-card">
            <div className="admin-stat-card-top">
              <span className="admin-stat-icon">
                <s.icon size={18} strokeWidth={2} />
              </span>
              <ArrowUpRight
                size={14}
                className="admin-stat-arrow"
                aria-hidden="true"
              />
            </div>
            <span className="admin-stat-value">{s.value.toLocaleString()}</span>
            <span className="admin-stat-label">{s.label}</span>
            <span className="admin-stat-detail">{s.detail}</span>
          </Link>
        ))}
      </div>

      <div className="admin-panel-grid">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Recently Added Titles</h2>
            <Link href="/admin/titles">View all</Link>
          </div>

          {recentTitles.length === 0 ? (
            <p className="admin-empty">No titles yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {recentTitles.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link
                        href={`/title/${t.slug}`}
                        className="admin-table-link"
                      >
                        {t.title}
                      </Link>
                    </td>
                    <td className="admin-table-dim">
                      {t.type === "series" ? "Series" : "Movie"}
                    </td>
                    <td>
                      <span className={`admin-pill admin-pill-${t.status}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="admin-table-dim">{timeAgo(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2>Newest Users</h2>
            <Link href="/admin/users">View all</Link>
          </div>

          {recentUsers.length === 0 ? (
            <p className="admin-empty">No users yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="admin-table-primary">
                        {u.displayName}
                      </span>
                      <span className="admin-table-dim admin-table-sub">
                        {u.email}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill admin-pill-role-${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="admin-table-dim">{timeAgo(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
