"use client";

import { CmsPage } from "@/components/admin/cms/CmsPage";
import { exportCategoryTrafficCsv } from "@/lib/cms-dashboard-export";
import type { AnalyticsOverview } from "@/lib/cms-analytics";
import { useSiteBranding } from "@/components/SiteBranding";

interface CmsAnalyticsViewProps {
  data: AnalyticsOverview;
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString("en-US");
}

export function CmsAnalyticsView({ data }: CmsAnalyticsViewProps) {
  const { siteName } = useSiteBranding();
  const avgMinutes = Math.floor(data.avgReadingMinutes);
  const avgSeconds = Math.round((data.avgReadingMinutes - avgMinutes) * 60);

  const exportCsv = () => {
    exportCategoryTrafficCsv(
      data.categoryTraffic.map((row) => ({
        name: row.label,
        count: 0,
        views: row.value,
        color: row.color,
      }))
    );
  };

  const downloadReport = () => {
    const lines = [
      `Analytics report — ${siteName}`,
      `Page views: ${data.pageViews}`,
      `Estimated readers: ${data.uniqueReaders}`,
      `Bounce rate: ${data.bounceRate}%`,
      "",
      ...data.categoryTraffic.map((r) => `${r.label}: ${r.value} views`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Analytics</div>
          <div className="vh2">Editorial performance — aggregated from article views</div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" onClick={exportCsv}>
            Export CSV ↗
          </button>
          <button type="button" className="btn btn-gold" onClick={downloadReport}>
            Weekly report
          </button>
        </div>
      </div>

      <div className="kgrid mb20">
        <div className="kpi k-red">
          <div className="klbl">Page views</div>
          <div className="kval">{formatCompact(data.pageViews)}</div>
          <div className="kmeta">
            <span className="kdelta up">
              ▲ {data.weekViewsDelta > 0 ? "+" : ""}
              {data.weekViewsDelta}%
            </span>{" "}
            vs last week
          </div>
        </div>
        <div className="kpi k-green">
          <div className="klbl">Estimated readers</div>
          <div className="kval">{formatCompact(data.uniqueReaders)}</div>
        </div>
        <div className="kpi k-amber">
          <div className="klbl">Average time</div>
          <div className="kval">
            {avgMinutes}:{String(avgSeconds).padStart(2, "0")}
          </div>
        </div>
        <div className="kpi k-blue">
          <div className="klbl">Bounce rate</div>
          <div className="kval">{data.bounceRate}%</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Traffic by category</span>
          <button type="button" className="card-act" onClick={exportCsv}>
            Export CSV ↗
          </button>
        </div>
        <div className="card-body">
          {data.categoryTraffic.map((row) => (
            <div key={row.label} className="brow">
              <span className="blbl">{row.label}</span>
              <div className="btrack">
                <div
                  className="bfill"
                  style={{
                    width: `${row.pct}%`,
                    background: row.color,
                    opacity: row.pct < 25 ? 0.5 : 1,
                  }}
                />
              </div>
              <span className="bnum">{row.value.toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
      </div>
    </CmsPage>
  );
}
