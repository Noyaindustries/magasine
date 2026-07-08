import slugify from "slugify";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { Author } from "@/models/Author";
import { Article } from "@/models/Article";
import {
  SEED_ARTICLES,
  SEED_AUTHORS,
  SEED_CATEGORIES,
} from "@/lib/seed-data";
import { getAuthorAvatarUrl, resolveFeaturedImage } from "@/lib/images";
import { resolveArticleContent } from "@/lib/article-content";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";

export interface DemoImportResult {
  categoriesCreated: number;
  authorsCreated: number;
  articlesCreated: number;
  articlesSkipped: number;
}

/**
 * Importe le contenu de démonstration (mêmes données que les fallbacks de la page
 * d'accueil) directement en base, afin qu'il devienne modifiable et supprimable
 * depuis l'admin. Idempotent : catégories/auteurs upsertés par slug, articles
 * insérés uniquement s'ils n'existent pas déjà (identifiés par leur slug).
 */
export async function importDemoContent(): Promise<DemoImportResult> {
  await connectDB();

  let categoriesCreated = 0;
  for (const cat of SEED_CATEGORIES) {
    const res = await Category.updateOne(
      { slug: cat.slug },
      { $setOnInsert: cat },
      { upsert: true },
    );
    if (res.upsertedCount) categoriesCreated += 1;
  }

  let authorsCreated = 0;
  for (const author of SEED_AUTHORS) {
    const res = await Author.updateOne(
      { slug: author.slug },
      { $setOnInsert: { ...author, avatar: getAuthorAvatarUrl(author.slug) } },
      { upsert: true },
    );
    if (res.upsertedCount) authorsCreated += 1;
  }

  const catMap = Object.fromEntries(
    (await Category.find().select("slug").lean()).map((c) => [c.slug, c._id]),
  );
  const authorDocs = await Author.find().select("slug").sort({ createdAt: 1 }).lean();

  const now = Date.now();
  let articlesCreated = 0;
  let articlesSkipped = 0;

  for (let i = 0; i < SEED_ARTICLES.length; i += 1) {
    const article = SEED_ARTICLES[i];
    const slug =
      article.slug ?? slugify(article.title, { lower: true, strict: true });

    const exists = await Article.exists({ slug });
    if (exists) {
      articlesSkipped += 1;
      continue;
    }

    const categoryId = catMap[article.category];
    if (!categoryId) {
      articlesSkipped += 1;
      continue;
    }

    const authorIndex = article.authorIndex ?? i % Math.max(1, authorDocs.length);
    const authorId = authorDocs[authorIndex]?._id ?? authorDocs[0]?._id;
    if (!authorId) {
      articlesSkipped += 1;
      continue;
    }

    const rawContent = resolveArticleContent(
      article.title,
      article.excerpt,
      article.content,
      slug,
    );
    const words = rawContent.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const publishedAt = new Date(now - i * 3600000 * 4);

    await Article.create({
      title: article.title,
      subtitle: article.subtitle,
      slug,
      excerpt: article.excerpt,
      content: sanitizeArticleHtml(rawContent),
      featuredImage: resolveFeaturedImage(article.image),
      featuredImageAlt: article.title,
      category: categoryId,
      authors: [authorId],
      tags: article.tags,
      status: "published" as const,
      publishedAt,
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
      views: Math.floor(Math.random() * 8000) + 200,
    });
    articlesCreated += 1;
  }

  return { categoriesCreated, authorsCreated, articlesCreated, articlesSkipped };
}
