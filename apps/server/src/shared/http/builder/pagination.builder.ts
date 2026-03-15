import { PaginationOptions } from "../pagination";

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationOptions {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    total,
    totalPages,
  };
}
