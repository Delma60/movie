import Link from "next/link";
import {
  buildAdminPageHref,
  type AdminPaginationMeta,
} from "@/lib/admin-query";

interface AdminPaginationProps {
  basePath: string;
  meta: AdminPaginationMeta;
  searchParams: URLSearchParams | { toString(): string };
}

export function AdminPagination({
  basePath,
  meta,
  searchParams,
}: AdminPaginationProps) {
  if (meta.totalPages <= 1) return null;

  const pages = Array.from(
    { length: meta.totalPages },
    (_, index) => index + 1,
  );

  return (
    <div className="admin-pagination">
      <Link
        href={buildAdminPageHref(basePath, searchParams, meta.page - 1)}
        className="admin-pagination-btn"
        aria-disabled={!meta.hasPrev}
        tabIndex={!meta.hasPrev ? -1 : undefined}
      >
        Previous
      </Link>

      {pages.map((page) => {
        const href = buildAdminPageHref(basePath, searchParams, page);
        const isCurrent = page === meta.page;

        return (
          <Link
            key={page}
            href={href}
            className={`admin-pagination-btn ${isCurrent ? "is-active" : ""}`.trim()}
          >
            {page}
          </Link>
        );
      })}

      <Link
        href={buildAdminPageHref(basePath, searchParams, meta.page + 1)}
        className="admin-pagination-btn"
        aria-disabled={!meta.hasNext}
        tabIndex={!meta.hasNext ? -1 : undefined}
      >
        Next
      </Link>
    </div>
  );
}
