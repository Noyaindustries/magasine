import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { estimateReadingTime } from "@/lib/utils";
import { z } from "zod";
import { isValidVideoSourceUrl } from "@/lib/article-content-types";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { getVideoThumbnailUrl } from "@/lib/video-url";
import { IMG } from "@/lib/img";
import { resolveActiveCategory } from "@/lib/article-category";
import { isRegionCategorySlug, mergeRegionCategoryIdsForArticleWithInference, resolveRegionCategories, getAllRegionSlugsForArticle } from "@/lib/region-categories";
import { revalidateArticleContent } from "@/lib/revalidate-public";

const galleryItemSchema = z.object({
  url: z.string().min(1),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  featuredImage: z.union([z.string().url(), z.literal("")]).optional(),
  featuredImageCaption: z.string().optional(),
  categoryId: z.string(),
  regionCategoryIds: z.array(z.string()).optional().default([]),
  authorId: z.string(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "review", "scheduled", "published", "archived"]),
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
  contentType: z.enum(["article", "video", "podcast", "gallery"]).optional().default("article"),
  videoUrl: z
    .string()
    .optional()
    .refine((value) => !value || isValidVideoSourceUrl(value), "Invalid video URL"),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["super_admin", "admin", "editor", "author"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectDB();
    const category = await resolveActiveCategory(parsed.data.categoryId);
    if (!category) {
      return NextResponse.json({ error: "Invalid or inactive category" }, { status: 400 });
    }
    if (isRegionCategorySlug(category.slug)) {
      return NextResponse.json(
        { error: "Choisissez une rubrique thématique ; les régions se sélectionnent ci-dessous." },
        { status: 400 }
      );
    }

    const mergedRegionIds = await mergeRegionCategoryIdsForArticleWithInference(
      category._id,
      parsed.data.regionCategoryIds ?? [],
      parsed.data.authorId
    );
    const regionCategories = await resolveRegionCategories(mergedRegionIds);
    if (regionCategories === null) {
      return NextResponse.json({ error: "Invalid region selection" }, { status: 400 });
    }

    const slug = parsed.data.slug
      ? slugify(parsed.data.slug, { lower: true, strict: true })
      : slugify(parsed.data.title, { lower: true, strict: true });

    const existing = await Article.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "An article with this slug already exists" }, { status: 409 });
    }

    // Couverture facultative : pour une vidéo on tente d'utiliser la miniature YouTube,
    // sinon on retombe sur une image éditoriale par défaut (le champ est requis en base).
    let featuredImage = parsed.data.featuredImage?.trim() || "";
    if (!featuredImage && parsed.data.contentType === "video" && parsed.data.videoUrl) {
      featuredImage = getVideoThumbnailUrl(parsed.data.videoUrl) ?? "";
    }
    if (!featuredImage) {
      featuredImage = IMG.finance;
    }

    const article = await Article.create({
      title: parsed.data.title,
      subtitle: parsed.data.subtitle,
      slug,
      excerpt: parsed.data.excerpt,
      content: sanitizeArticleHtml(parsed.data.content),
      featuredImage,
      featuredImageCaption: parsed.data.featuredImageCaption,
      category: category._id,
      secondaryCategories: regionCategories,
      authors: [parsed.data.authorId],
      tags: parsed.data.tags ?? [],
      status: parsed.data.status,
      publishedAt: parsed.data.status === "published" ? new Date() : undefined,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      readingTime: estimateReadingTime(parsed.data.content),
      seoTitle: parsed.data.seoTitle,
      seoDescription: parsed.data.seoDescription,
      isFeatured: parsed.data.isFeatured ?? false,
      isTopStory: parsed.data.isTopStory ?? false,
      isUrgent: parsed.data.isUrgent ?? false,
      isEditorsChoice: parsed.data.isEditorsChoice ?? false,
      isPremium: parsed.data.isPremium ?? false,
      commentsDisabled: parsed.data.commentsDisabled ?? false,
      allowSocialShare: parsed.data.allowSocialShare ?? true,
      sendPushOnPublish: parsed.data.sendPushOnPublish ?? false,
      gallery: parsed.data.gallery ?? [],
      contentType: parsed.data.contentType,
      videoUrl: parsed.data.videoUrl?.trim() || undefined,
    });

    revalidateArticleContent(article.slug, {
      categorySlug: category.slug,
      regionSlugs: await getAllRegionSlugsForArticle({
        category: article.category,
        secondaryCategories: article.secondaryCategories,
      }),
    });
    return NextResponse.json({ _id: String(article._id), slug: article.slug }, { status: 201 });
  } catch (error) {
    console.error("[admin/articles POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
