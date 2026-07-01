"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  BarChart3,
  Eye,
  MessageSquare,
  Newspaper,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import type { AdminAnalyticsData, AnalyticsPeriod } from "@/lib/admin-analytics";
import {
  AnalyticsCategoryChart,
  AnalyticsContentTypeChart,
  AnalyticsEngagementChart,
  AnalyticsPublishingChart,
  AnalyticsTopArticlesTable,
  AnalyticsTrafficChart,
} from "@/components/admin/analytics/AnalyticsCharts";
import {
  downloadAnalyticsReport,
  exportAnalyticsCsv,
} from "@/lib/analytics-export";
import { toast } from "@/lib/toast";

interface CmsAnalyticsViewProps {
  data: AdminAnalyticsData;
}

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const KPI_ICONS: Record<string, typeof Eye> = {
  pageViews: Eye,
  totalViews: BarChart3,
  comments: MessageSquare,
  subscribers: Newspaper,
  registrations: Users,
  readingTime: Timer,
};

function formatKpiValue(
  value: number,
  format?: "number" | "compact" | "percent" | "duration",
) {
  if (format === "compact") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  }
  if (format === "duration") return `${value} min`;
  if (format === "percent") return `${value}%`;
  return value.toLocaleString("en-US");
}

export function CmsAnalyticsView({ data }: CmsAnalyticsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setPeriod = useCallback(
    (period: AnalyticsPeriod) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("period", String(period));
      router.push(`/admin/analytics?${params.toString()}`);
    },
    [router, searchParams],
  );

  const handleCsv = () => {
    exportAnalyticsCsv(data);
    toast.success("Analytics CSV downloaded");
  };

  const handleReport = () => {
    downloadAnalyticsReport(data);
    toast.success("Analytics report downloaded");
  };

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Analytics</div>
          <div className="vh2">
            Editorial performance, audience traffic, and engagement — real data from your CMS
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" onClick={handleCsv}>
            Export CSV ↗
          </button>
          <button type="button" className="btn btn-gold" onClick={handleReport}>
            Full report
          </button>
        </div>
      </div>

      <div className="analytics-period-bar">
        {PERIODS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`analytics-period-btn${data.period === item.value ? " is-active" : ""}`}
            onClick={() => setPeriod(item.value)}
          >
            {item.label}
          </button>
        ))}
        {data.trackingSince && (
          <span className="analytics-tracking-note">
            Daily views tracked since {data.trackingSince}
          </span>
        )}
      </div>

      <div className="analytics-kpi-grid">
        {data.kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.id] ?? TrendingUp;
          return (
            <div key={kpi.id} className="analytics-kpi-card">
              <div className="analytics-kpi-icon">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <div className="analytics-kpi-body">
                <p className="analytics-kpi-label">{kpi.label}</p>
                <p className="analytics-kpi-value">{formatKpiValue(kpi.value, kpi.format)}</p>
                {kpi.trend !== 0 && kpi.id !== "readingTime" && (
                  <p className={`analytics-kpi-trend${kpi.trend > 0 ? " up" : " down"}`}>
                    {kpi.trend > 0 ? "▲" : "▼"} {Math.abs(kpi.trend)}% vs previous period
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="analytics-engagement-strip">
        <div className="analytics-engagement-item">
          <span className="analytics-engagement-val">
            {data.engagement.avgViewsPerArticle.toLocaleString("en-US")}
          </span>
          <span className="analytics-engagement-lbl">Avg views / article</span>
        </div>
        <div className="analytics-engagement-item">
          <span className="analytics-engagement-val">{data.engagement.commentsPerArticle}</span>
          <span className="analytics-engagement-lbl">Comments / article</span>
        </div>
        <div className="analytics-engagement-item">
          <span className="analytics-engagement-val">{data.engagement.premiumSharePct}%</span>
          <span className="analytics-engagement-lbl">Premium traffic</span>
        </div>
        <div className="analytics-engagement-item">
          <span className="analytics-engagement-val">
            {data.engagement.newsletterActive.toLocaleString("en-US")}
          </span>
          <span className="analytics-engagement-lbl">Newsletter subscribers</span>
        </div>
        <div className="analytics-engagement-item">
          <span className="analytics-engagement-val">
            {data.engagement.registeredReaders.toLocaleString("en-US")}
          </span>
          <span className="analytics-engagement-lbl">Registered readers</span>
        </div>
      </div>

      <AnalyticsTrafficChart timeline={data.timeline} />

      <div className="dash-charts-grid analytics-charts-grid">
        <AnalyticsEngagementChart timeline={data.timeline} />
        <AnalyticsPublishingChart timeline={data.timeline} />
        <AnalyticsCategoryChart categories={data.categories} />
        <AnalyticsContentTypeChart contentTypes={data.contentTypes} />
      </div>

      <div className="card analytics-top-card">
        <div className="card-header">
          <span className="card-title">Top performing articles</span>
          <Link href="/admin/articles" className="card-act">
            All articles →
          </Link>
        </div>
        <div className="card-body analytics-top-card-body">
          <AnalyticsTopArticlesTable articles={data.topArticles} />
        </div>
      </div>
    </CmsPage>
  );
}
