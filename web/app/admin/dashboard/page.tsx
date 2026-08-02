import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="admin-page">
      <h1>Admin Dashboard</h1>
      <p>Overview of Velvet content, users, and activity.</p>
      <div className="admin-nav-cards">
        <Link href="/admin/titles" className="admin-card">
          <h2>Titles</h2>
          <p>Manage movies, series, and publishing status.</p>
        </Link>
        <Link href="/admin/users" className="admin-card">
          <h2>Users</h2>
          <p>View accounts, roles, and activity.</p>
        </Link>
        <Link href="/admin/analytics" className="admin-card">
          <h2>Analytics</h2>
          <p>See usage metrics and system health.</p>
        </Link>
        <Link href="/admin/settings" className="admin-card">
          <h2>Settings</h2>
          <p>Configure site and admin preferences.</p>
        </Link>
      </div>
    </main>
  );
}
