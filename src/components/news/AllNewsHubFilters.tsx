"use client";

import Link from "next/link";
import { useSiteNav } from "@/components/site-chrome/SiteNavContext";
import { newsHubFilterHref, newsMenuCategorySlug } from "@/lib/news-hub";

interface AllNewsHubFiltersProps {
  activeCategory?: string;
}

function filterHref(slug?: string) {
  return slug ? `/news?category=${slug}` : "/news";
}

export function AllNewsHubFilters({ activeCategory }: AllNewsHubFiltersProps) {
  const { newsMenu, regions } = useSiteNav();

  const newsFilters = newsMenu.map((item) => ({
    label: item.label,
    href: newsHubFilterHref(item.href),
    slug: newsMenuCategorySlug(item.href),
  }));

  const regionFilters = regions.map((item) => ({
    label: item.label,
    slug: item.href.replace("/category/", ""),
  }));

  return (
    <div className="all-news-filters search-page-filters">
      <div className="search-page-filter-group">
        <span className="search-page-filter-label">News desks</span>
        <div className="search-page-chips">
          {newsFilters.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`search-page-chip${
                (item.slug && activeCategory === item.slug) ||
                (!activeCategory && item.href === "/news")
                  ? " is-active"
                  : ""
              }`}
              aria-current={
                (item.slug && activeCategory === item.slug) ||
                (!activeCategory && item.href === "/news")
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="search-page-filter-group">
        <span className="search-page-filter-label">Regions</span>
        <div className="search-page-chips">
          {regionFilters.map((item) => (
            <Link
              key={item.slug}
              href={filterHref(item.slug)}
              className={`search-page-chip${activeCategory === item.slug ? " is-active" : ""}`}
              aria-current={activeCategory === item.slug ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useActiveNewsLabel(activeCategory?: string): string | null {
  const { newsMenu, regions } = useSiteNav();

  if (!activeCategory) return null;

  const newsMatch = newsMenu.find((item) => newsMenuCategorySlug(item.href) === activeCategory);
  if (newsMatch) return newsMatch.label;

  const regionMatch = regions.find(
    (item) => item.href.replace("/category/", "") === activeCategory
  );
  return regionMatch?.label ?? null;
}
