import type { ArticleListItem } from "@/types";
import { resolveCategorySlug } from "@/lib/category-slugs";

type CategoryMatchable = {
  category: ArticleListItem["category"];
  regions?: ArticleListItem["regions"];
};

/** Article rattaché à une catégorie (rubrique principale ou région secondaire). */
export function articleMatchesCategorySlug(
  article: CategoryMatchable,
  categorySlug: string
): boolean {
  const resolved = resolveCategorySlug(categorySlug);
  if (article.category.slug === resolved) return true;
  return article.regions?.some((region) => region.slug === resolved) ?? false;
}

export function filterArticlesByCategorySlug<T extends CategoryMatchable>(
  articles: T[],
  categorySlug: string
): T[] {
  return articles.filter((article) => articleMatchesCategorySlug(article, categorySlug));
}

/** Filtre MongoDB : rubrique principale OU catégorie secondaire (région, etc.). */
export function mongoCategoryMatchFilter(
  categoryId: unknown
): Record<string, unknown> {
  return {
    $or: [{ category: categoryId }, { secondaryCategories: categoryId }],
  };
}
