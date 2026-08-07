import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/actions/admin-users";
import { getAdminUserCounts } from "@/lib/admin-users";
import type { UserRole } from "@/lib/roles";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable } from "@/components/admin/AdminTable";
import { UserRoleRow } from "@/components/admin/UserRoleRow";
import { getAdminPaginationMeta } from "@/lib/admin-query";

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
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
  const page = Number.parseInt(params.page ?? "1", 10);
  const role = VALID_ROLES.includes(params.role as UserRole)
    ? (params.role as UserRole)
    : undefined;

  const [result, counts] = await Promise.all([
    listUsers({ q, role, page }),
    getAdminUserCounts(),
  ]);
  const rows = result.rows;
  const pagination = getAdminPaginationMeta(page, 20, result.total);

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

      <AdminFilterBar
        basePath="/admin/users"
        resultCount={result.total}
        searchPlaceholder="Search name or email…"
        filters={[
          {
            key: "role",
            label: "All roles",
            value: role ?? "",
            options: [
              { value: "", label: "All roles" },
              { value: "user", label: "User" },
              { value: "editor", label: "Editor" },
              { value: "admin", label: "Admin" },
            ],
          },
        ]}
        singularLabel="user"
        pluralLabel="users"
      />

      <AdminTable
        columns={["Name", "Email", "Role", "Joined"]}
        rows={rows.map((u) => (
          <UserRoleRow
            key={u.id}
            id={u.id}
            displayName={u.displayName}
            email={u.email}
            role={u.role}
            createdAt={u.createdAt}
          />
        ))}
        emptyMessage="No users match those filters."
      />

      <AdminPagination
        basePath="/admin/users"
        meta={pagination}
        searchParams={new URLSearchParams(params as Record<string, string>)}
      />
    </main>
  );
}
