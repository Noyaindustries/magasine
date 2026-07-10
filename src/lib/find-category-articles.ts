import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Author } from "@/models/Author";
import { Category } from "@/models/Category";
import { authorSlugsForRegionSlug } from "@/lib/article-region-inference";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";
import { REGION_SLUGS } from "@/lib/sections";
import { findCategoryIdsForCanonicalSlug } from "@/lib/category-resolve";
import { getCategorySlugAliases, resolveCategorySlug } from "@/lib/category-slugs";

type ArticleListQuery = (
  filter: Record<string, unknown>,
  limit: number
) => Promise<Record<string, unknown>[]>;

function sortByPublishedAtDesc(
  articles: Record<string, unknown>[]
): Record<string, unknown>[] {
  return [...articles].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt as string | Date).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt as string | Date).getTime() : 0;
    return tb - ta;
  });
}

function toObjectIdSet(ids: Iterable<string>): mongoose.Types.ObjectId[] {
  return [...ids]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
}

async function findArticlesByRegionalAuthors(
  resolvedSlug: string,
  limit: number,
  excludeIds: Set<string>,
  findArticleList: ArticleListQuery
): Promise<Record<string, unknown>[]> {
  if (!isRegionCategorySlug(resolvedSlug) || limit <= 0) return [];

  const authorSlugs = authorSlugsForRegionSlug(resolvedSlug);
  if (authorSlugs.length === 0) return [];

  const authorIds = await Author.distinct("_id", { slug: { $in: authorSlugs } });
  if (authorIds.length === 0) return [];

  const allRegionIds = await Category.distinct("_id", { slug: { $in: [...REGION_SLUGS] } });
  const excludeObjectIds = toObjectIdSet(excludeIds);

  return findArticleList(
    {
      status: "published",
      authors: { $in: authorIds },
      ...(allRegionIds.length > 0 ? { category: { $nin: allRegionIds } } : {}),
      ...(excludeObjectIds.length > 0 ? { _id: { $nin: excludeObjectIds } } : {}),
    },
    limit
  );
}

/**
 * Liste les articles publiés d'une rubrique par slug.
 * 1) filtre par ObjectId (rapide)
 * 2) repli par jointure sur le slug des catégories (références obsolètes)
 * 3) repli par correspondant régional (auteur → région)
 */
export async function findPublishedArticlesForCategorySlug(
  resolvedSlug: string,
  limit: number,
  findArticleList: ArticleListQuery
): Promise<Record<string, unknown>[]> {
  await connectDB();

  const canonicalSlug = resolveCategorySlug(resolvedSlug);
  const slugAliases = getCategorySlugAliases(canonicalSlug);
  const categoryIds = await findCategoryIdsForCanonicalSlug(canonicalSlug);
  if (categoryIds.length === 0) return [];

  const byId = await findArticleList(
    {
      status: "published",
      $or: [
        { category: { $in: categoryIds } },
        { secondaryCategories: { $in: categoryIds } },
      ],
    },
    limit
  );

  let results = sortByPublishedAtDesc(byId);
  const foundIds = new Set(results.map((article) => String(article._id)));

  if (results.length >= limit) {
    return results.slice(0, limit);
  }

  const slugMatchIds = await Article.aggregate<{ _id: mongoose.Types.ObjectId }>([
    { $match: { status: "published" } },
    {
      $lookup: {
        from: Category.collection.name,
        localField: "category",
        foreignField: "_id",
        as: "primaryCat",
      },
    },
    {
      $lookup: {
        from: Category.collection.name,
        localField: "secondaryCategories",
        foreignField: "_id",
        as: "secondaryCats",
      },
    },
    {
      $match: {
        $or: [
          { "primaryCat.slug": { $in: slugAliases } },
          { "secondaryCats.slug": { $in: slugAliases } },
        ],
      },
    },
    { $sort: { publishedAt: -1 } },
    { $limit: limit * 2 },
    { $project: { _id: 1 } },
  ]);

  const missingIds = slugMatchIds
    .map((row) => row._id)
    .filter((id) => !foundIds.has(String(id)))
    .slice(0, Math.max(0, limit - results.length));

  if (missingIds.length > 0) {
    const extras = (await findArticleList(
      { _id: { $in: missingIds }, status: "published" },
      limit
    )) as Record<string, unknown>[];

    for (const article of extras) {
      foundIds.add(String(article._id));
    }
    results = sortByPublishedAtDesc([...results, ...extras]);
  }

  if (results.length < limit) {
    const byAuthor = await findArticlesByRegionalAuthors(
      canonicalSlug,
      limit - results.length,
      foundIds,
      findArticleList
    );
    results = sortByPublishedAtDesc([...results, ...byAuthor]);
  }

  return results.slice(0, limit);
}
