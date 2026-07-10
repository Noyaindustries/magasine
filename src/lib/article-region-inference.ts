import { connectDB } from "@/lib/mongodb";
import { Author } from "@/models/Author";
import { Category } from "@/models/Category";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";

/** Correspondants régionaux → slug de région (aligné sur le seed). */
export const AUTHOR_DEFAULT_REGION: Record<string, string> = {
  "lucia-mendoza": "latin-america",
  "priya-sharma": "south-asia",
  "omar-al-hassan": "west-asia",
};

export function inferRegionSlugFromAuthor(authorSlug: string | undefined | null): string | null {
  if (!authorSlug) return null;
  return AUTHOR_DEFAULT_REGION[authorSlug] ?? null;
}

export async function inferRegionCategoryIdFromAuthorId(
  authorId: string | undefined | null
): Promise<string | null> {
  if (!authorId) return null;

  await connectDB();
  const author = await Author.findById(authorId).select("slug").lean();
  const regionSlug = inferRegionSlugFromAuthor(author?.slug);
  if (!regionSlug) return null;

  const category = await Category.findOne({ slug: regionSlug, isActive: true }).select("_id").lean();
  return category ? String(category._id) : null;
}

export function articleHasRegionAssignment(
  primarySlug: string | undefined | null,
  secondarySlugs: string[]
): boolean {
  if (primarySlug && isRegionCategorySlug(primarySlug)) return true;
  return secondarySlugs.some((slug) => isRegionCategorySlug(slug));
}
