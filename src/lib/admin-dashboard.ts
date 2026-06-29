import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { User } from "@/models/User";
import { Comment } from "@/models/Comment";
import { Newsletter } from "@/models/Newsletter";
import { Category } from "@/models/Category";
import { getTodayMetrics } from "@/lib/admin-today-metrics";

export interface DashboardKpi {
  label: string;
  value: number;
  trend: number;
  sparkline: number[];
  format?: "number" | "compact";
}

export interface TimelinePoint {
  label: string;
  date: string;
  articles: number;
  comments: number;
  subscribers: number;
}

export interface CategoryStat {
  name: string;
  count: number;
  views: number;
  color: string;
}

export interface PipelineSlice {
  status: string;
  label: string;
  count: number;
}

export interface TopArticleRow {
  _id: string;
  title: string;
  views: number;
  category: string;
  status: string;
}

export interface RecentArticleRow {
  _id: string;
  title: string;
  status: string;
  category: string;
  updatedAt: string;
}

export interface PendingArticleRow {
  _id: string;
  title: string;
  status: string;
  category: string;
  categoryColor: string;
  authorName: string;
  readingTime: number;
  updatedAt: string;
  scheduledAt?: string;
}

export type ActivityTone = "green" | "amber" | "blue" | "red" | "purple";

export interface DashboardActivityItem {
  id: string;
  tone: ActivityTone;
  icon: string;
  actor?: string;
  action: string;
  subject?: string;
  subjectEmphasis?: "em" | "strong";
  at: string;
  href?: string;
}

export interface TodayStats {
  publishedToday: number;
  commentsToday: number;
  subscribersToday: number;
  uniqueReadersToday: number;
}

export interface WeeklyReport {
  articlesPublished: number;
  commentsReceived: number;
  newSubscribers: number;
  topCategory: string;
  topArticleTitle: string;
  topArticleViews: number;
  pendingReview: number;
  pendingComments: number;
}

export interface AdminDashboardData {
  kpis: DashboardKpi[];
  timeline: TimelinePoint[];
  categories: CategoryStat[];
  pipeline: PipelineSlice[];
  topArticles: TopArticleRow[];
  recentArticles: RecentArticleRow[];
  pendingArticles: PendingArticleRow[];
  activityFeed: DashboardActivityItem[];
  todayStats: TodayStats;
  weeklyReport: WeeklyReport;
  totalComments: number;
  totalViews: number;
  pendingReview: number;
  pendingComments: number;
  scheduledCount: number;
  monthlyNewSubscribers: number;
  avgReadingTime: number;
}

const DAY_MS = 86_400_000;

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function firstAuthorName(authors: unknown): string | undefined {
  if (!Array.isArray(authors) || authors.length === 0) return undefined;
  const first = authors[0];
  if (first && typeof first === "object" && "name" in first && typeof first.name === "string") {
    return first.name;
  }
  return undefined;
}

