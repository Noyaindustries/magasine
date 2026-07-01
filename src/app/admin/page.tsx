import { getAdminDashboardData } from "@/lib/admin-dashboard";
import { CmsDashboardView } from "@/components/admin/cms/CmsDashboardView";
import { auth } from "@/lib/auth";
import type { AdminDashboardData } from "@/lib/admin-dashboard";

const EMPTY_DASHBOARD: AdminDashboardData = {
  kpis: [],
  timeline: [],
  categories: [],
  pipeline: [],
  topArticles: [],
  recentArticles: [],
  pendingArticles: [],
  activityFeed: [],
  todayStats: {
    publishedToday: 0,
    commentsToday: 0,
    subscribersToday: 0,
    uniqueReadersToday: 0,
  },
  weeklyReport: {
    articlesPublished: 0,
    commentsReceived: 0,
    newSubscribers: 0,
    topCategory: "—",
    topArticleTitle: "—",
    topArticleViews: 0,
    pendingReview: 0,
    pendingComments: 0,
  },
  totalComments: 0,
  totalViews: 0,
  pendingReview: 0,
  pendingComments: 0,
  scheduledCount: 0,
  monthlyNewSubscribers: 0,
  avgReadingTime: 0,
};

export default async function AdminDashboard() {
  const session = await auth();
  let data = EMPTY_DASHBOARD;

  try {
    data = await getAdminDashboardData();
  } catch (error) {
    console.error("[admin/dashboard] Failed to load metrics:", error);
  }

  return (
    <CmsDashboardView
      data={data}
      userName={session?.user?.name ?? "Editor"}
    />
  );
}
