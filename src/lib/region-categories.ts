import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { isRetiredCategorySlug } from "@/lib/retired-categories";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";

export { isRegionCategorySlug } from "@/lib/region-category-slugs";

export async function resolveRegionCategories(regionCategoryIds: string[]) {
  const uniqueIds = [...new Set(regionCategoryIds.filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const invalidId = uniqueIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidId) return null;

  await connectDB();
  const categories = await Category.find({
    _id: { $in: uniqueIds },
    isActive: true,
  })
    .select("_id slug")
    .lean();

  if (categories.length !== uniqueIds.length) return null;

  const hasNonRegion = categories.some((category) => !isRegionCategorySlug(category.slug));
  if (hasNonRegion) return null;

  const retired = categories.some((category) => isRetiredCategorySlug(category.slug));
  if (retired) return null;

  return categories.map((category) => category._id);
}

/** Inclut la région principale (ancien modèle) dans les catégories secondaires. */
export async function mergeRegionCategoryIdsForArticle(
  primaryCategoryId: string | mongoose.Types.ObjectId | undefined | null,
  regionCategoryIds: string[]
): Promise<string[]> {
  const merged = new Set(regionCategoryIds.filter(Boolean).map(String));

  if (primaryCategoryId && mongoose.Types.ObjectId.isValid(String(primaryCategoryId))) {
    await connectDB();
    const primary = await Category.findById(primaryCategoryId).select("_id slug").lean();
    if (primary && isRegionCategorySlug(primary.slug)) {
      merged.add(String(primary._id));
    }
  }

  return [...merged];
}

export async function getRegionSlugsForArticle(
  secondaryCategoryIds: mongoose.Types.ObjectId[] | undefined | null
): Promise<string[]> {
  if (!secondaryCategoryIds?.length) return [];

  await connectDB();
  const categories = await Category.find({ _id: { $in: secondaryCategoryIds } })
    .select("slug")
    .lean();

  return categories
    .map((category) => category.slug)
    .filter((slug) => isRegionCategorySlug(slug));
}

export async function getAllRegionSlugsForArticle(article: {
  category: mongoose.Types.ObjectId;
  secondaryCategories?: mongoose.Types.ObjectId[];
}): Promise<string[]> {
  await connectDB();
  const categoryIds = [article.category, ...(article.secondaryCategories ?? [])];
  const categories = await Category.find({ _id: { $in: categoryIds } }).select("slug").lean();

  return [...new Set(
    categories
      .map((category) => category.slug)
      .filter((slug) => isRegionCategorySlug(slug))
  )];
}
