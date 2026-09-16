import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Author } from "@/models/Author";
import { Category } from "@/models/Category";
import { REGION_SLUGS } from "@/lib/sections";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";
import {
  articleHasRegionAssignment,
  inferRegionSlugFromAuthor,
} from "@/lib/article-region-inference";
import { SEED_CATEGORIES } from "@/lib/seed-data";
import { revalidateCategoryPage } from "@/lib/revalidate-public";

let migrationDone = false;
let africaCleanupDone = false;
let authorRegionRepairDone = false;

async function upsertSeedCategory(definition: (typeof SEED_CATEGORIES)[number]): Promise<boolean> {
  const existing = await Category.findOne({ slug: definition.slug });
  if (!existing) {
    await Category.create({ ...definition, isActive: true });
    return true;
  }

  let changed = false;
  if (!existing.isActive) {
    existing.isActive = true;
    changed = true;
  }
  if (existing.name !== definition.name) {
    existing.name = definition.name;
    changed = true;
  }
  if (existing.color !== definition.color) {
    existing.color = definition.color;
    changed = true;
  }
  if (existing.description !== definition.description) {
    existing.description = definition.description;
    changed = true;
  }
  if (existing.order !== definition.order) {
    existing.order = definition.order;
    changed = true;
  }
  if (changed) {
    await existing.save();
    return true;
  }

  return false;
}

/** Cr├®e ou r├®active les rubriques th├®matiques (News, Politique, etc.) si elles manquent. */
export async function ensureTopicCategoriesExist(): Promise<number> {
  await connectDB();
  let updated = 0;

  for (const definition of SEED_CATEGORIES) {
    if (isRegionCategorySlug(definition.slug)) continue;
    if (await upsertSeedCategory(definition)) updated += 1;
  }

  return updated;
}

/** Cr├®e ou r├®active les 4 cat├®gories r├®gion si elles manquent en base. */
export async function ensureRegionCategoriesExist(): Promise<number> {
  await connectDB();
  let updated = 0;

  for (const definition of SEED_CATEGORIES) {
    if (!isRegionCategorySlug(definition.slug)) continue;
    if (await upsertSeedCategory(definition)) updated += 1;
  }

  return updated;
}

const seedCategoryBySlug = new Map(SEED_CATEGORIES.map((definition) => [definition.slug, definition]));

/** Cr├®e ou r├®active une cat├®gorie connue (seed) par slug ÔÇö ex. culture, explainer. */
export async function ensureCategoryExistsBySlug(slug: string): Promise<boolean> {
  const definition = seedCategoryBySlug.get(slug);
  if (!definition) return false;
  await connectDB();
  await upsertSeedCategory(definition);
  return true;
}

async function ensureRegionCategoriesActive(): Promise<number> {
  const result = await Category.updateMany(
    { slug: { $in: [...REGION_SLUGS] } },
    { $set: { isActive: true } }
  );
  return result.modifiedCount;
}

/**
 * R├®pare les r├®f├®rences de cat├®gorie (inactive / obsol├¿te) et synchronise les r├®gions.
 */
export async function repairPublishedArticleCategoryReferences(): Promise<number> {
  await connectDB();
  let updated = 0;

  const activeCategories = await Category.find({ isActive: true }).select("_id slug").lean();
  const canonicalBySlug = new Map(activeCategories.map((category) => [category.slug, category._id]));

  const articles = await Article.find({ status: "published" })
    .select("category secondaryCategories authors")
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

    const effectivePrimary =
      primary ?? (patch.category ? await Category.findById(patch.category).lean() : null);

    const secondarySlugs = (
      await Category.find({ _id: { $in: secondary } })
        .select("slug")
        .lean()
    ).map((category) => category.slug);

    if (
      effectivePrimary &&
      !articleHasRegionAssignment(effectivePrimary.slug, secondarySlugs)
    ) {
      const authorId = article.authors?.[0];
      const author = authorId ? await Author.findById(authorId).select("slug").lean() : null;
      const inferredSlug = inferRegionSlugFromAuthor(author?.slug);
      if (inferredSlug) {
        const regionId = canonicalBySlug.get(inferredSlug);
        if (regionId && !secondary.some((id) => String(id) === String(regionId))) {
          secondary.push(regionId);
          secondaryChanged = true;
        }
      }
    }

    if (effectivePrimary && isRegionCategorySlug(effectivePrimary.slug)) {
      const regionId = canonicalBySlug.get(effectivePrimary.slug);
      if (regionId && !secondary.some((id) => String(id) === String(regionId))) {
        secondary.push(regionId);
        secondaryChanged = true;
      }
    }

    if (patch.category) {
      await Article.updateOne(
        { _id: article._id },
        { $set: { ...patch, ...(secondaryChanged ? { secondaryCategories: secondary } : {}) } }
      );
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
 * Ancienne migration one-shot : retirait Africa des secondaryCategories quand
 * c'était la seule région. Ne plus l'exécuter — elle effaçait aussi les choix
 * manuels (rubrique thématique + région Africa cochée dans l'éditeur).
 */
export async function removeAutoAssignedAfricaRegions(): Promise<number> {
  return 0;
}

/**
 * Copie la r├®gion principale vers secondaryCategories pour les articles publi├®s
 * encore class├®s avec l'ancien mod├¿le (cat├®gorie = Afrique, West Asia, etc.).
 */
export async function migrateArticleRegionLinks(): Promise<number> {
  await connectDB();
  let updated = 0;

  updated += await ensureTopicCategoriesExist();
  updated += await ensureRegionCategoriesExist();
  updated += await ensureRegionCategoriesActive();

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

export async function removeAutoAssignedAfricaRegionsOnce(): Promise<void> {
  if (africaCleanupDone) return;
  africaCleanupDone = true;

  try {
    await removeAutoAssignedAfricaRegions();
  } catch {
    africaCleanupDone = false;
  }
}

/** R├®-attribue les r├®gions aux correspondants r├®gionaux (sans d├®faut Africa). */
export async function repairAuthorRegionLinksOnce(): Promise<void> {
  if (authorRegionRepairDone) return;
  authorRegionRepairDone = true;

  try {
    await ensureRegionCategoriesExist();
    const updated = await repairPublishedArticleCategoryReferences();
    if (updated > 0) {
      for (const slug of REGION_SLUGS) {
        revalidateCategoryPage(slug);
      }
    }
  } catch {
    authorRegionRepairDone = false;
  }
}
