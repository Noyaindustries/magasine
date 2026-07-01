import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { Comment } from "@/models/Comment";
import { Newsletter } from "@/models/Newsletter";
import { User } from "@/models/User";
import { AnalyticsDaily } from "@/models/AnalyticsDaily";
import { toDateKey } from "@/lib/analytics-daily";

export type AnalyticsPeriod = 7 | 30 | 90;

export interface AnalyticsKpi {
  id: string;
  label: string;
  value: number;
  trend: number;
  format?: "number" | "compact" | "percent" | "duration";
}

export interface AnalyticsTimelinePoint {
  date: string;
  label: string;
  pageViews: number;
  comments: number;
  subscribers: number;
  registrations: number;
  publications: number;
}

export interface AnalyticsCategoryRow {
  name: string;
  slug: string;
  color: string;
  articles: number;
  views: number;
  avgViews: number;
  sharePct: number;
}

export interface AnalyticsContentTypeRow {
  type: string;
  label: string;
  articles: number;
  views: number;
}

export interface AnalyticsTopArticle {
  _id: string;
  title: string;
  slug: string;
  views: number;
  readingTime: number;
  category: string;
  categoryColor: string;
  contentType: string;
  publishedAt?: string;
  isPremium: boolean;
}

export interface AdminAnalyticsData {
  period: AnalyticsPeriod;
  generatedAt: string;
  trackingSince: string | null;
  kpis: AnalyticsKpi[];
  timeline: AnalyticsTimelinePoint[];
  categories: AnalyticsCategoryRow[];
  contentTypes: AnalyticsContentTypeRow[];
  topArticles: AnalyticsTopArticle[];
  engagement: {
    avgViewsPerArticle: number;
    commentsPerArticle: number;
    premiumSharePct: number;
    newsletterActive: number;
    registeredReaders: number;
  };
}

const DAY_MS = 86_400_000;

const CONTENT_TYPE_LABELS: Record<string, string> = {
  article: "Articles",
  video: "Videos",
  podcast: "Podcasts",
  gallery: "Galleries",
};

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function trendPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function parsePeriod(raw?: string | null): AnalyticsPeriod {
  const n = Number(raw);
  if (n === 30 || n === 90) return n;
  return 7;
}

async function countInRange(
  model: typeof Article | typeof Comment | typeof Newsletter | typeof User,
  field: string,
  from: Date,
  to: Date,
  extra: Record<string, unknown> = {},
) {
  const filter = { ...extra, [field]: { $gte: from, $lt: to } };
  return model.countDocuments(filter as never);
}

async function sumDailyPageViews(from: Date, to: Date): Promise<number> {
  const fromKey = toDateKey(from);
  const toKey = toDateKey(new Date(to.getTime() - 1));
  const rows = await AnalyticsDaily.find({
    dateKey: { $gte: fromKey, $lte: toKey },
  })
    .select("pageViews")
    .lean();
  return rows.reduce((sum, row) => sum + (row.pageViews ?? 0), 0);
}

async function loadDailyPageViews(
  dayStarts: Date[],
): Promise<Map<string, number>> {
  if (dayStarts.length === 0) return new Map();
  const fromKey = toDateKey(dayStarts[0]!);
  const last = dayStarts[dayStarts.length - 1]!;
  const toKey = toDateKey(last);
  const rows = await AnalyticsDaily.find({
    dateKey: { $gte: fromKey, $lte: toKey },
  })
    .select("dateKey pageViews")
    .lean();
  return new Map(rows.map((r) => [r.dateKey, r.pageViews ?? 0]));
}

