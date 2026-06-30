/** Canonical English category URL slugs. */
export const CATEGORY_SLUG = {
  news: "news",
  politics: "politics",
  culture: "culture",
  commentary: "commentary",
  explainer: "explainer",
  health: "health",
  feature: "feature",
  investigations: "investigations",
  opinion: "commentary",
  local: "local",
  specialReports: "special-reports",
  africa: "africa",
  latinAmerica: "latin-america",
  southAsia: "south-asia",
  westAsia: "west-asia",
} as const;

/** Legacy French slugs → English (for redirects and DB migration). */
export const LEGACY_CATEGORY_SLUG_MAP: Record<string, string> = {
  actualites: CATEGORY_SLUG.news,
  politique: CATEGORY_SLUG.politics,
  technologie: CATEGORY_SLUG.news,
  technology: CATEGORY_SLUG.news,
  sante: CATEGORY_SLUG.health,
  monde: CATEGORY_SLUG.feature,
  world: CATEGORY_SLUG.feature,
  "reportages-speciaux": CATEGORY_SLUG.specialReports,
  opinion: CATEGORY_SLUG.commentary,
  multimedia: CATEGORY_SLUG.feature,
};

export function resolveCategorySlug(slug: string): string {
  return LEGACY_CATEGORY_SLUG_MAP[slug] ?? slug;
}
