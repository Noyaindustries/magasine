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
import { getArticleAdminStats } from "@/lib/article-admin-stats";
import { tagExistingDemoArticles } from "@/lib/seed-import";
import { formatAuthorNames } from "@/lib/format-authors";
import { isRegionCategoryRecord } from "@/lib/region-category-slugs";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    category?: string;
    region?: string;
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
  const {
    status: statusParam,
    q,
    category,
    region,
    author,
    page: pageParam,
    demo: demoParam,
  } = await searchParams;
  const demoOnly = demoParam === "1";
  const status =
    statusParam && STATUSES.includes(statusParam as ArticleStatus)
      ? (statusParam as ArticleStatus)
      : undefined;
  const page = Math.max(1, Number(pageParam) || 1);

  await connectDB();
  await tagExistingDemoArticles();

  const andConditions: Record<string, unknown>[] = [];
  if (demoOnly) andConditions.push(getDemoArticleFilter());
  if (status) andConditions.push({ status });
  if (q?.trim()) {
    const termRegex = buildCaseInsensitiveRegex(q);
    if (termRegex) {
      andConditions.push({ $or: [{ title: termRegex }, { excerpt: termRegex }] });
    }
  }

  if (category?.trim()) {
    const cat = await Category.findOne({ name: category.trim() }).select("_id").lean();
    if (cat) {
      andConditions.push({ category: cat._id });
    }
  }

  if (region?.trim()) {
    const regionCats = await Category.find({ name: region.trim() })
      .select("_id slug name")
      .lean();
    const regionIds = regionCats
      .filter((cat) => isRegionCategoryRecord({ slug: cat.slug, name: cat.name }))
      .map((cat) => cat._id);
    if (regionIds.length > 0) {
      andConditions.push({
        $or: [{ category: { $in: regionIds } }, { secondaryCategories: { $in: regionIds } }],
      });
    }
  }

  if (author?.trim()) {
    const authorDoc = await Author.findOne({ name: author.trim() }).select("_id").lean();
    if (authorDoc) {
      andConditions.push({ authors: authorDoc._id });
    }
  }

  const filter: Record<string, unknown> =
    andConditions.length > 1
      ? { $and: andConditions }
      : andConditions[0] ?? {};

  const skip = (page - 1) * PAGE_SIZE;

  const [articlesRaw, filteredCount, countResults, categories, authors, stats] = await Promise.all([
    Article.find(filter)
      .populate("category", "name slug")
      .populate("secondaryCategories", "name slug")
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
    Category.find().sort({ name: 1 }).select("name slug").lean(),
    Author.find().sort({ name: 1 }).select("name").lean(),
    getArticleAdminStats(),
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
    const primaryCategory = article.category as
      | { name?: string; slug?: string }
      | null
      | undefined;
    const secondaryCategories = (article.secondaryCategories ?? []) as {
      name?: string;
      slug?: string;
    }[];
    const regionNames = [
      ...(primaryCategory?.slug && primaryCategory.name
        ? isRegionCategoryRecord({
            slug: primaryCategory.slug,
            name: primaryCategory.name,
          })
          ? [primaryCategory.name]
          : []
        : []),
      ...secondaryCategories
        .filter(
          (category) =>
            category.slug &&
            category.name &&
            isRegionCategoryRecord({ slug: category.slug, name: category.name })
        )
        .map((category) => category.name as string),
    ];
    const uniqueRegionNames = [...new Set(regionNames)];

    return {
      _id: String(article._id),
      slug: article.slug,
      title: article.title,
      status: article.status as ArticleStatus,
      categoryName: primaryCategory?.name ?? "—",
      regionNames: uniqueRegionNames,
      authorName: formatAuthorNames(
        (authorsList ?? []).map((authorRow) => ({ name: authorRow.name ?? "" }))
      ),
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
  const topicCategories = [
    ...new Set(
      categories
        .filter((cat) => !isRegionCategoryRecord({ slug: cat.slug, name: cat.name }))
        .map((cat) => cat.name)
    ),
  ];
  const regionOptions = [
    ...new Set(
      categories
        .filter((cat) => isRegionCategoryRecord({ slug: cat.slug, name: cat.name }))
        .map((cat) => cat.name)
    ),
  ];

  return (
    <CmsArticlesView
      articles={articles}
      counts={counts}
      status={status}
      query={q}
      category={category}
      region={region}
      author={author}
      page={page}
      totalPages={totalPages}
      categories={topicCategories}
      regions={regionOptions}
      authors={[...new Set(authors.map((a) => a.name))]}
      demoCount={stats.overview.demo}
      virtualDemoCount={stats.overview.virtualOnSite}
      seedTotal={stats.overview.seedTotal}
      demoOnly={demoOnly}
      stats={stats}
    />
  );
}
