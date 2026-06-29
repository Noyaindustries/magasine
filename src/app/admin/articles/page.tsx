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

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    category?: string;
    author?: string;
    page?: string;
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

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const { status: statusParam, q, category, author, page: pageParam } = await searchParams;
  const status =
    statusParam && STATUSES.includes(statusParam as ArticleStatus)
      ? (statusParam as ArticleStatus)
      : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q?.trim()) {
    filter.$or = [
      { title: { $regex: q.trim(), $options: "i" } },
      { excerpt: { $regex: q.trim(), $options: "i" } },
    ];
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

  const [articlesRaw, filteredCount, countResults, categories, authors] = await Promise.all([
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
    />
  );
}
