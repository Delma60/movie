export const ADMIN_PAGE_SIZE = 20;

export interface AdminPaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function buildAdminPageHref(
  basePath: string,
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  page: number,
) {
  const params = new URLSearchParams(searchParams.toString());
  if (page > 1) params.set("page", String(page));
  else params.delete("page");

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function getAdminPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): AdminPaginationMeta {
  const safePage = Math.max(1, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Math.min(safePage, totalPages);

  return {
    page: normalizedPage,
    pageSize,
    total,
    totalPages,
    hasPrev: normalizedPage > 1,
    hasNext: normalizedPage < totalPages,
  };
}