function buildActivityFeed(input: {
  recentPublished: Array<{ _id: unknown; title: string; publishedAt?: Date; authors?: unknown }>;
  recentEdits: Array<{ _id: unknown; title: string; updatedAt?: Date; authors?: unknown; status: string }>;
  recentUsers: Array<{ _id: unknown; name: string; createdAt?: Date; role: string }>;
  pendingComments: number;
  scheduledPlanner?: { actor: string; count: number; nextAt: Date };
  now: Date;
}): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  for (const article of input.recentPublished) {
    const author = firstAuthorName(article.authors) ?? "An author";
    items.push({
      id: `pub-${String(article._id)}`,
      tone: "green",
      icon: "✓",
      actor: author,
      action: "published",
      subject: article.title,
      subjectEmphasis: "em",
      at: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : input.now.toISOString(),
      href: `/admin/articles/${String(article._id)}`,
    });
  }

  if (input.pendingComments > 0) {
    items.push({
      id: "mod-comments",
      tone: "amber",
      icon: "💬",
      action: `${input.pendingComments} comment${input.pendingComments > 1 ? "s" : ""} awaiting`,
      subject: "moderation",
      subjectEmphasis: "strong",
      at: input.now.toISOString(),
      href: "/admin/comments",
    });
  }

  for (const article of input.recentEdits) {
    const author = firstAuthorName(article.authors) ?? "An author";
    items.push({
      id: `edit-${String(article._id)}`,
      tone: "blue",
      icon: "✏️",
      actor: author,
      action: article.status === "review" ? "submitted" : "edited",
      subject: article.title,
      subjectEmphasis: "em",
      at: article.updatedAt
        ? new Date(article.updatedAt).toISOString()
        : input.now.toISOString(),
      href: `/admin/articles/${String(article._id)}`,
    });
  }

  for (const user of input.recentUsers) {
    items.push({
      id: `user-${String(user._id)}`,
      tone: "red",
      icon: "👤",
      actor: user.name,
      action: "joined the editorial team",
      at: user.createdAt ? new Date(user.createdAt).toISOString() : input.now.toISOString(),
      href: "/admin/users",
    });
  }

  if (input.scheduledPlanner && input.scheduledPlanner.count > 0) {
    const { actor, count, nextAt } = input.scheduledPlanner;
    const tomorrow = new Date(input.now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeLabel = nextAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const when =
      nextAt.toDateString() === tomorrow.toDateString()
        ? `tomorrow ${timeLabel}`
        : `${nextAt.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" })} ${timeLabel}`;

    items.push({
      id: "scheduled-batch",
      tone: "green",
      icon: "📅",
      actor,
      action: `scheduled ${count} article${count > 1 ? "s" : ""} for ${when}`,
      at: input.now.toISOString(),
      href: "/admin/articles?status=scheduled",
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6);
}

function trendPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function buildSparkline(counts: number[]) {
  return counts.length > 0 ? counts : [0];
}

async function countInRange(
  model: typeof Article | typeof Comment | typeof Newsletter | typeof User,
  field: string,
  from: Date,
  to: Date,
  extra: Record<string, unknown> = {}
) {
  const filter = { ...extra, [field]: { $gte: from, $lt: to } };
  return model.countDocuments(filter as never);
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  await connectDB();

  const now = new Date();
  const rangeDays = 14;
  const dayStarts = Array.from({ length: rangeDays }, (_, i) => daysAgo(rangeDays - 1 - i));

  const [
    published,
    comments,
    subscribers,
    pendingReview,
    pendingComments,
    pipelineRaw,
    categoryAgg,
    topArticles,
    recentArticles,
    pendingQueueRaw,
    viewsAgg,
    readingAgg,
  ] = await Promise.all([
    Article.countDocuments({ status: "published" }),
    Comment.countDocuments(),
    Newsletter.countDocuments({ isActive: true }),
    Article.countDocuments({ status: "review" }),
    Comment.countDocuments({ isApproved: false }),
    Article.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 }, views: { $sum: "$views" } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Article.find({ status: "published" })
      .populate("category", "name color")
      .sort({ views: -1 })
      .limit(6)
      .select("title views status category")
      .lean(),
    Article.find()
      .populate("category", "name")
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("title status category updatedAt")
      .lean(),
    Article.find({ status: { $in: ["review", "scheduled"] } })
      .populate("category", "name color")
      .populate("authors", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status category authors readingTime updatedAt scheduledAt")
      .lean(),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: null, avg: { $avg: "$readingTime" } } },
    ]),
  ]);

  const periodQueries: Promise<number>[] = [];
  for (const start of dayStarts) {
    const end = new Date(start.getTime() + DAY_MS);
    periodQueries.push(
      countInRange(Article, "publishedAt", start, end, { status: "published" }),
      countInRange(Comment, "createdAt", start, end),
      countInRange(Newsletter, "subscribedAt", start, end, { isActive: true })
    );
  }

  const periodResults = await Promise.all(periodQueries);

  const articlesPerDay: number[] = [];
  const commentsPerDay: number[] = [];
  const subscribersPerDay: number[] = [];

  for (let i = 0; i < rangeDays; i++) {
    const base = i * 3;
    articlesPerDay.push(periodResults[base] ?? 0);
    commentsPerDay.push(periodResults[base + 1] ?? 0);
    subscribersPerDay.push(periodResults[base + 2] ?? 0);
  }

  const last7Articles = articlesPerDay.slice(-7).reduce((a, b) => a + b, 0);
  const prev7Articles = articlesPerDay.slice(0, 7).reduce((a, b) => a + b, 0);
  const last7Comments = commentsPerDay.slice(-7).reduce((a, b) => a + b, 0);
  const prev7Comments = commentsPerDay.slice(0, 7).reduce((a, b) => a + b, 0);
  const last7Subs = subscribersPerDay.slice(-7).reduce((a, b) => a + b, 0);
  const prev7Subs = subscribersPerDay.slice(0, 7).reduce((a, b) => a + b, 0);

  const totalViews = (viewsAgg[0] as { total?: number } | undefined)?.total ?? 0;
  const avgReadingTime = Math.round(
    (readingAgg[0] as { avg?: number } | undefined)?.avg ?? 0
  );

  const categoryIds = categoryAgg.map((c) => c._id);
  const categoriesDocs = await Category.find({ _id: { $in: categoryIds } })
    .select("name color")
    .lean();
  const catMap = Object.fromEntries(
    categoriesDocs.map((c) => [String(c._id), { name: c.name, color: c.color ?? "#1a3896" }])
  );

  const categories: CategoryStat[] = categoryAgg.map((row) => {
    const meta = catMap[String(row._id)] ?? { name: "Uncategorized", color: "#6b6b6b" };
    return {
      name: meta.name,
      count: row.count as number,
      views: row.views as number,
      color: meta.color,
    };
  });

  const statusLabels: Record<string, string> = {
    published: "Published",
    review: "In review",
    draft: "Drafts",
    scheduled: "Scheduled",
    archived: "Archived",
  };

  const pipeline: PipelineSlice[] = (pipelineRaw as { _id: string; count: number }[]).map(
    (row) => ({
      status: String(row._id ?? "unknown"),
      label: statusLabels[row._id] ?? String(row._id ?? "Unknown"),
      count: Number(row.count) || 0,
    })
  );

  const timeline: TimelinePoint[] = dayStarts.map((start, i) => ({
    date: start.toISOString(),
    label: formatDayLabel(start),
    articles: articlesPerDay[i] ?? 0,
    comments: commentsPerDay[i] ?? 0,
    subscribers: subscribersPerDay[i] ?? 0,
  }));

  const kpis: DashboardKpi[] = [
    {
      label: "Published articles",
      value: published,
      trend: trendPercent(last7Articles, prev7Articles),
      sparkline: buildSparkline(articlesPerDay),
    },
    {
      label: "Total readership",
      value: totalViews,
      trend: trendPercent(last7Articles, prev7Articles),
      sparkline: buildSparkline(articlesPerDay),
      format: "compact",
    },
    {
      label: "Newsletter subscribers",
      value: subscribers,
      trend: trendPercent(last7Subs, prev7Subs),
      sparkline: buildSparkline(subscribersPerDay),
    },
    {
      label: "Comments",
      value: comments,
      trend: trendPercent(last7Comments, prev7Comments),
      sparkline: buildSparkline(commentsPerDay),
    },
  ];

  const todayStart = daysAgo(0);
  const tomorrow = new Date(todayStart.getTime() + DAY_MS);
  const monthStart = daysAgo(30);
  const weekAgo = daysAgo(7);

  const [
    todayMetrics,
    monthlyNewSubscribers,
    scheduledCount,
    latestScheduled,
    recentPublished,
    recentEdits,
    recentEditorialUsers,
  ] = await Promise.all([
    getTodayMetrics(),
    countInRange(Newsletter, "subscribedAt", monthStart, tomorrow, { isActive: true }),
    Article.countDocuments({ status: "scheduled" }),
    Article.findOne({ status: "scheduled" })
      .populate("authors", "name")
      .sort({ updatedAt: -1 })
      .select("authors scheduledAt")
      .lean(),
    Article.find({ status: "published", publishedAt: { $gte: weekAgo } })
      .populate("authors", "name")
      .sort({ publishedAt: -1 })
      .limit(4)
      .select("title publishedAt authors")
      .lean(),
    Article.find({
      status: { $in: ["review", "draft"] },
      updatedAt: { $gte: daysAgo(5) },
    })
      .populate("authors", "name")
      .sort({ updatedAt: -1 })
      .limit(3)
      .select("title updatedAt authors status")
      .lean(),
    User.find({
      role: { $in: ["super_admin", "admin", "editor", "author", "contributor"] },
      createdAt: { $gte: daysAgo(30) },
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .select("name createdAt role")
      .lean(),
  ]);

  const scheduledPlanner =
    scheduledCount > 0
      ? {
          actor: firstAuthorName(latestScheduled?.authors) ?? "An editor",
          count: scheduledCount,
          nextAt: latestScheduled?.scheduledAt
            ? new Date(latestScheduled.scheduledAt)
            : now,
        }
      : undefined;

  const activityFeed = buildActivityFeed({
    recentPublished,
    recentEdits,
    recentUsers: recentEditorialUsers,
    pendingComments,
    scheduledPlanner,
    now,
  });

  const weeklyReport: WeeklyReport = {
    articlesPublished: last7Articles,
    commentsReceived: last7Comments,
    newSubscribers: last7Subs,
    topCategory: categories[0]?.name ?? "—",
    topArticleTitle: topArticles[0]?.title ?? "—",
    topArticleViews: topArticles[0]?.views ?? 0,
    pendingReview,
    pendingComments,
  };

  return {
    kpis,
    timeline,
    categories,
    pipeline,
    activityFeed,
    todayStats: todayMetrics,
    weeklyReport,
    totalComments: comments,
    scheduledCount,
    monthlyNewSubscribers,
    topArticles: topArticles.map((a) => ({
      _id: String(a._id),
      title: a.title,
      views: a.views ?? 0,
      category: (a.category as { name?: string } | null)?.name ?? "—",
      status: a.status,
    })),
    recentArticles: recentArticles.map((a) => ({
      _id: String(a._id),
      title: a.title,
      status: a.status,
      category: (a.category as { name?: string } | null)?.name ?? "—",
      updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : now.toISOString(),
    })),
    pendingArticles: pendingQueueRaw.map((a) => {
      const authors = a.authors as { name?: string }[] | undefined;
      const firstAuthor = Array.isArray(authors) ? authors[0]?.name : undefined;
      const categoryDoc = a.category as { name?: string; color?: string } | null;
      return {
        _id: String(a._id),
        title: a.title,
        status: a.status,
        category: categoryDoc?.name ?? "—",
        categoryColor: categoryDoc?.color ?? "#6b6b6b",
        authorName: firstAuthor ?? "—",
        readingTime: a.readingTime ?? 1,
        updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : now.toISOString(),
        scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString() : undefined,
      };
    }),
    totalViews,
    pendingReview,
    pendingComments,
    avgReadingTime,
  };
}
