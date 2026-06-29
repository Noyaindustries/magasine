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
  const header = "Rubrique,Articles,Vues";
  const rows = categories.map(
    (cat) => `${escapeCsv(cat.name)},${cat.count},${cat.views}`
  );
  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(`trafic-rubriques-${date}.csv`, csv, "text/csv;charset=utf-8");
}

export function downloadWeeklyReport(report: WeeklyReport) {
  const lines = [
    `Rapport hebdomadaire — ${SITE_NAME} CMS`,
    `Généré le ${new Date().toLocaleString("fr-FR")}`,
    "",
    `Articles publiés (7 j) : ${report.articlesPublished}`,
    `Commentaires reçus (7 j) : ${report.commentsReceived}`,
    `Nouveaux abonnés newsletter (7 j) : ${report.newSubscribers}`,
    `Rubrique la plus lue : ${report.topCategory}`,
    `Article le plus lu : ${report.topArticleTitle} (${report.topArticleViews.toLocaleString("fr-FR")} vues)`,
    "",
    `En révision : ${report.pendingReview}`,
    `Commentaires à modérer : ${report.pendingComments}`,
  ];
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(`rapport-hebdo-${date}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
}

export function buildWeeklyReportSummary(data: AdminDashboardData) {
  return data.weeklyReport;
}
