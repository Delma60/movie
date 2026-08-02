// web/lib/roles.ts
//
// Deliberately dependency-free (no db, no next/*) so it can be imported
// from edge middleware (proxy.ts) as well as server components/actions.

export type UserRole = "user" | "editor" | "admin";

/** Ascending privilege order. */
const ROLE_RANK: Record<UserRole, number> = {
  user: 0,
  editor: 1,
  admin: 2,
};

/** True if `role` meets or exceeds `required`. */
export function hasRole(role: UserRole | null | undefined, required: UserRole): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

/**
 * Bootstrap mechanism for the very first admin account.
 *
 * Emails listed in ADMIN_BOOTSTRAP_EMAILS (comma-separated, case-insensitive)
 * get `admin` the moment their user row is created — via signup, first OAuth
 * login, or the lazy auto-create in getCurrentAppUser(). Everyone else starts
 * as `user`. After the first admin exists, use /admin/users to promote
 * anyone else — don't add more emails here for routine promotions.
 */
export function resolveInitialRole(email: string): UserRole {
  const bootstrap = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return bootstrap.includes(email.trim().toLowerCase()) ? "admin" : "user";
}