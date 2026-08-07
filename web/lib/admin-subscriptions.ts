import { db, subscriptions, users } from "@/lib/db";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-query";
import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import type { SubscriptionStatus } from "@/lib/db/schema";

export interface AdminSubscriptionFilters {
  q?: string;
  status?: SubscriptionStatus;
  page?: number;
  pageSize?: number;
}

export interface AdminSubscriptionRow {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  plan: string;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

export interface AdminSubscriptionsResult {
  rows: AdminSubscriptionRow[];
  total: number;
}

export async function getAdminSubscriptions(
  filters: AdminSubscriptionFilters = {},
): Promise<AdminSubscriptionsResult> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(users.displayName, pattern),
        ilike(users.email, pattern),
        ilike(subscriptions.plan, pattern),
      ),
    );
  }
  if (filters.status) conditions.push(eq(subscriptions.status, filters.status));

  const where = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        userId: users.id,
        displayName: users.displayName,
        email: users.email,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(where)
      .orderBy(asc(subscriptions.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(where),
  ]);

  return { rows, total: countRows[0].value };
}

export interface AdminSubscriptionCounts {
  total: number;
  active: number;
  trialing: number;
  past_due: number;
  canceled: number;
}

export async function getAdminSubscriptionCounts(): Promise<AdminSubscriptionCounts> {
  const [[{ value: total }], statusRows] = await Promise.all([
    db.select({ value: count() }).from(subscriptions),
    db
      .select({ status: subscriptions.status, value: count() })
      .from(subscriptions)
      .groupBy(subscriptions.status),
  ]);

  const byStatus: Partial<Record<SubscriptionStatus, number>> = {};
  for (const row of statusRows) {
    byStatus[row.status] = row.value;
  }

  return {
    total,
    active: byStatus.active ?? 0,
    trialing: byStatus.trialing ?? 0,
    past_due: byStatus.past_due ?? 0,
    canceled: byStatus.canceled ?? 0,
  };
}
