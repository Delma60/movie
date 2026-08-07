import Link from "next/link";
import { Plus } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getAdminAds, getAdminAdCounts } from "@/lib/admin-ads";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTable, AdminTableCellLink } from "@/components/admin/AdminTable";
import { AdActiveToggle } from "@/components/admin/AdActiveToggle";
import { getAdminPaginationMeta } from "@/lib/admin-query";
import type { AdPlacement } from "@/lib/db/schema";

interface AdminAdsPageProps {
  searchParams: Promise<{
    q?: string;
    placement?: string;
    active?: string;
    created?: string;
    page?: string;
  }>;
}

const VALID_PLACEMENTS: AdPlacement[] = ["homepage", "title_page", "browse"];

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminAdsPage({ searchParams }: AdminAdsPageProps) {
  await requireRole("admin", "/admin");

  const params = await searchParams;
  const q = params.q?.trim() || undefined;
  const placement = VALID_PLACEMENTS.includes(params.placement as AdPlacement)
    ? (params.placement as AdPlacement)
    : undefined;
  const active = params.active === "true" ? true : params.active === "false" ? false : undefined;
  const created = params.created === "1";
  const page = Number.parseInt(params.page ?? "1", 10);

  const [result, counts] = await Promise.all([
    getAdminAds({ q, placement, active, page }),
    getAdminAdCounts(),
  ]);
  const pagination = getAdminPaginationMeta(page, 20, result.total);

  return (
    <main className="admin-page admin-ads-page">
      <div className="admin-page-head">
        <div>
          <h1>Ads</h1>
          <p>
            {counts.total} total · {counts.active} active · {counts.inactive} inactive
          </p>
        </div>
        <Link href="/admin/ads/new" className="admin-btn admin-btn-primary">
          <Plus size={16} strokeWidth={2.25} />
          Add Ad
        </Link>
      </div>

      {created && <div className="admin-form-success">Ad created.</div>}

      <AdminFilterBar
        basePath="/admin/ads"
        resultCount={result.total}
        searchPlaceholder="Search headline, copy, or CTA…"
        filters={[
          {
            key: "placement",
            label: "All placements",
            value: placement ?? "",
            options: [
              { value: "", label: "All placements" },
              { value: "homepage", label: "Homepage" },
              { value: "title_page", label: "Title page" },
              { value: "browse", label: "Browse" },
            ],
          },
          {
            key: "active",
            label: "All statuses",
            value:
              active === true
                ? "true"
                : active === false
                ? "false"
                : "",
            options: [
              { value: "", label: "All statuses" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ],
          },
        ]}
        singularLabel="ad"
        pluralLabel="ads"
      />

      <AdminTable
        columns={["Headline", "Placement", "Target", "CTA", "Active", "Added", ""]}
        rows={result.rows.map((ad) => (
          <tr key={ad.id}>
            <td>
              <span className="admin-table-primary">{ad.headline}</span>
              {ad.description && <span className="admin-table-sub">{ad.description}</span>}
            </td>
            <td className="admin-table-dim">
              {ad.placement === "homepage"
                ? "Homepage"
                : ad.placement === "title_page"
                ? "Title page"
                : "Browse"}
            </td>
            <td className="admin-table-dim">
              {ad.titleId ? (
                <AdminTableCellLink href={`/title/${ad.titleSlug}`} external>
                  {ad.titleName ?? "Target title"}
                </AdminTableCellLink>
              ) : (
                "None"
              )}
            </td>
            <td>
              <span className="admin-table-primary">{ad.ctaText}</span>
              <span className="admin-table-sub">{ad.ctaUrl}</span>
            </td>
            <td>
              <AdActiveToggle id={ad.id} active={ad.active} />
            </td>
            <td className="admin-table-dim">{formatDate(ad.createdAt)}</td>
            <td></td>
          </tr>
        ))}
        emptyMessage="No ads match those filters."
      />

      <AdminPagination
        basePath="/admin/ads"
        meta={pagination}
        searchParams={new URLSearchParams(params as Record<string, string>)}
      />
    </main>
  );
}
