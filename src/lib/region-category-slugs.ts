import { REGION_SLUGS } from "@/lib/sections";

const regionSlugSet = new Set<string>(REGION_SLUGS);

/** Client-safe helper — no database imports. */
export function isRegionCategorySlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  return regionSlugSet.has(slug);
}
