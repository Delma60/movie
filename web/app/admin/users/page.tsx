import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/actions/admin-users";
import { getAdminUserCounts } from "@/lib/admin-users";
import { UserRoleRow } from "@/components/admin/UserRoleRow";
import { AdminUserFilters } from "@/components/admin/AdminUserFilters";
import type { UserRole } from "@/lib/roles";

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string; role?: string }>;
}

const VALID_ROLES: UserRole[] = ["user", "editor", "admin"];

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  // Layout already requires "editor"; user management specifically needs
  // "admin", so re-gate here with a clean redirect instead of letting an
  // editor hit the page and have listUsers() throw mid-render.
  await requireRole("admin", "/admin");

  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const role = VALID_ROLES.includes(params.role as UserRole)
    ? (params.role as UserRole)
    : undefined;

  const [rows, counts] = await Promise.all([
    listUsers({ q, role }),
    getAdminUserCounts(),
  ]);

  return (
    <main className="admin-page admin-users-page">
      <div className="admin-page-head">
        <div>
          <h1>Users</h1>
          <p>
            {counts.total} total · {counts.admins} admin
            {counts.admins === 1 ? "" : "s"} · {counts.editors} editor
            {counts.editors === 1 ? "" : "s"} · {counts.users} viewer
            {counts.users === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <AdminUserFilters resultCount={rows.length} />

      {rows.length === 0 ? (
        <div className="admin-panel admin-empty-block">
          <p className="admin-empty">No users match those filters.</p>
        </div>
      ) : (
        <div className="admin-panel admin-users-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <UserRoleRow
                  key={u.id}
                  id={u.id}
                  displayName={u.displayName}
                  email={u.email}
                  role={u.role}
                  createdAt={u.createdAt}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
