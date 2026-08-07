import { db, users } from "@/lib/db";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import type { UserRole } from "@/lib/roles";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-query";

export interface AdminUserFilters {
  q?: string;
  role?: UserRole;
  page?: number;
  pageSize?: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export interface AdminUsersResult {
  rows: AdminUserRow[];
  total: number;
}

export async function getAdminUsers(filters: AdminUserFilters): Promise<AdminUsersResult> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(or(ilike(users.displayName, pattern), ilike(users.email, pattern)));
  }
  if (filters.role) conditions.push(eq(users.role, filters.role));

  const where = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(asc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ value: count() }).from(users).where(where),
  ]);

  return { rows, total: countRows[0].value };
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
