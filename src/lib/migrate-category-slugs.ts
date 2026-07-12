import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { LEGACY_CATEGORY_SLUG_MAP } from "@/lib/category-slugs";
import { syncSeedCategories } from "@/lib/seed-import";

let migrationDone = false;

/** Renames legacy category slugs in MongoDB and merges duplicates (idempotent). */
export async function migrateCategorySlugs(): Promise<number> {
  await connectDB();
  let updated = 0;

  for (const [legacySlug, newSlug] of Object.entries(LEGACY_CATEGORY_SLUG_MAP)) {
    if (legacySlug === "world" || legacySlug === "monde") continue;

    const legacy = await Category.findOne({ slug: legacySlug });
    if (!legacy) continue;

    const target = await Category.findOne({ slug: newSlug });
    if (target && String(target._id) !== String(legacy._id)) {
      await Article.updateMany(
        { category: legacy._id },
        { $set: { category: target._id } }
      );
      legacy.isActive = false;
      await legacy.save();
      updated += 1;
      continue;
    }

    legacy.slug = newSlug;
    await legacy.save();
    updated += 1;
  }

  updated += await syncSeedCategories();

  return updated;
}

export async function migrateCategorySlugsOnce(): Promise<void> {
  if (migrationDone) return;
  migrationDone = true;

  try {
    await migrateCategorySlugs();
  } catch {
    migrationDone = false;
  }
}
