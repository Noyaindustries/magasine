/** Editorial sections removed from homepage navigation and admin pickers. */
export const RETIRED_CATEGORY_SLUGS = [
  "finance",
  "sports",
  "sport",
  "divertissement",
  "autres",
  "technology",
  "technologie",
  "multimedia",
] as const;

export type RetiredCategorySlug = (typeof RETIRED_CATEGORY_SLUGS)[number];

const retiredSet = new Set<string>(RETIRED_CATEGORY_SLUGS);

const RETIRED_CATEGORY_NAME =
  /^(finance|sports?|divertissement|autres|entertainment|technology|technologie|multimedia)$/i;

export function isRetiredCategorySlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  return retiredSet.has(slug.toLowerCase());
}

export function isRetiredCategoryName(name: string | undefined | null): boolean {
  if (!name) return false;
  const normalized = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
  return RETIRED_CATEGORY_NAME.test(normalized);
}

export function isRetiredCategoryArticle(article: {
  category: { slug: string; name?: string };
}): boolean {
  return (
    isRetiredCategorySlug(article.category.slug) ||
    isRetiredCategoryName(article.category.name)
  );
}

export function filterRetiredCategories<T extends { slug: string }>(items: T[]): T[] {
  return items.filter((item) => !isRetiredCategorySlug(item.slug));
}

export function filterArticlesByRetiredCategories<T extends { category: { slug: string; name?: string } }>(
  items: T[]
): T[] {
  return items.filter((item) => !isRetiredCategoryArticle(item));
}
