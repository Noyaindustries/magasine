import type { AdminAnalyticsData } from "@/lib/admin-analytics";
import { SITE_NAME } from "@/lib/site";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportAnalyticsCsv(data: AdminAnalyticsData) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    "Metric,Value",
    ...data.kpis.map((kpi) => `${escapeCsv(kpi.label)},${kpi.value}`),
    "",
    "Date,Page views,Comments,Subscribers,Registrations,Publications",
    ...data.timeline.map(
      (row) =>
        `${escapeCsv(row.label)},${row.pageViews},${row.comments},${row.subscribers},${row.registrations},${row.publications}`,
    ),
    "",
    "Category,Articles,Views,Avg views,Share %",
    ...data.categories.map(
      (cat) =>
        `${escapeCsv(cat.name)},${cat.articles},${cat.views},${cat.avgViews},${cat.sharePct}`,
    ),
    "",
    "Article,Category,Format,Views,Reading time",
    ...data.topArticles.map(
      (a) =>
        `${escapeCsv(a.title)},${escapeCsv(a.category)},${a.contentType},${a.views},${a.readingTime}`,
    ),
  ];
  downloadBlob(
    `analytics-${data.period}d-${date}.csv`,
    lines.join("\n"),
    "text/csv;charset=utf-8",
  );
}

export function downloadAnalyticsReport(data: AdminAnalyticsData) {
  const lines = [
    `Analytics report — ${SITE_NAME}`,
    `Period: last ${data.period} days`,
    `Generated: ${new Date(data.generatedAt).toLocaleString("en-US")}`,
    data.trackingSince ? `Daily tracking since: ${data.trackingSince}` : "",
    "",
    "— Key metrics —",
    ...data.kpis.map(
      (kpi) =>
        `${kpi.label}: ${kpi.value.toLocaleString("en-US")}${kpi.trend !== 0 ? ` (${kpi.trend > 0 ? "+" : ""}${kpi.trend}% vs prev.)` : ""}`,
    ),
    "",
    "— Engagement —",
    `Avg views per article: ${data.engagement.avgViewsPerArticle}`,
    `Comments per article: ${data.engagement.commentsPerArticle}`,
    `Premium traffic share: ${data.engagement.premiumSharePct}%`,
    `Active subscribers: ${data.engagement.newsletterActive}`,
    `Registered readers: ${data.engagement.registeredReaders}`,
    "",
    "— Top articles —",
    ...data.topArticles.map(
      (a, i) =>
        `${i + 1}. ${a.title} — ${a.views.toLocaleString("en-US")} views (${a.category})`,
    ),
  ].filter(Boolean);

  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(
    `analytics-report-${data.period}d-${date}.txt`,
    lines.join("\n"),
    "text/plain;charset=utf-8",
  );
}
