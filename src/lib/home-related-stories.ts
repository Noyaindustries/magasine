import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

export async function syncHomeRelatedArticles(
  ids: mongoose.Types.ObjectId[]
): Promise<void> {
  await connectDB();
  await SiteSettings.collection.updateOne(
    {},
    { $set: { homeRelatedArticles: ids, updatedAt: new Date() } }
  );
}

/** Fallback when homepage curation is empty: related stories from a featured hero article. */
export async function getFeaturedHeroRelatedArticleIds(): Promise<mongoose.Types.ObjectId[]> {
  const { Article } = await import("@/models/Article");
  await connectDB();

  const featured = await Article.findOne({
    status: "published",
    isFeatured: true,
    "relatedArticles.0": { $exists: true },
  })
    .sort({ updatedAt: -1 })
    .select("relatedArticles")
    .lean();

  return (featured?.relatedArticles ?? []) as mongoose.Types.ObjectId[];
}

export async function resolveHomeRelatedArticleIdList(): Promise<mongoose.Types.ObjectId[]> {
  const { getHomeRelatedArticleIds } = await import("@/models/SiteSettings");
  const manual = await getHomeRelatedArticleIds();
  if (manual.length > 0) return manual;
  return getFeaturedHeroRelatedArticleIds();
}