export async function getAdminAnalyticsData(
  periodInput?: string | null,
): Promise<AdminAnalyticsData> {
  const period = parsePeriod(periodInput);
  await connectDB();

  const now = new Date();
  const periodStart = daysAgo(period - 1);
  const previousStart = daysAgo(period * 2 - 1);
  const previousEnd = periodStart;
  const tomorrow = new Date(daysAgo(0).getTime() + DAY_MS);

  const dayStarts = Array.from({ length: period }, (_, i) =>
    daysAgo(period - 1 - i),
  );

  const [
    totalViewsAgg,
    publishedCount,
    totalComments,
    newsletterActive,
    registeredReaders,
    premiumViewsAgg,
    readingAgg,
    categoryAgg,
    contentTypeAgg,
    topArticlesRaw,
    dailyViewsMap,
    oldestDaily,
    periodPageViews,
    prevPeriodPageViews,
    periodComments,
    prevPeriodComments,
    periodSubscribers,
    prevPeriodSubscribers,
    periodRegistrations,
    prevPeriodRegistrations,
    periodPublications,
    prevPeriodPublications,
  ] = await Promise.all([
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]),
    Article.countDocuments({ status: "published" }),
    Comment.countDocuments(),
    Newsletter.countDocuments({ isActive: true }),
    User.countDocuments({ role: "reader" }),
    Article.aggregate([
      { $match: { status: "published", isPremium: true } },
      { $group: { _id: null, views: { $sum: "$views" } } },
    ]),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, avg: { $avg: "$readingTime" } } },
    ]),
    Article.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$category",
          articles: { $sum: 1 },
          views: { $sum: "$views" },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 12 },
    ]),
    Article.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$contentType",
          articles: { $sum: 1 },
          views: { $sum: "$views" },
        },
      },
      { $sort: { views: -1 } },
    ]),
    Article.find({ status: "published" })
      .populate("category", "name color slug")
      .sort({ views: -1 })
      .limit(12)
      .select("title slug views readingTime contentType publishedAt isPremium category")
      .lean(),
    loadDailyPageViews(dayStarts),
    AnalyticsDaily.findOne().sort({ dateKey: 1 }).select("dateKey").lean(),
    sumDailyPageViews(periodStart, tomorrow),
    sumDailyPageViews(previousStart, previousEnd),
    countInRange(Comment, "createdAt", periodStart, tomorrow),
    countInRange(Comment, "createdAt", previousStart, previousEnd),
    countInRange(Newsletter, "subscribedAt", periodStart, tomorrow, {
      isActive: true,
    }),
    countInRange(Newsletter, "subscribedAt", previousStart, previousEnd, {
      isActive: true,
    }),
    countInRange(User, "createdAt", periodStart, tomorrow, { role: "reader" }),
    countInRange(User, "createdAt", previousStart, previousEnd, {
      role: "reader",
    }),
    countInRange(Article, "publishedAt", periodStart, tomorrow, {
      status: "published",
    }),
    countInRange(Article, "publishedAt", previousStart, previousEnd, {
      status: "published",
    }),
  ]);

  const periodQueries: Promise<number>[] = [];
  for (const start of dayStarts) {
    const end = new Date(start.getTime() + DAY_MS);
    periodQueries.push(
      countInRange(Comment, "createdAt", start, end),
      countInRange(Newsletter, "subscribedAt", start, end, { isActive: true }),
      countInRange(User, "createdAt", start, end, { role: "reader" }),
      countInRange(Article, "publishedAt", start, end, { status: "published" }),
    );
  }
  const periodResults = await Promise.all(periodQueries);

  const timeline: AnalyticsTimelinePoint[] = dayStarts.map((start, i) => {
    const base = i * 4;
    const dateKey = toDateKey(start);
    return {
      date: start.toISOString(),
      label: formatDayLabel(start),
      pageViews: dailyViewsMap.get(dateKey) ?? 0,
      comments: periodResults[base] ?? 0,
      subscribers: periodResults[base + 1] ?? 0,
      registrations: periodResults[base + 2] ?? 0,
      publications: periodResults[base + 3] ?? 0,
    };
  });

  const totalViews =
    (totalViewsAgg[0] as { total?: number } | undefined)?.total ?? 0;
  const premiumViews =
    (premiumViewsAgg[0] as { views?: number } | undefined)?.views ?? 0;
  const avgReadingMinutes = Math.round(
    (readingAgg[0] as { avg?: number } | undefined)?.avg ?? 0,
  );
  const avgViewsPerArticle =
    publishedCount > 0 ? Math.round(totalViews / publishedCount) : 0;
  const commentsPerArticle =
    publishedCount > 0
      ? Math.round((totalComments / publishedCount) * 10) / 10
      : 0;
  const premiumSharePct =
    totalViews > 0 ? Math.round((premiumViews / totalViews) * 100) : 0;

  const categoryIds = categoryAgg.map((c) => c._id);
  const categoryDocs = await Category.find({ _id: { $in: categoryIds } })
    .select("name slug color")
    .lean();
  const catMeta = Object.fromEntries(
    categoryDocs.map((c) => [
      String(c._id),
      {
        name: c.name,
        slug: c.slug,
        color: c.color ?? "#1a3896",
      },
    ]),
  );

  const totalCategoryViews = categoryAgg.reduce(
    (sum, row) => sum + (row.views as number),
    0,
  );

  const categories: AnalyticsCategoryRow[] = categoryAgg.map((row) => {
    const meta = catMeta[String(row._id)] ?? {
      name: "Uncategorized",
      slug: "unknown",
      color: "#6b6b6b",
    };
    const views = row.views as number;
    const articles = row.articles as number;
    return {
      name: meta.name,
      slug: meta.slug,
      color: meta.color,
      articles,
      views,
      avgViews: articles > 0 ? Math.round(views / articles) : 0,
      sharePct:
        totalCategoryViews > 0
          ? Math.round((views / totalCategoryViews) * 100)
          : 0,
    };
  });

  const contentTypes: AnalyticsContentTypeRow[] = contentTypeAgg.map((row) => ({
    type: String(row._id ?? "article"),
    label: CONTENT_TYPE_LABELS[String(row._id)] ?? String(row._id),
    articles: row.articles as number,
    views: row.views as number,
  }));

  const topArticles: AnalyticsTopArticle[] = topArticlesRaw.map((article) => {
    const cat = article.category as unknown as {
      name?: string;
      color?: string;
    } | null;
    return {
      _id: String(article._id),
      title: article.title,
      slug: article.slug,
      views: article.views ?? 0,
      readingTime: article.readingTime ?? 1,
      category: cat?.name ?? "—",
      categoryColor: cat?.color ?? "#1a3896",
      contentType: article.contentType ?? "article",
      publishedAt: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
      isPremium: Boolean(article.isPremium),
    };
  });

  const kpis: AnalyticsKpi[] = [
    {
      id: "pageViews",
      label: `Page views (${period}d)`,
      value: periodPageViews,
      trend: trendPercent(periodPageViews, prevPeriodPageViews),
      format: "compact",
    },
    {
      id: "totalViews",
      label: "Lifetime article views",
      value: totalViews,
      trend: trendPercent(periodPublications, prevPeriodPublications),
      format: "compact",
    },
    {
      id: "comments",
      label: `Comments (${period}d)`,
      value: periodComments,
      trend: trendPercent(periodComments, prevPeriodComments),
    },
    {
      id: "subscribers",
      label: `New subscribers (${period}d)`,
      value: periodSubscribers,
      trend: trendPercent(periodSubscribers, prevPeriodSubscribers),
    },
    {
      id: "registrations",
      label: `New readers (${period}d)`,
      value: periodRegistrations,
      trend: trendPercent(periodRegistrations, prevPeriodRegistrations),
    },
    {
      id: "readingTime",
      label: "Avg. reading time",
      value: avgReadingMinutes,
      trend: 0,
      format: "duration",
    },
  ];

  return {
    period,
    generatedAt: now.toISOString(),
    trackingSince: oldestDaily?.dateKey ?? null,
    kpis,
    timeline,
    categories,
    contentTypes,
    topArticles,
    engagement: {
      avgViewsPerArticle,
      commentsPerArticle,
      premiumSharePct,
      newsletterActive,
      registeredReaders,
    },
  };
}
