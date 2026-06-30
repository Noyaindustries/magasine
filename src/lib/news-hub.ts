import { NEWS_MENU_NAV } from "@/data/site-home";
import type { ArticleListItem } from "@/types";

export const NEWS_HUB_CATEGORY_SLUGS = new Set([
  "news",
  "investigations",
  "special-reports",
  "politics",
  "feature",
]);

export function isNewsHubCategory(slug: string): boolean {
  return NEWS_HUB_CATEGORY_SLUGS.has(slug);
}

export function newsMenuCategorySlug(href: string): string | null {
  if (href.startsWith("/category/")) {
    return href.replace("/category/", "").split("?")[0] ?? null;
  }
  return null;
}

/** Filter URL on the /news hub (breaking stays on /urgent). */
export function newsHubFilterHref(href: string): string {
  if (href === "/news" || href === "/urgent") return href;
  const slug = newsMenuCategorySlug(href);
  return slug ? `/news?category=${slug}` : href;
}

export function countArticlesForNewsMenuItem(
  href: string,
  articles: ArticleListItem[],
  urgentCount: number
): number {
  if (href === "/news") return articles.length;
  if (href === "/urgent") return urgentCount;
  const slug = newsMenuCategorySlug(href);
  if (!slug) return 0;
  return articles.filter((a) => a.category.slug === slug).length;
}

export function buildNewsHubSectionCounts(
  articles: ArticleListItem[],
  urgentCount: number
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of NEWS_MENU_NAV) {
    counts[item.href] = countArticlesForNewsMenuItem(item.href, articles, urgentCount);
  }
  return counts;
}

export function isNewsMenuItemActive(
  pathname: string,
  categoryParam: string | null | undefined,
  href: string
): boolean {
  if (href === "/news") {
    return pathname === "/news" && !categoryParam;
  }
  if (href === "/urgent") {
    return pathname === "/urgent" || pathname.startsWith("/urgent/");
  }
  const slug = newsMenuCategorySlug(href);
  if (slug) {
    if (pathname === `/category/${slug}` || pathname.startsWith(`/category/${slug}/`)) {
      return true;
    }
    if (pathname === "/news" && categoryParam === slug) {
      return true;
    }
  }
  return false;
}

export function newsHubActiveHref(categorySlug?: string): string | undefined {
  if (!categorySlug) return "/news";
  const match = NEWS_MENU_NAV.find((item) => newsMenuCategorySlug(item.href) === categorySlug);
  return match?.href;
}
