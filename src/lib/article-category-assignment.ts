import type mongoose from "mongoose";
import {
  mergeRegionCategoryIdsForArticleWithInference,
  resolveRegionCategories,
} from "@/lib/region-categories";
import { normalizeArticleCategoryAssignment } from "@/lib/region-category-resolution";

export async function assignArticleCategories(args: {
  currentPrimaryId: mongoose.Types.ObjectId;
  categoryId?: string;
  regionCategoryIds: string[];
  authorId?: string;
}): Promise<
  | { primaryId: mongoose.Types.ObjectId; secondaryCategoryIds: mongoose.Types.ObjectId[] }
  | { error: string }
> {
  const normalized = await normalizeArticleCategoryAssignment({
    currentPrimaryId: args.currentPrimaryId,
    categoryId: args.categoryId,
    regionCategoryIds: args.regionCategoryIds,
  });

  if ("error" in normalized) {
    return { error: normalized.error };
  }

  const mergedRegionIds = await mergeRegionCategoryIdsForArticleWithInference(
    normalized.primaryId,
    normalized.regionCategoryIds,
    args.authorId
  );

  const regionCategories = await resolveRegionCategories(mergedRegionIds);
  if (regionCategories === null) {
    return { error: "Sélection de région invalide" };
  }

  return {
    primaryId: normalized.primaryId,
    secondaryCategoryIds: regionCategories,
  };
}
