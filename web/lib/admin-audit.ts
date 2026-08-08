import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-query";
import type { AuditAction } from "./audit";

export interface AdminAuditFilters {
  q?: string;
  action?: string;
  targetType?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminAuditResult {
  rows: (typeof auditLogs.$inferSelect)[];
  total: number;
}

export async function getAdminAuditLog(filters: AdminAuditFilters = {}): Promise<AdminAuditResult> {
  const conditions: any[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(auditLogs.actorName, pattern),
        ilike(auditLogs.actorEmail, pattern),
        ilike(auditLogs.targetLabel, pattern),
      ),
    );
  }
  if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters.targetType) conditions.push(eq(auditLogs.targetType, filters.targetType));

  const where = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, countRows] = await Promise.all([
    db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ value: count() }).from(auditLogs).where(where),
  ]);

  return { rows, total: countRows[0].value };
}

export const AUDIT_ACTIONS: AuditAction[] = [
  "title.created",
  "title.status_changed",
  "title.updated",
  "episode.created",
  "episode.updated",
  "episode.deleted",
  "episode.reordered",
  "video.attached",
  "video.status_changed",
  "ad.created",
  "ad.active_toggled",
  "subscription.created",
  "subscription.status_changed",
  "user.role_changed",
];

export const AUDIT_TARGET_TYPES = ["title", "episode", "ad", "subscription", "user"];
