import { db, users } from "@/lib/db";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import type { UserRole } from "@/lib/roles";

export interface AdminUserFilters {
  q?: string;
  role?: UserRole;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export async function getAdminUsers(filters: AdminUserFilters): Promise<AdminUserRow[]> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(users.displayName, pattern), ilike(users.email, pattern)));
  }
  if (filters.role) conditions.push(eq(users.role, filters.role));

  return db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(users.createdAt));
}

export async function getAdminUserCounts(): Promise<{
  total: number;
  admins: number;
  editors: number;
  users: number;
}> {
  const [[{ value: total }], [{ value: admins }], [{ value: editors }]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(eq(users.role, "admin")),
    db.select({ value: count() }).from(users).where(eq(users.role, "editor")),
  ]);

  return { total, admins, editors, users: total - admins - editors };
}
