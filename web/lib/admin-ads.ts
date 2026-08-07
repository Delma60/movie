import { db, ads, titles } from "@/lib/db";
import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-query";
import type { AdPlacement } from "@/lib/db/schema";

export interface AdminAdFilters {
  q?: string;
  placement?: AdPlacement;
  active?: boolean;
  page?: number;
  pageSize?: number;
}

export interface AdminAdRow {
  id: string;
  headline: string;
  placement: AdPlacement;
  active: boolean;
  titleId: string | null;
  titleSlug: string | null;
  titleName: string | null;
  description: string | null;
  ctaText: string;
  ctaUrl: string;
  createdAt: Date;
}

export interface AdminAdsResult {
  rows: AdminAdRow[];
  total: number;
}

export async function getAdminAds(filters: AdminAdFilters = {}): Promise<AdminAdsResult> {
  const conditions = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(ads.headline, pattern),
        ilike(ads.description, pattern),
        ilike(ads.ctaText, pattern),
        ilike(ads.ctaUrl, pattern),
        ilike(titles.title, pattern),
      ),
    );
  }
  if (filters.placement) conditions.push(eq(ads.placement, filters.placement));
  if (typeof filters.active === "boolean") conditions.push(eq(ads.active, filters.active));

  const where = conditions.length ? and(...conditions) : undefined;
  const pageSize = filters.pageSize ?? ADMIN_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: ads.id,
        headline: ads.headline,
        description: ads.description,
        placement: ads.placement,
        active: ads.active,
        titleId: ads.titleId,
        titleSlug: titles.slug,
        titleName: titles.title,
        ctaText: ads.ctaText,
        ctaUrl: ads.ctaUrl,
        createdAt: ads.createdAt,
      })
      .from(ads)
      .leftJoin(titles, eq(ads.titleId, titles.id))
      .where(where)
      .orderBy(asc(ads.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(ads)
      .leftJoin(titles, eq(ads.titleId, titles.id))
      .where(where),
  ]);

  return { rows, total: countRows[0].value };
}

export interface AdOption {
  id: string;
  title: string;
}

export async function getTargetTitleOptions(): Promise<AdOption[]> {
  return db
    .select({ id: titles.id, title: titles.title })
    .from(titles)
    .orderBy(asc(titles.title));
}

export interface AdminAdCounts {
  total: number;
  active: number;
  inactive: number;
}

export async function getAdminAdCounts(): Promise<AdminAdCounts> {
  const [[{ value: total }], [{ value: active }]] = await Promise.all([
    db.select({ value: count() }).from(ads),
    db.select({ value: count() }).from(ads).where(eq(ads.active, true)),
  ]);

  return { total, active, inactive: total - active };
}
