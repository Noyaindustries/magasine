import { REGION_SLUGS } from "@/lib/sections";
import { SEED_CATEGORIES } from "@/lib/seed-data";

const regionSlugSet = new Set<string>(REGION_SLUGS);

const regionSeedBySlug = new Map(
  SEED_CATEGORIES.filter((definition) => regionSlugSet.has(definition.slug)).map(
    (definition) => [definition.slug, definition]
  )
);

/** Anciens slugs ou variantes → slug région canonique. */
const REGION_SLUG_ALIASES: Record<string, string> = {
  "amerique-latine": "latin-america",
  "amrique-latine": "latin-america",
  latin_america: "latin-america",
  latinamerica: "latin-america",
  "asie-du-sud": "south-asia",
  "moyen-orient": "west-asia",
  "asia-de-l-oeste": "west-asia",
};

/** Client-safe helper — no database imports. */
export function isRegionCategorySlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  return regionSlugSet.has(slug) || Boolean(REGION_SLUG_ALIASES[slug.toLowerCase()]);
}

export function getCanonicalRegionSlug(
  slug: string | undefined | null,
  name?: string | null
): string | null {
  if (!slug && !name) return null;

  if (slug) {
    if (regionSlugSet.has(slug)) return slug;
    const alias = REGION_SLUG_ALIASES[slug.toLowerCase()];
    if (alias) return alias;
  }

  if (name) {
    const normalizedName = name.trim().toLowerCase();
    for (const regionSlug of REGION_SLUGS) {
      const seed = regionSeedBySlug.get(regionSlug);
      if (seed && seed.name.toLowerCase() === normalizedName) {
        return regionSlug;
      }
    }
  }

  return null;
}

/** Détecte une région (Afrique, Amérique latine, etc.) même si le slug en base est atypique. */
export function isRegionCategoryRecord(category: {
  slug: string;
  name?: string;
}): boolean {
  return getCanonicalRegionSlug(category.slug, category.name) !== null;
}
