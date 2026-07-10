import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";

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

/**
 * Liste les articles publiés d'une rubrique par slug.
 * 1) filtre par ObjectId (rapide)
 * 2) repli par jointure sur le slug des catégories (références obsolètes)
 */
export async function findPublishedArticlesForCategorySlug(
  resolvedSlug: string,
  limit: number,
  findArticleList: ArticleListQuery
): Promise<Record<string, unknown>[]> {
  await connectDB();

  const categoryIds = await Category.distinct("_id", { slug: resolvedSlug });
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

  if (byId.length >= limit) {
    return sortByPublishedAtDesc(byId).slice(0, limit);
  }

  const foundIds = new Set(byId.map((article) => String(article._id)));
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
          { "primaryCat.slug": resolvedSlug },
          { "secondaryCats.slug": resolvedSlug },
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
    .slice(0, Math.max(0, limit - byId.length));

  if (missingIds.length === 0) {
    return sortByPublishedAtDesc(byId).slice(0, limit);
  }

  const extras = (await findArticleList({ _id: { $in: missingIds }, status: "published" }, limit)) as Record<
    string,
    unknown
  >[];

  return sortByPublishedAtDesc([...byId, ...extras]).slice(0, limit);
}
