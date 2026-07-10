import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { resolveActiveCategory } from "@/lib/article-category";
import { REGION_SLUGS } from "@/lib/sections";
import {
  getCanonicalRegionSlug,
  isRegionCategorySlug,
} from "@/lib/region-category-slugs";

export {
  getCanonicalRegionSlug,
  isRegionCategoryRecord,
  isRegionCategorySlug,
} from "@/lib/region-category-slugs";

export async function resolveCanonicalRegionCategoryId(category: {
  _id: mongoose.Types.ObjectId | string;
  slug: string;
  name?: string;
}): Promise<mongoose.Types.ObjectId | null> {
  const canonicalSlug = getCanonicalRegionSlug(category.slug, category.name);
  if (!canonicalSlug) return null;

  await connectDB();
  const canonical = await Category.findOne({ slug: canonicalSlug }).select("_id").lean();
  return canonical?._id ?? null;
}

export async function canonicalizeRegionCategoryIds(ids: string[]): Promise<string[]> {
  const canonical = new Set<string>();
  await connectDB();

  for (const id of ids) {
    if (!mongoose.Types.ObjectId.isValid(id)) continue;
    const category = await Category.findById(id).select("_id slug name").lean();
    if (!category) continue;

    const canonicalId = await resolveCanonicalRegionCategoryId(category);
    if (canonicalId) {
      canonical.add(String(canonicalId));
      continue;
    }

    if (isRegionCategorySlug(category.slug)) {
      canonical.add(String(category._id));
    }
  }

  return [...canonical];
}

async function defaultTopicCategoryId(): Promise<mongoose.Types.ObjectId | null> {
  await connectDB();
  const news = await Category.findOne({ slug: "news", isActive: true }).select("_id").lean();
  if (news) return news._id;

  const fallback = await Category.findOne({
    slug: { $nin: [...REGION_SLUGS] },
    isActive: true,
  })
    .sort({ order: 1 })
    .select("_id")
    .lean();

  return fallback?._id ?? null;
}

/**
 * Sépare rubrique thématique et régions.
 * Si l'utilisateur choisit une région dans le menu « Rubrique », elle est basculée
 * vers secondaryCategories (page /category/latin-america, etc.).
 */
export async function normalizeArticleCategoryAssignment(args: {
  currentPrimaryId: mongoose.Types.ObjectId;
  categoryId?: string;
  regionCategoryIds: string[];
}): Promise<
  | { primaryId: mongoose.Types.ObjectId; regionCategoryIds: string[] }
  | { error: string }
> {
  await connectDB();

  let regionIds = await canonicalizeRegionCategoryIds(args.regionCategoryIds);
  let primaryId = args.currentPrimaryId;

  if (args.categoryId) {
    const category = await resolveActiveCategory(args.categoryId);
    if (!category) {
      return { error: "Rubrique invalide ou inactive" };
    }

    const regionObjectId = await resolveCanonicalRegionCategoryId(category);
    if (regionObjectId) {
      regionIds = [...new Set([...regionIds, String(regionObjectId)])];
      const topicId = await defaultTopicCategoryId();
      if (!topicId) {
        return {
          error:
            "Rubrique thématique introuvable. Créez « News » dans Admin → Catégories, puis réessayez.",
        };
      }
      primaryId = topicId;
    } else {
      primaryId = category._id;
    }
  }

  const primaryDoc = await Category.findById(primaryId).select("_id slug name").lean();
  if (primaryDoc) {
    const regionObjectId = await resolveCanonicalRegionCategoryId(primaryDoc);
    if (regionObjectId) {
      regionIds = [...new Set([...regionIds, String(regionObjectId)])];
      const topicId = await defaultTopicCategoryId();
      if (topicId) primaryId = topicId;
    }
  }

  return { primaryId, regionCategoryIds: regionIds };
}
