import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { estimateReadingTime } from "@/lib/utils";
import { canManageArticles } from "@/lib/permissions";
import { notifySubscribersOnMultimediaPublish } from "@/lib/newsletter-auto-publish";
import { z } from "zod";
import { isValidVideoSourceUrl } from "@/lib/article-content-types";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { getCategorySlug } from "@/lib/article-category";
import { assignArticleCategories } from "@/lib/article-category-assignment";
import {
  getAllRegionSlugsForArticle,
  mergeRegionCategoryIdsForArticle,
} from "@/lib/region-categories";
import { revalidateArticleContent } from "@/lib/revalidate-public";
import { invalidatePublishedArticleCountCache } from "@/lib/data";
import { normalizeAuthorIds } from "@/lib/format-authors";

const galleryItemSchema = z.object({
  url: z.string().min(1),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  featuredImage: z.string().url().optional(),
  featuredImageCaption: z.string().optional(),
  categoryId: z.string().optional(),
  regionCategoryIds: z.array(z.string()).optional(),
  authorIds: z.array(z.string().min(1)).min(1).optional(),
  authorId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "review", "scheduled", "published", "archived"]).optional(),
  scheduledAt: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  slug: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isTopStory: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  isEditorsChoice: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  commentsDisabled: z.boolean().optional(),
  allowSocialShare: z.boolean().optional(),
  sendPushOnPublish: z.boolean().optional(),
  gallery: z.array(galleryItemSchema).optional(),
  contentType: z.enum(["article", "video", "podcast", "gallery"]).optional(),
  videoUrl: z
    .string()
    .optional()
    .refine((value) => !value || isValidVideoSourceUrl(value), "Invalid video URL"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || !canManageArticles(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  await connectDB();
  const article = await Article.findById(id).populate("secondaryCategories", "slug").lean();
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const secondaryCategories = article.secondaryCategories as unknown as
    | { _id: mongoose.Types.ObjectId; slug: string }[]
    | undefined;
  const regionCategoryIds = await mergeRegionCategoryIdsForArticle(
    article.category,
    (secondaryCategories ?? []).map((category) => String(category._id))
  );

  return NextResponse.json({
    _id: String(article._id),
    title: article.title,
    subtitle: article.subtitle ?? "",
    excerpt: article.excerpt,
    content: article.content,
    featuredImage: article.featuredImage,
    featuredImageCaption: article.featuredImageCaption ?? "",
    categoryId: String(article.category),
    regionCategoryIds,
    authorIds: article.authors.map((id) => String(id)),
    authorId: article.authors[0] ? String(article.authors[0]) : "",
    tags: article.tags,
    status: article.status,
    scheduledAt: article.scheduledAt ? new Date(article.scheduledAt).toISOString() : undefined,
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    isFeatured: article.isFeatured,
    isTopStory: article.isTopStory,
    isUrgent: article.isUrgent,
    isEditorsChoice: article.isEditorsChoice,
    isPremium: article.isPremium,
    commentsDisabled: article.commentsDisabled ?? false,
    allowSocialShare: article.allowSocialShare ?? true,
    sendPushOnPublish: article.sendPushOnPublish ?? false,
    slug: article.slug,
    version: article.version ?? 1,
    gallery: article.gallery ?? [],
    contentType: article.contentType ?? "article",
    videoUrl: article.videoUrl ?? "",
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || !canManageArticles(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectDB();
  const article = await Article.findById(id);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const data = parsed.data;
  const wasPublished = article.status === "published";
  const previousSlug = article.slug;
  const previousCategorySlug = await getCategorySlug(article.category);
  const previousRegionSlugs = await getAllRegionSlugsForArticle({
    category: article.category,
    secondaryCategories: article.secondaryCategories,
  });

  const regionIds =
    data.regionCategoryIds ??
    article.secondaryCategories.map((categoryId: mongoose.Types.ObjectId) => String(categoryId));

  const resolvedAuthorIds =
    data.authorIds !== undefined || data.authorId !== undefined
      ? normalizeAuthorIds(data.authorIds, data.authorId)
      : article.authors.map((id) => String(id));

  if (!resolvedAuthorIds || resolvedAuthorIds.length === 0) {
    return NextResponse.json({ error: "At least one author is required" }, { status: 400 });
  }

  const assignment = await assignArticleCategories({
    currentPrimaryId: article.category,
    categoryId: data.categoryId,
    regionCategoryIds: regionIds,
    authorId: resolvedAuthorIds[0],
  });

  if ("error" in assignment) {
    return NextResponse.json({ error: assignment.error }, { status: 400 });
  }

  article.category = assignment.primaryId;
  article.secondaryCategories = assignment.secondaryCategoryIds as never;

  if (data.title) article.title = data.title;
  if (data.slug) {
    article.slug = slugify(data.slug, { lower: true, strict: true });
  } else if (data.title) {
    article.slug = slugify(data.title, { lower: true, strict: true });
  }
  if (data.subtitle !== undefined) article.subtitle = data.subtitle;
  if (data.excerpt) article.excerpt = data.excerpt;
  if (data.content) {
    const sanitized = sanitizeArticleHtml(data.content);
    article.content = sanitized;
    article.readingTime = estimateReadingTime(sanitized);
  }
  if (data.featuredImage) article.featuredImage = data.featuredImage;
  if (data.featuredImageCaption !== undefined) {
    article.featuredImageCaption = data.featuredImageCaption;
  }
  if (data.authorIds !== undefined || data.authorId !== undefined) {
    article.authors = resolvedAuthorIds as never;
  }
  if (data.tags) article.tags = data.tags;
  if (data.seoTitle !== undefined) article.seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) article.seoDescription = data.seoDescription;
  if (data.status) {
    article.status = data.status;
    if (data.status === "published" && !article.publishedAt) {
      article.publishedAt = new Date();
    }
  }
  if (data.scheduledAt) {
    article.scheduledAt = new Date(data.scheduledAt);
    if (!data.status) article.status = "scheduled";
  }
  if (data.isFeatured !== undefined) article.isFeatured = data.isFeatured;
  if (data.isTopStory !== undefined) article.isTopStory = data.isTopStory;
  if (data.isUrgent !== undefined) article.isUrgent = data.isUrgent;
  if (data.isEditorsChoice !== undefined) article.isEditorsChoice = data.isEditorsChoice;
  if (data.isPremium !== undefined) article.isPremium = data.isPremium;
  if (data.commentsDisabled !== undefined) article.commentsDisabled = data.commentsDisabled;
  if (data.allowSocialShare !== undefined) article.allowSocialShare = data.allowSocialShare;
  if (data.sendPushOnPublish !== undefined) article.sendPushOnPublish = data.sendPushOnPublish;
  if (data.gallery !== undefined) article.gallery = data.gallery;
  if (data.contentType) article.contentType = data.contentType;
  if (data.videoUrl !== undefined) {
    article.videoUrl = data.videoUrl.trim() || undefined;
  }

  await article.save();

  if (!wasPublished && article.status === "published") {
    void notifySubscribersOnMultimediaPublish(String(article._id)).catch((error) => {
      console.error("[newsletter] auto publish failed", error);
    });
  }

  revalidateArticleContent(article.slug, {
    previousSlug,
    categorySlug: await getCategorySlug(article.category),
    previousCategorySlug,
    regionSlugs: await getAllRegionSlugsForArticle({
      category: article.category,
      secondaryCategories: article.secondaryCategories,
    }),
    previousRegionSlugs,
  });
  invalidatePublishedArticleCountCache();
  return NextResponse.json({ _id: String(article._id), slug: article.slug, version: article.version });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user || !canManageArticles(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await context.params;
  await connectDB();
  const result = await Article.findByIdAndDelete(id);
  if (!result) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  revalidateArticleContent(result.slug, {
    categorySlug: await getCategorySlug(result.category),
    regionSlugs: await getAllRegionSlugsForArticle({
      category: result.category,
      secondaryCategories: result.secondaryCategories,
    }),
  });
  invalidatePublishedArticleCountCache();
  return NextResponse.json({ success: true });
}
