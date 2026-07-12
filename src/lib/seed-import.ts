import slugify from "slugify";
import type { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Author } from "@/models/Author";
import { Article } from "@/models/Article";
import {
  SEED_ARTICLES,
  SEED_AUTHORS,
  SEED_CATEGORIES,
  type SeedArticle,
} from "@/lib/seed-data";
import { getAuthorAvatarUrl, resolveFeaturedImage } from "@/lib/images";
import { resolveArticleContent } from "@/lib/article-content";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";
import { isRegionCategorySlug } from "@/lib/region-category-slugs";
import { getDemoArticleFilter, getSeedArticleSlugs } from "@/lib/demo-articles";

const AUTHOR_DEFAULT_REGION: Record<string, string> = {
  "lucia-mendoza": "latin-america",
  "priya-sharma": "south-asia",
  "omar-al-hassan": "west-asia",
};

function resolveSeedArticleRegions(
  article: SeedArticle,
  authorSlug: string
): string[] {
  if (isRegionCategorySlug(article.category)) return [];
  if (article.regions?.length) return article.regions;
  return [AUTHOR_DEFAULT_REGION[authorSlug] ?? "africa"];
}

function resolveSeedArticleSlug(article: SeedArticle): string {
  return article.slug ?? slugify(article.title, { lower: true, strict: true });
}

type CategoryIdMap = Record<string, Types.ObjectId>;
type AuthorDoc = { _id: Types.ObjectId; slug: string };

function buildSeedArticlePayload(
  article: SeedArticle,
  index: number,
  catMap: CategoryIdMap,
  authorDocs: AuthorDoc[],
  options: { publishedAt: Date; randomViews: boolean }
) {
  const slug = resolveSeedArticleSlug(article);
  const categoryId = catMap[article.category];
  if (!categoryId) return null;

  const authorIndex = article.authorIndex ?? index % Math.max(1, authorDocs.length);
  const authorDoc = authorDocs[authorIndex] ?? authorDocs[0];
  const authorId = authorDoc?._id;
  if (!authorId) return null;

  const regionSlugs = resolveSeedArticleRegions(article, authorDoc.slug);
  const secondaryCategories = regionSlugs
    .map((regionSlug) => catMap[regionSlug])
    .filter(Boolean);

  const rawContent = resolveArticleContent(
    article.title,
    article.excerpt,
    article.content,
    slug
  );
  const words = rawContent.replace(/<[^>]*>/g, "").split(/\s+/).length;

  return {
    title: article.title,
    subtitle: article.subtitle,
    slug,
    excerpt: article.excerpt,
    content: sanitizeArticleHtml(rawContent),
    featuredImage: resolveFeaturedImage(article.image),
    featuredImageAlt: article.title,
    category: categoryId,
    secondaryCategories,
    authors: [authorId],
    tags: article.tags,
    status: "published" as const,
    publishedAt: options.publishedAt,
    readingTime: Math.max(1, Math.ceil(words / 200)),
    isFeatured: article.isFeatured ?? false,
    isTopStory: article.isTopStory ?? false,
    isUrgent: article.isUrgent ?? false,
    isEditorsChoice: article.isEditorsChoice ?? false,
    isPremium: article.isPremium ?? false,
    contentType: article.contentType ?? "article",
    videoUrl: article.videoUrl,
    gallery: article.gallery?.map((item) => ({
      ...item,
      url: resolveFeaturedImage(item.url),
    })),
    views: options.randomViews
      ? Math.floor(Math.random() * 8000) + 200
      : undefined,
    isDemo: true,
  };
}

async function loadSeedReferenceMaps() {
  const catMap = Object.fromEntries(
    (await Category.find().select("slug").lean()).map((category) => [
      category.slug,
      category._id,
    ])
  ) as CategoryIdMap;
  const authorDocs = (await Author.find().select("slug").sort({ createdAt: 1 }).lean()) as AuthorDoc[];
  return { catMap, authorDocs };
}

/** Upserts seed categories and refreshes English labels/descriptions in MongoDB. */
export async function syncSeedCategories(): Promise<number> {
  await connectDB();
  let synced = 0;

  for (const cat of SEED_CATEGORIES) {
    const res = await Category.updateOne(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          description: cat.description,
          color: cat.color,
          order: cat.order,
          isActive: true,
        },
      },
      { upsert: true }
    );
    if (res.modifiedCount || res.upsertedCount) synced += 1;
  }

  return synced;
}

