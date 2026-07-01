import { Suspense } from "react";
import { getAdminAnalyticsData } from "@/lib/admin-analytics";
import { CmsAnalyticsView } from "@/components/admin/cms/CmsAnalyticsView";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

function AnalyticsFallback() {
  return (
    <div className="cms-page" style={{ padding: "2rem" }}>
      <p className="dash-chart-empty">Loading analytics…</p>
    </div>
  );
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const { period } = await searchParams;
  const data = await getAdminAnalyticsData(period);

  return (
    <Suspense fallback={<AnalyticsFallback />}>
      <CmsAnalyticsView data={data} />
    </Suspense>
  );
}
