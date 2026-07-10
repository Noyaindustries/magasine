import {
  ALL_NEWS_LINK,
  FOOTER_FORMAT_LINKS,
  NEWS_MENU_NAV,
  PRIMARY_NAV,
  REGION_NAV,
} from "@/data/site-home";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";
import { REGION_SLUGS } from "@/lib/sections";

export type PublicNavLink = {
  label: string;
  href: string;
  description?: string;
  accent?: string;
};

export type PublicNewsMenuItem = {
  label: string;
  href: string;
  description: string;
  accent?: string;
};

export type DbNavCategory = { name: string; slug: string };

export type SiteNavFilter = { label: string; slug: string };

export type SiteNav = {
  primary: PublicNavLink[];
  regions: PublicNavLink[];
  newsMenu: PublicNewsMenuItem[];
  footerSections: PublicNavLink[];
  footerRegions: PublicNavLink[];
  footerFormats: PublicNavLink[];
  searchFilters: SiteNavFilter[];
  topicCategories: DbNavCategory[];
  homeRubriqueSlugs: string[];
};

/** Ordre des blocs rubriques sur la page d'accueil (slugs canoniques). */
export const HOME_RUBRIQUE_SLUG_ORDER = [
  ...REGION_SLUGS,
  "news",
  "commentary",
  "explainer",
  "politics",
  "feature",
  "culture",
  "investigations",
  "special-reports",
  "health",
  "local",
  "opinion",
] as const;

function categoryHref(slug: string): string {
  return `/category/${slug}`;
}

function bySlugMap(categories: DbNavCategory[]): Map<string, DbNavCategory> {
  return new Map(categories.map((category) => [category.slug, category]));
}

function topicCategoriesFromDb(categories: DbNavCategory[]): DbNavCategory[] {
  return categories.filter((category) => !isRegionCategorySlug(category.slug));
}

/** Toutes les rubriques thématiques actives (admin), ordre menu puis alphabétique. */
export function buildTopicCategories(categories: DbNavCategory[]): DbNavCategory[] {
  const map = bySlugMap(categories);
  const primarySlugs = PRIMARY_NAV.map((item) => item.href.replace("/category/", ""));
  const ordered: DbNavCategory[] = [];

  for (const slug of primarySlugs) {
    const category = map.get(slug);
    if (category && !isRegionCategorySlug(slug)) {
      ordered.push(category);
    }
  }

  const seen = new Set(ordered.map((category) => category.slug));
  const extras = topicCategoriesFromDb(categories)
    .filter((category) => !seen.has(category.slug))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...ordered, ...extras];
}

export function buildPrimaryNav(categories: DbNavCategory[]): PublicNavLink[] {
  return buildTopicCategories(categories)
    .filter((category) => PRIMARY_NAV.some((item) => item.href === categoryHref(category.slug)))
    .map((category) => ({
      label: category.name,
      href: categoryHref(category.slug),
    }));
}

export function buildRegionNav(categories: DbNavCategory[]): PublicNavLink[] {
  const map = bySlugMap(categories);
  const staticByHref = new Map<string, (typeof REGION_NAV)[number]>(
    REGION_NAV.map((region) => [region.href, region])
  );

  const fromDb = REGION_SLUGS.flatMap((slug) => {
    const category = map.get(slug);
    if (!category) return [];
    const href = categoryHref(slug);
    const staticMeta = staticByHref.get(href);
    return [
      {
        label: category.name,
        href,
        description: staticMeta?.description,
        accent: staticMeta?.accent,
      },
    ];
  });

  if (fromDb.length > 0) return fromDb;

  return REGION_NAV.map((region) => ({
    label: region.label,
    href: region.href,
    description: region.description,
    accent: region.accent,
  }));
}

export function buildNewsMenuNav(categories: DbNavCategory[]): PublicNewsMenuItem[] {
  const map = bySlugMap(categories);

  return NEWS_MENU_NAV.flatMap((item) => {
    if (!item.href.startsWith("/category/")) {
      return [{ ...item }];
    }

    const slug = item.href.replace("/category/", "");
    const category = map.get(slug);
    if (!category || isRegionCategorySlug(slug)) {
      return [];
    }

    return [
      {
        label: category.name,
        href: categoryHref(category.slug),
        description: item.description,
      },
    ];
  });
}

export function buildFooterSectionLinks(categories: DbNavCategory[]): PublicNavLink[] {
  const topics = buildTopicCategories(categories).map((category) => ({
    label: category.name,
    href: categoryHref(category.slug),
  }));

  return [{ label: ALL_NEWS_LINK.label, href: ALL_NEWS_LINK.href }, ...topics];
}

export function buildFooterFormatLinks(categories: DbNavCategory[]): PublicNavLink[] {
  const map = bySlugMap(categories);

  return FOOTER_FORMAT_LINKS.map((link) => {
    if (!link.href.startsWith("/category/")) {
      return { label: link.label, href: link.href };
    }
    const slug = link.href.replace("/category/", "");
    const category = map.get(slug);
    return {
      label: category?.name ?? link.label,
      href: category ? categoryHref(category.slug) : link.href,
    };
  });
}

export function buildSearchCategoryFilters(categories: DbNavCategory[]): SiteNavFilter[] {
  const topics = buildTopicCategories(categories).map((category) => ({
    label: category.name,
    slug: category.slug,
  }));
  const regions = buildRegionNav(categories).map((region) => ({
    label: region.label,
    slug: region.href.replace("/category/", ""),
  }));

  return [...topics, ...regions];
}

export function buildHomeRubriqueSlugs(categories: DbNavCategory[]): string[] {
  const map = bySlugMap(categories);
  return HOME_RUBRIQUE_SLUG_ORDER.filter((slug) => map.has(slug));
}

export function buildSiteNav(categories: DbNavCategory[]): SiteNav {
  const regions = buildRegionNav(categories);
  const topicCategories = buildTopicCategories(categories);

  return {
    primary: buildPrimaryNav(categories),
    regions,
    newsMenu: buildNewsMenuNav(categories),
    footerSections: buildFooterSectionLinks(categories),
    footerRegions: regions.map(({ label, href }) => ({ label, href })),
    footerFormats: buildFooterFormatLinks(categories),
    searchFilters: buildSearchCategoryFilters(categories),
    topicCategories,
    homeRubriqueSlugs: buildHomeRubriqueSlugs(categories),
  };
}

export function resolveRubriqueTitle(
  slug: string,
  fallbackTitle: string,
  categories: DbNavCategory[]
): string {
  return bySlugMap(categories).get(slug)?.name ?? fallbackTitle;
}
