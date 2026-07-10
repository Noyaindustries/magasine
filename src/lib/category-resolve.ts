import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { getCategorySlugAliases, resolveCategorySlug } from "@/lib/category-slugs";

/** IDs de catégories actives ou non, pour tous les slugs alias d'une rubrique. */
export async function findCategoryIdsForCanonicalSlug(slug: string) {
  await connectDB();
  const canonical = resolveCategorySlug(slug);
  const aliases = getCategorySlugAliases(canonical);
  return Category.distinct("_id", { slug: { $in: aliases } });
}

/** Catégorie préférée pour l'affichage public (active + slug canonique en priorité). */
export async function findPreferredCategoryForCanonicalSlug(slug: string) {
  await connectDB();
  const canonical = resolveCategorySlug(slug);
  const aliases = getCategorySlugAliases(canonical);

  const activeCanonical = await Category.findOne({ slug: canonical, isActive: true }).lean();
  if (activeCanonical) return activeCanonical;

  const activeAlias = await Category.findOne({ slug: { $in: aliases }, isActive: true })
    .sort({ slug: 1 })
    .lean();
  if (activeAlias) return activeAlias;

  const anyCanonical = await Category.findOne({ slug: canonical }).lean();
  if (anyCanonical) return anyCanonical;

  return Category.findOne({ slug: { $in: aliases } }).sort({ slug: 1 }).lean();
}
