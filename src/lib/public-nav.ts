import {
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

export type SiteNav = {
  primary: PublicNavLink[];
  regions: PublicNavLink[];
  newsMenu: PublicNewsMenuItem[];
};

function categoryHref(slug: string): string {
  return `/category/${slug}`;
}

function bySlugMap(categories: DbNavCategory[]): Map<string, DbNavCategory> {
  return new Map(categories.map((category) => [category.slug, category]));
}

/** Rubriques du menu principal (hors mega-menu News). */
export function buildPrimaryNav(categories: DbNavCategory[]): PublicNavLink[] {
  const map = bySlugMap(categories);

  const fromDb = PRIMARY_NAV.flatMap((item) => {
    const slug = item.href.replace("/category/", "");
    const category = map.get(slug);
    if (!category || isRegionCategorySlug(slug)) return [];
    return [{ label: category.name, href: categoryHref(category.slug) }];
  });

  if (fromDb.length > 0) return fromDb;

  return PRIMARY_NAV.map((item) => ({ label: item.label, href: item.href }));
}

/** Régions du menu — noms et slugs issus de l’admin. */
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

/** Entrées du mega-menu News — libellés des rubriques synchronisés avec l’admin. */
export function buildNewsMenuNav(categories: DbNavCategory[]): PublicNewsMenuItem[] {
  const map = bySlugMap(categories);

  return NEWS_MENU_NAV.map((item) => {
    if (!item.href.startsWith("/category/")) {
      return { ...item };
    }

    const slug = item.href.replace("/category/", "");
    const category = map.get(slug);
    if (!category || isRegionCategorySlug(slug)) {
      return { ...item };
    }

    return {
      label: category.name,
      href: categoryHref(category.slug),
      description: item.description,
    };
  });
}

export function buildSiteNav(categories: DbNavCategory[]): SiteNav {
  return {
    primary: buildPrimaryNav(categories),
    regions: buildRegionNav(categories),
    newsMenu: buildNewsMenuNav(categories),
  };
}

export function resolveRubriqueTitle(
  slug: string,
  fallbackTitle: string,
  categories: DbNavCategory[]
): string {
  return bySlugMap(categories).get(slug)?.name ?? fallbackTitle;
}