/** Upserts seed authors and refreshes bios in MongoDB. */
export async function syncSeedAuthors(): Promise<number> {
  await connectDB();
  let synced = 0;

  for (const author of SEED_AUTHORS) {
    const res = await Author.updateOne(
      { slug: author.slug },
      {
        $set: {
          name: author.name,
          bio: author.bio,
          avatar: getAuthorAvatarUrl(author.slug),
        },
      },
      { upsert: true }
    );
    if (res.modifiedCount || res.upsertedCount) synced += 1;
  }

  return synced;
}

/** Refreshes editorial fields on existing seed/demo articles from seed-data.ts. */
export async function syncDemoArticlesFromSeed(): Promise<number> {
  await connectDB();
  const { catMap, authorDocs } = await loadSeedReferenceMaps();
  let updated = 0;

  for (let i = 0; i < SEED_ARTICLES.length; i += 1) {
    const article = SEED_ARTICLES[i]!;
    const slug = resolveSeedArticleSlug(article);
    const existing = await Article.findOne({ slug }).select("publishedAt views").lean();
    if (!existing) continue;

    const payload = buildSeedArticlePayload(article, i, catMap, authorDocs, {
      publishedAt: existing.publishedAt ?? new Date(),
      randomViews: false,
    });
    if (!payload) continue;

    const { views: _views, ...updateFields } = payload;
    const res = await Article.updateOne({ slug }, { $set: updateFields });
    if (res.modifiedCount) updated += 1;
  }

  return updated;
}

/** Syncs categories, authors, and seed articles to the English demo pack. */
export async function syncSeedEditorialContent(): Promise<{
  categoriesSynced: number;
  authorsSynced: number;
  articlesUpdated: number;
}> {
  const categoriesSynced = await syncSeedCategories();
  const authorsSynced = await syncSeedAuthors();
  const articlesUpdated = await syncDemoArticlesFromSeed();
  return { categoriesSynced, authorsSynced, articlesUpdated };
}

export interface DemoImportResult {
  categoriesCreated: number;
  categoriesSynced: number;
  authorsCreated: number;
  authorsSynced: number;
  articlesCreated: number;
  articlesUpdated: number;
  articlesSkipped: number;
}

export interface DemoDeleteResult {
  deleted: number;
}

/** Marks existing seed articles (without isDemo) so they appear in the admin Demo tab. */
export async function tagExistingDemoArticles(): Promise<number> {
  await connectDB();
  const result = await Article.updateMany(
    { slug: { $in: getSeedArticleSlugs() }, isDemo: { $ne: true } },
    { $set: { isDemo: true } }
  );
  return result.modifiedCount;
}

/** Deletes all demo articles from the database. */
export async function deleteAllDemoArticles(): Promise<DemoDeleteResult> {
  await connectDB();
  const result = await Article.deleteMany(getDemoArticleFilter());
  return { deleted: result.deletedCount };
}

/**
 * Imports demo content into MongoDB so it can be edited from the admin.
 * Idempotent: upserts categories/authors, inserts missing articles, and
 * refreshes English editorial fields on existing seed articles.
 */
export async function importDemoContent(): Promise<DemoImportResult> {
  await connectDB();

  const categoriesSynced = await syncSeedCategories();
  let categoriesCreated = 0;
  for (const cat of SEED_CATEGORIES) {
    const exists = await Category.exists({ slug: cat.slug });
    if (!exists) categoriesCreated += 1;
  }

  const authorsSynced = await syncSeedAuthors();
  let authorsCreated = 0;
  for (const author of SEED_AUTHORS) {
    const exists = await Author.exists({ slug: author.slug });
    if (!exists) authorsCreated += 1;
  }

  const { catMap, authorDocs } = await loadSeedReferenceMaps();

  const now = Date.now();
  let articlesCreated = 0;
  let articlesSkipped = 0;

  for (let i = 0; i < SEED_ARTICLES.length; i += 1) {
    const article = SEED_ARTICLES[i]!;
    const slug = resolveSeedArticleSlug(article);

    const exists = await Article.exists({ slug });
    if (exists) {
      articlesSkipped += 1;
      continue;
    }

    const payload = buildSeedArticlePayload(article, i, catMap, authorDocs, {
      publishedAt: new Date(now - i * 3600000 * 4),
      randomViews: true,
    });
    if (!payload) {
      articlesSkipped += 1;
      continue;
    }

    await Article.create(payload);
    articlesCreated += 1;
  }

  const articlesUpdated = await syncDemoArticlesFromSeed();

  return {
    categoriesCreated,
    categoriesSynced,
    authorsCreated,
    authorsSynced,
    articlesCreated,
    articlesUpdated,
    articlesSkipped,
  };
}
