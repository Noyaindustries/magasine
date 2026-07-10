import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { Author } from "@/models/Author";
import {
  CmsArticlesView,
  type ArticleListRow,
  type ArticleStatusCounts,
} from "@/components/admin/cms/CmsArticlesView";
import type { ArticleStatus } from "@/types";
import { ARTICLES_PAGE_SIZE } from "@/lib/pagination";
import { buildCaseInsensitiveRegex } from "@/lib/mongo-regex";
import { getDemoArticleFilter } from "@/lib/demo-articles";
import { tagExistingDemoArticles } from "@/lib/seed-import";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    category?: string;
    author?: string;
    page?: string;
    demo?: string;
  }>;
}

const STATUSES: ArticleStatus[] = [
  "published",
  "draft",
  "review",
  "scheduled",
  "archived",
];

const PAGE_SIZE = ARTICLES_PAGE_SIZE;

// Toujours lire l'état réel de la base (jamais de version pré-rendue en cache).
export const dynamic = "force-dynamic";

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const { status: statusParam, q, category, author, page: pageParam, demo: demoParam } =
    await searchParams;
  const demoOnly = demoParam === "1";
  const status =
    statusParam && STATUSES.includes(statusParam as ArticleStatus)
      ? (statusParam as ArticleStatus)
      : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  await connectDB();
  await tagExistingDemoArticles();

  const filter: Record<string, unknown> = {};
  if (demoOnly) Object.assign(filter, getDemoArticleFilter());
  if (status) filter.status = status;
  if (q?.trim()) {
    const termRegex = buildCaseInsensitiveRegex(q);
    if (termRegex) {
      filter.$or = [{ title: termRegex }, { excerpt: termRegex }];
    }
  }

  if (category?.trim()) {
    const cat = await Category.findOne({ name: category.trim() }).select("_id").lean();
    if (cat) filter.category = cat._id;
  }

  if (author?.trim()) {
    const authorDoc = await Author.findOne({ name: author.trim() }).select("_id").lean();
    if (authorDoc) filter.authors = authorDoc._id;
  }

  const skip = (page - 1) * PAGE_SIZE;

  const [articlesRaw, filteredCount, countResults, demoCount, categories, authors] =
    await Promise.all([
    Article.find(filter)
      .populate("category", "name")
      .populate("authors", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Article.countDocuments(filter),
    Promise.all([
      Article.countDocuments(),
      ...STATUSES.map((s) => Article.countDocuments({ status: s })),
    ]),
    Article.countDocuments(getDemoArticleFilter()),
    Category.find().sort({ name: 1 }).select("name").lean(),
    Author.find().sort({ name: 1 }).select("name").lean(),
  ]);

  const counts: ArticleStatusCounts = {
    all: countResults[0] ?? 0,
    published: countResults[1] ?? 0,
    draft: countResults[2] ?? 0,
    review: countResults[3] ?? 0,
    scheduled: countResults[4] ?? 0,
    archived: countResults[5] ?? 0,
  };

  const articles: ArticleListRow[] = articlesRaw.map((article) => {
    const authorsList = article.authors as { name?: string }[] | undefined;
    return {
      _id: String(article._id),
      slug: article.slug,
      title: article.title,
      status: article.status as ArticleStatus,
      categoryName: (article.category as { name?: string } | null)?.name ?? "—",
      authorName: authorsList?.[0]?.name ?? "—",
      views: article.views ?? 0,
      readingTime: article.readingTime ?? 0,
      updatedAt: article.updatedAt
        ? new Date(article.updatedAt).toISOString()
        : new Date().toISOString(),
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
      scheduledAt: article.scheduledAt
        ? new Date(article.scheduledAt).toISOString()
        : undefined,
      isDemo: Boolean(article.isDemo),
    };
  });

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  return (
    <CmsArticlesView
      articles={articles}
      counts={counts}
      status={status}
      query={q}
      category={category}
      author={author}
      page={page}
      totalPages={totalPages}
      categories={categories.map((c) => c.name)}
      authors={authors.map((a) => a.name)}
      demoCount={demoCount}
      demoOnly={demoOnly}
    />
  );
}
