import type { AdminDashboardData, CategoryStat, WeeklyReport } from "@/lib/admin-dashboard";
import { SITE_NAME } from "@/lib/site";

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function exportCategoryTrafficCsv(categories: CategoryStat[]) {
  const header = "Category,Articles,Views";
  const rows = categories.map(
    (cat) => `${escapeCsv(cat.name)},${cat.count},${cat.views}`
  );
  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(`category-traffic-${date}.csv`, csv, "text/csv;charset=utf-8");
}

export function downloadWeeklyReport(report: WeeklyReport) {
  const lines = [
    `Weekly report — ${SITE_NAME} CMS`,
    `Generated on ${new Date().toLocaleString("en-US")}`,
    "",
    `Articles published (7 d): ${report.articlesPublished}`,
    `Comments received (7 d): ${report.commentsReceived}`,
    `New newsletter subscribers (7 d): ${report.newSubscribers}`,
    `Top category: ${report.topCategory}`,
    `Top article: ${report.topArticleTitle} (${report.topArticleViews.toLocaleString("en-US")} views)`,
    "",
    `In review: ${report.pendingReview}`,
    `Comments to moderate: ${report.pendingComments}`,
  ];
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(`weekly-report-${date}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}

export function buildWeeklyReportSummary(data: AdminDashboardData) {
  return data.weeklyReport;
}
