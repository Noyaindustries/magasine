export const ARTICLES_PAGE_SIZE = 20;
export const USERS_PAGE_SIZE = 25;
export const NEWSLETTER_PAGE_SIZE = 25;

export type PaginationItem = number | "ellipsis";

/** Page numbers to display (with "…" when needed). */
export function getPaginationItems(current: number, total: number): PaginationItem[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < total - 1) items.push("ellipsis");
  items.push(total);

  return items;
}

export function buildPageHref(baseHref: string, page: number): string {
  if (page <= 1) return baseHref;
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}page=${page}`;
}

export function paginationRangeLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) return "0 articles";
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `${from}–${to} of ${total.toLocaleString("en-US")}`;
}

export function userPaginationRangeLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) return "0 users";
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `${from}–${to} of ${total.toLocaleString("en-US")} users`;
}
