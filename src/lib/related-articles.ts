import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import {
  MAX_HOME_RELATED_ARTICLES,
  MAX_RELATED_ARTICLES,
  type RelatedArticleOption,
} from "@/lib/related-articles-shared";

export async function loadRelatedArticleOptions(
  ids: mongoose.Types.ObjectId[] | undefined
): Promise<RelatedArticleOption[]> {
  if (!ids?.length) return [];

  await connectDB();
  const docs = await Article.find({ _id: { $in: ids } })
    .select("title slug status")
    .lean();
  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));

  return ids
    .map((id) => byId.get(String(id)))
    .filter((doc): doc is (typeof docs)[number] => Boolean(doc))
    .map((doc) => ({
      _id: String(doc._id),
      title: doc.title,
      slug: doc.slug,
      status: doc.status,
    }));
}

export async function resolveRelatedArticleIds(
  ids: string[],
  options?: { excludeId?: string }
): Promise<{ ids: mongoose.Types.ObjectId[] } | { error: string }> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (unique.length > MAX_RELATED_ARTICLES) {
    return { error: `Select at most ${MAX_RELATED_ARTICLES} related articles.` };
  }

  if (options?.excludeId && unique.includes(options.excludeId)) {
    return { error: "An article cannot be related to itself." };
  }

  if (unique.length === 0) {
    return { ids: [] };
  }

  for (const id of unique) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { error: "Invalid related article id." };
    }
  }

  await connectDB();
  const found = await Article.find({ _id: { $in: unique } }).select("_id").lean();
  if (found.length !== unique.length) {
    return { error: "One or more related articles were not found." };
  }

  return {
    ids: unique.map((id) => new mongoose.Types.ObjectId(id)),
  };
}

export async function resolveHomeRelatedArticleIds(
  ids: string[]
): Promise<{ ids: mongoose.Types.ObjectId[] } | { error: string }> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];

  if (unique.length > MAX_HOME_RELATED_ARTICLES) {
    return {
      error: `Select at most ${MAX_HOME_RELATED_ARTICLES} related stories for the homepage.`,
    };
  }

  if (unique.length === 0) {
    return { ids: [] };
  }

  for (const id of unique) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { error: "Invalid related article id." };
    }
  }

  await connectDB();
  const found = await Article.find({ _id: { $in: unique } }).select("_id").lean();
  if (found.length !== unique.length) {
    return { error: "One or more related articles were not found." };
  }

  return {
    ids: unique.map((id) => new mongoose.Types.ObjectId(id)),
  };
}
