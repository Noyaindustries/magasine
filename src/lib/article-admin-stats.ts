import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import type { ArticleStatus } from "@/types";
import { getDemoArticleFilter, getDemoContentStatus } from "@/lib/demo-articles";

const DAY_MS = 86_400_000;

export interface ArticleStatusBreakdown {
  all: number;
  published: number;
  draft: number;
  review: number;
  scheduled: number;
  archived: number;
}

export interface ArticleContentTypeStat {
  type: string;
  label: string;
  total: number;
  published: number;
}

export interface ArticleCategoryStat {
  name: string;
  slug: string;
  total: number;
  published: number;
  views: number;
}

export interface ArticleEditorialFlagStat {
  key: string;
  label: string;
  count: number;
}

export interface ArticleAdminStats {
  overview: {
    total: number;
    real: number;
    demo: number;
    virtualOnSite: number;
    seedTotal: number;
    publishedReal: number;
    publishedDemo: number;
    publishedTotal: number;
    totalViews: number;
    realViews: number;
    avgReadingTime: number;
    publishedThisWeek: number;
    publishedThisMonth: number;
  };
  byStatus: ArticleStatusBreakdown;
  byContentType: ArticleContentTypeStat[];
  byCategory: ArticleCategoryStat[];
  editorialFlags: ArticleEditorialFlagStat[];
}

const STATUSES: ArticleStatus[] = [
  "published",
  "draft",
  "review",
  "scheduled",
  "archived",
];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: "Articles",
  video: "Videos",
  podcast: "Podcasts",
  gallery: "Galleries",
};

function getRealArticleFilter(): Record<string, unknown> {
  return { $nor: [getDemoArticleFilter()] };
}

function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getArticleAdminStats(): Promise<ArticleAdminStats> {
  await connectDB();

  const demoFilter = getDemoArticleFilter();
  const realFilter = getRealArticleFilter();
  const publishedFilter = { status: "published" as const };
  const publishedRealFilter = { $and: [publishedFilter, realFilter] };
  const publishedDemoFilter = { $and: [publishedFilter, demoFilter] };

  const weekStart = startOfUtcDay(new Date(Date.now() - 7 * DAY_MS));
  const monthStart = startOfUtcDay(new Date(Date.now() - 30 * DAY_MS));

  const [
    demoStatus,
    statusCounts,
    real,
    publishedReal,
    publishedDemo,
    totalViewsAgg,
    realViewsAgg,
    avgReadingAgg,
    publishedThisWeek,
    publishedThisMonth,
    byContentTypeRaw,
    byCategoryRaw,
    featuredCount,
    topStoryCount,
    editorsChoiceCount,
    urgentCount,
    premiumCount,
  ] = await Promise.all([
    getDemoContentStatus(),
    Promise.all([
      Article.countDocuments(),
      ...STATUSES.map((status) => Article.countDocuments({ status })),
    ]),
    Article.countDocuments(realFilter),
    Article.countDocuments(publishedRealFilter),
    Article.countDocuments(publishedDemoFilter),
    Article.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: { $ifNull: ["$views", 0] } } } },
    ]),
    Article.aggregate<{ total: number }>([
      { $match: realFilter },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$views", 0] } } } },
    ]),
    Article.aggregate<{ avg: number }>([
      { $group: { _id: null, avg: { $avg: { $ifNull: ["$readingTime", 1] } } } },
    ]),
    Article.countDocuments({
      status: "published",
      publishedAt: { $gte: weekStart },
    }),
    Article.countDocuments({
      status: "published",
      publishedAt: { $gte: monthStart },
    }),
    Article.aggregate<{ _id: string; total: number; published: number }>([
      {
        $group: {
          _id: { $ifNull: ["$contentType", "article"] },
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Article.aggregate<{
      name: string;
      slug: string;
      total: number;
      published: number;
      views: number;
    }>([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "cat",
        },
      },
      { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$cat._id",
          name: { $first: { $ifNull: ["$cat.name", "Uncategorized"] } },
          slug: { $first: { $ifNull: ["$cat.slug", "uncategorized"] } },
          total: { $sum: 1 },
          published: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          views: { $sum: { $ifNull: ["$views", 0] } },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Article.countDocuments({ ...publishedFilter, isFeatured: true }),
    Article.countDocuments({ ...publishedFilter, isTopStory: true }),
    Article.countDocuments({ ...publishedFilter, isEditorsChoice: true }),
    Article.countDocuments({ ...publishedFilter, isUrgent: true }),
    Article.countDocuments({ ...publishedFilter, isPremium: true }),
  ]);

  const [total, ...statusOnly] = statusCounts;
  const byStatus: ArticleStatusBreakdown = {
    all: total ?? 0,
    published: statusOnly[0] ?? 0,
    draft: statusOnly[1] ?? 0,
    review: statusOnly[2] ?? 0,
    scheduled: statusOnly[3] ?? 0,
    archived: statusOnly[4] ?? 0,
  };

  return {
    overview: {
      total: byStatus.all,
      real,
      demo: demoStatus.inDatabase,
      virtualOnSite: demoStatus.virtualOnSite,
      seedTotal: demoStatus.seedTotal,
      publishedReal,
      publishedDemo,
      publishedTotal: byStatus.published,
      totalViews: totalViewsAgg[0]?.total ?? 0,
      realViews: realViewsAgg[0]?.total ?? 0,
      avgReadingTime: Math.round(avgReadingAgg[0]?.avg ?? 0),
      publishedThisWeek,
      publishedThisMonth,
    },
    byStatus,
    byContentType: byContentTypeRaw.map((row) => ({
      type: row._id,
      label: CONTENT_TYPE_LABELS[row._id] ?? row._id,
      total: row.total,
      published: row.published,
    })),
    byCategory: byCategoryRaw.map((row) => ({
      name: row.name,
      slug: row.slug,
      total: row.total,
      published: row.published,
      views: row.views,
    })),
    editorialFlags: [
      { key: "featured", label: "Featured", count: featuredCount },
      { key: "topStory", label: "Top story", count: topStoryCount },
      { key: "editorsChoice", label: "Editor's choice", count: editorsChoiceCount },
      { key: "urgent", label: "Urgent", count: urgentCount },
      { key: "premium", label: "Premium", count: premiumCount },
    ],
  };
}
