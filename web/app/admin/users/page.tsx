import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/actions/admin-users";
import { UserRoleRow } from "@/components/admin/UserRoleRow";

export default async function AdminUsersPage() {
  // Layout already requires "editor"; user management specifically needs
  // "admin", so re-gate here with a clean redirect instead of letting an
  // editor hit the page and have listUsers() throw mid-render.
  await requireRole("admin", "/admin");

  const rows = await listUsers();

  return (
    <main className="admin-page">
      <h1>Users</h1>
      <p>
        Manage account roles. Promoting someone to editor or admin gives them
        access to this admin panel.
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
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
            />
          ))}
        </tbody>
      </table>
    </main>
  );
}
