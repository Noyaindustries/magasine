"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  AnalyticsCategoryRow,
  AnalyticsContentTypeRow,
  AnalyticsTimelinePoint,
  AnalyticsTopArticle,
} from "@/lib/admin-analytics";
import { MeasuredChart } from "@/components/admin/dashboard/MeasuredChart";
import {
  CHART_ANIMATION,
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
} from "@/lib/chart-theme";

function ChartEmpty({ message }: { message: string }) {
  return <p className="dash-chart-empty">{message}</p>;
}

const axisTick = { fontSize: 11, fill: CHART_COLORS.muted };

const CONTENT_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.gold,
  CHART_COLORS.green,
  CHART_COLORS.purple,
];

export function AnalyticsTrafficChart({
  timeline,
}: {
  timeline: AnalyticsTimelinePoint[];
}) {
  const hasData = timeline.some((p) => p.pageViews > 0);

  return (
    <div className="dash-chart-card dash-chart-card--wide dash-chart-card--animate">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Audience</p>
          <h3 className="dash-chart-title">Daily page views</h3>
        </div>
      </div>
      <div className="dash-chart-body dash-chart-body--tall">
        {!hasData ? (
          <ChartEmpty message="Page view tracking starts from the first article read after this update." />
        ) : (
          <MeasuredChart tall>
            <AreaChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsViewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis tick={axisTick} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value) => [
                  Number(value ?? 0).toLocaleString("en-US"),
                  "Views",
                ]}
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                stroke={CHART_COLORS.primary}
                strokeWidth={2.5}
                fill="url(#analyticsViewsGrad)"
                animationDuration={CHART_ANIMATION.duration}
                animationEasing={CHART_ANIMATION.easing}
              />
            </AreaChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function AnalyticsEngagementChart({
  timeline,
}: {
  timeline: AnalyticsTimelinePoint[];
}) {
  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-1">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Engagement</p>
          <h3 className="dash-chart-title">Comments & growth</h3>
        </div>
        <div className="dash-chart-legend">
          <span className="dash-legend-item">
            <i style={{ background: CHART_COLORS.gold }} /> Comments
          </span>
          <span className="dash-legend-item">
            <i style={{ background: CHART_COLORS.green }} /> Subscribers
          </span>
          <span className="dash-legend-item">
            <i style={{ background: CHART_COLORS.blue }} /> Readers
          </span>
        </div>
      </div>
      <div className="dash-chart-body dash-chart-body--tall">
        <MeasuredChart tall>
          <ComposedChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={32} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
              dataKey="comments"
              fill={CHART_COLORS.gold}
              radius={[4, 4, 0, 0]}
              animationDuration={CHART_ANIMATION.barDuration}
            />
            <Line
              type="monotone"
              dataKey="subscribers"
              stroke={CHART_COLORS.green}
              strokeWidth={2}
              dot={false}
              animationDuration={CHART_ANIMATION.duration}
            />
            <Line
              type="monotone"
              dataKey="registrations"
              stroke={CHART_COLORS.blue}
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 4"
              animationDuration={CHART_ANIMATION.duration}
            />
          </ComposedChart>
        </MeasuredChart>
      </div>
    </div>
  );
}

export function AnalyticsPublishingChart({
  timeline,
}: {
  timeline: AnalyticsTimelinePoint[];
}) {
  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-2">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Editorial</p>
          <h3 className="dash-chart-title">Publications per day</h3>
        </div>
      </div>
      <div className="dash-chart-body">
        <MeasuredChart>
          <BarChart data={timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar
              dataKey="publications"
              fill={CHART_COLORS.primary}
              radius={[4, 4, 0, 0]}
              animationDuration={CHART_ANIMATION.barDuration}
            />
          </BarChart>
        </MeasuredChart>
      </div>
    </div>
  );
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: AnalyticsCategoryRow }[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{row.name}</p>
      <p style={{ margin: 0, fontSize: 11, opacity: 0.85 }}>
        {row.views.toLocaleString("en-US")} views · {row.sharePct}% of traffic
      </p>
    </div>
  );
}

export function AnalyticsCategoryChart({
  categories,
}: {
  categories: AnalyticsCategoryRow[];
}) {
  const data = categories.slice(0, 8);

  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-3">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Distribution</p>
          <h3 className="dash-chart-title">Views by category</h3>
        </div>
      </div>
      <div className="dash-chart-body dash-chart-body--tall">
        {data.length === 0 ? (
          <ChartEmpty message="No published articles yet." />
        ) : (
          <MeasuredChart tall>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" tick={axisTick} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={88}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar
                dataKey="views"
                radius={[0, 4, 4, 0]}
                animationDuration={CHART_ANIMATION.barDuration}
              >
                {data.map((entry) => (
                  <Cell key={entry.slug} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function AnalyticsContentTypeChart({
  contentTypes,
}: {
  contentTypes: AnalyticsContentTypeRow[];
}) {
  const data = contentTypes.filter((row) => row.views > 0);

  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-4">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Formats</p>
          <h3 className="dash-chart-title">Views by content type</h3>
        </div>
      </div>
      <div className="dash-chart-body dash-chart-body--donut">
        {data.length === 0 ? (
          <ChartEmpty message="No view data by format yet." />
        ) : (
          <MeasuredChart height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="views"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius="52%"
                outerRadius="78%"
                paddingAngle={2}
                animationDuration={CHART_ANIMATION.pieDuration}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.type}
                    fill={CONTENT_COLORS[index % CONTENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            </PieChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function AnalyticsTopArticlesTable({
  articles,
}: {
  articles: AnalyticsTopArticle[];
}) {
  if (articles.length === 0) {
    return <p className="dash-chart-empty">No published articles yet.</p>;
  }

  return (
    <div className="analytics-top-table-wrap">
      <table className="analytics-top-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Category</th>
            <th>Format</th>
            <th>Views</th>
            <th>Read time</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article, index) => (
            <tr key={article._id}>
              <td>
                <span className="analytics-rank">{index + 1}</span>
                <Link href={`/article/${article.slug}`} className="analytics-article-link">
                  {article.title}
                </Link>
                {article.isPremium && <span className="analytics-premium-badge">Premium</span>}
              </td>
              <td>
                <span
                  className="analytics-cat-dot"
                  style={{ background: article.categoryColor }}
                />
                {article.category}
              </td>
              <td className="analytics-format">{article.contentType}</td>
              <td className="analytics-views">{article.views.toLocaleString("en-US")}</td>
              <td>{article.readingTime} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
