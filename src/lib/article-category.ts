import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { isRetiredCategorySlug } from "@/lib/retired-categories";

export async function resolveActiveCategory(categoryId: string) {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return null;
  }

  await connectDB();
  const category = await Category.findOne({ _id: categoryId, isActive: true }).lean();
  if (!category || isRetiredCategorySlug(category.slug)) {
    return null;
  }

  return category;
}

export async function getCategorySlug(
  categoryId: string | mongoose.Types.ObjectId | undefined | null
): Promise<string | undefined> {
  if (!categoryId) return undefined;

  await connectDB();
  const category = await Category.findById(categoryId).select("slug").lean();
  return category?.slug;
}
