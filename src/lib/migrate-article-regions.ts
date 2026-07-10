import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { REGION_SLUGS } from "@/lib/sections";

let migrationDone = false;

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
