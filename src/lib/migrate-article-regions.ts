import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { REGION_SLUGS } from "@/lib/sections";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";
import { revalidateCategoryPage } from "@/lib/revalidate-public";

let migrationDone = false;

/**
 * Répare les références de catégorie (inactive / obsolète) et synchronise les régions.
 */
export async function repairPublishedArticleCategoryReferences(): Promise<number> {
  await connectDB();
  let updated = 0;

  const activeCategories = await Category.find({ isActive: true }).select("_id slug").lean();
  const canonicalBySlug = new Map(activeCategories.map((category) => [category.slug, category._id]));

  const articles = await Article.find({ status: "published" })
    .select("category secondaryCategories")
    .lean();

  for (const article of articles) {
    const patch: {
      category?: mongoose.Types.ObjectId;
      secondaryCategories?: mongoose.Types.ObjectId[];
    } = {};

    let primary = await Category.findById(article.category).select("_id slug isActive").lean();
    if (!primary?.isActive && primary && canonicalBySlug.has(primary.slug)) {
      patch.category = canonicalBySlug.get(primary.slug)!;
      primary = await Category.findById(patch.category).select("_id slug isActive").lean();
    }

    const secondary = [...(article.secondaryCategories ?? [])];
    let secondaryChanged = false;

    const effectivePrimary = primary ?? (patch.category ? await Category.findById(patch.category).lean() : null);
    if (effectivePrimary && isRegionCategorySlug(effectivePrimary.slug)) {
      const regionId = canonicalBySlug.get(effectivePrimary.slug);
      if (regionId && !secondary.some((id) => String(id) === String(regionId))) {
        secondary.push(regionId);
        secondaryChanged = true;
      }
    }

    if (patch.category) {
      await Article.updateOne({ _id: article._id }, { $set: { ...patch, ...(secondaryChanged ? { secondaryCategories: secondary } : {}) } });
      updated += 1;
      continue;
    }

    if (secondaryChanged) {
      patch.secondaryCategories = secondary;
      await Article.updateOne({ _id: article._id }, { $set: patch });
      updated += 1;
    }
  }

  return updated;
}

/**
 * Copie la région principale vers secondaryCategories pour les articles publiés
 * encore classés avec l'ancien modèle (catégorie = Afrique, West Asia, etc.).
 */
export async function migrateArticleRegionLinks(): Promise<number> {
  await connectDB();
  let updated = 0;

  const regionCategories = await Category.find({
    slug: { $in: [...REGION_SLUGS] },
    isActive: true,
  })
    .select("_id slug")
    .lean();

  for (const region of regionCategories) {
    const result = await Article.updateMany(
      {
        status: "published",
        category: region._id,
        secondaryCategories: { $ne: region._id },
      },
      { $addToSet: { secondaryCategories: region._id } }
    );
    updated += result.modifiedCount;
  }

  updated += await repairPublishedArticleCategoryReferences();

  for (const slug of REGION_SLUGS) {
    revalidateCategoryPage(slug);
  }

  return updated;
}

export async function migrateArticleRegionLinksOnce(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    await migrateArticleRegionLinks();
  } catch {
    migrationDone = false;
  }
}
