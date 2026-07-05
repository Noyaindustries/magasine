"use client";

import type { ReactNode } from "react";
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
import type { AdminDashboardData, CategoryStat, PipelineSlice, TimelinePoint } from "@/lib/admin-dashboard";
import { MeasuredChart } from "@/components/admin/dashboard/MeasuredChart";
import {
  CHART_ANIMATION,
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
  PIPELINE_COLORS,
} from "@/lib/chart-theme";

function ChartEmpty({ message }: { message: string }) {
  return <p className="dash-chart-empty">{message}</p>;
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryStat }[];
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 13 }}>{row.name}</p>
      <p style={{ margin: 0, fontSize: 11, opacity: 0.85 }}>
        {row.count} articles · {row.views.toLocaleString()} views
      </p>
    </div>
  );
}

const axisTick = { fontSize: 11, fill: CHART_COLORS.muted };

export function PublishingChart({ timeline }: { timeline: TimelinePoint[] }) {
  return (
    <div className="dash-chart-card dash-chart-card--wide dash-chart-card--animate">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Editorial output</p>
          <h3 className="dash-chart-title">Publishing velocity</h3>
        </div>
        <div className="dash-chart-legend">
          <span className="dash-legend-item">
            <i style={{ background: CHART_COLORS.primary }} /> Articles
          </span>
          <span className="dash-legend-item">
            <i style={{ background: CHART_COLORS.gold }} /> Comments
          </span>
        </div>
      </div>
      <div className="dash-chart-body dash-chart-body--tall">
        {timeline.length === 0 ? (
          <ChartEmpty message="No publishing activity in the last 14 days." />
        ) : (
          <MeasuredChart tall>
              <ComposedChart data={timeline} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradArticles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCommentsLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CHART_COLORS.gold} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.gold} stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="4 6" />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div style={CHART_TOOLTIP_STYLE}>
                        {label ? (
                          <p style={{ margin: "0 0 8px", opacity: 0.65, fontSize: 11 }}>{label}</p>
                        ) : null}
                        {payload.map((entry) => (
                          <p
                            key={String(entry.dataKey)}
                            style={{ margin: "4px 0 0", color: entry.color, fontWeight: 600 }}
                          >
                            {entry.dataKey === "articles"
                              ? `Articles: ${entry.value}`
                              : `Comments: ${entry.value}`}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="articles"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  fill="url(#gradArticles)"
                  animationDuration={CHART_ANIMATION.duration}
                  animationEasing={CHART_ANIMATION.easing}
                />
                <Line
                  type="monotone"
                  dataKey="comments"
                  stroke="url(#gradCommentsLine)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS.gold, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: CHART_COLORS.gold }}
                  animationDuration={CHART_ANIMATION.duration + 200}
                  animationEasing={CHART_ANIMATION.easing}
                />
              </ComposedChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function CategoryTrafficChart({
  categories,
  onExportCsv,
}: {
  categories: CategoryStat[];
  onExportCsv?: () => void;
}) {
  const data = [...categories].sort((a, b) => b.views - a.views).slice(0, 8);

  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-2">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Audience</p>
          <h3 className="dash-chart-title">Traffic by category</h3>
        </div>
        {onExportCsv ? (
          <button
            type="button"
            className="card-act card-act--btn"
            onClick={onExportCsv}
            disabled={categories.length === 0}
          >
            Export CSV ↗
          </button>
        ) : null}
      </div>
      <div className="dash-chart-body">
        {data.length === 0 ? (
          <ChartEmpty message="No category traffic data yet." />
        ) : (
          <MeasuredChart>
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} strokeDasharray="4 6" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  tick={{ fontSize: 11, fill: "#3d3d3d", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CategoryTooltip />} cursor={{ fill: "rgba(26,56,150,0.05)" }} />
                <Bar
                  dataKey="views"
                  radius={[0, 8, 8, 0]}
                  barSize={16}
                  animationDuration={CHART_ANIMATION.barDuration}
                  animationEasing={CHART_ANIMATION.easing}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function CategoryChart({ categories }: { categories: CategoryStat[] }) {
  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-3">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Coverage</p>
          <h3 className="dash-chart-title">Articles by category</h3>
        </div>
      </div>
      <div className="dash-chart-body">
        {categories.length === 0 ? (
          <ChartEmpty message="No published articles by category yet." />
        ) : (
          <MeasuredChart>
              <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={CHART_COLORS.grid} horizontal={false} strokeDasharray="4 6" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CategoryTooltip />} cursor={{ fill: "rgba(26,56,150,0.05)" }} />
                <Bar
                  dataKey="count"
                  radius={[0, 8, 8, 0]}
                  barSize={14}
                  animationDuration={CHART_ANIMATION.barDuration}
                  animationEasing={CHART_ANIMATION.easing}
                >
                  {categories.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function PipelineChart({ pipeline }: { pipeline: PipelineSlice[] }) {
  const total = pipeline.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-1">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Workflow</p>
          <h3 className="dash-chart-title">Content pipeline</h3>
        </div>
      </div>
      <div className="dash-chart-body dash-chart-body--donut">
        {pipeline.length === 0 ? (
          <ChartEmpty message="No articles in the editorial pipeline." />
        ) : (
          <MeasuredChart>
              <PieChart>
                <defs>
                  {PIPELINE_COLORS.map((color, i) => (
                    <linearGradient key={color} id={`pipeGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={pipeline}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="56%"
                  outerRadius="84%"
                  paddingAngle={4}
                  stroke="none"
                  animationDuration={CHART_ANIMATION.pieDuration}
                  animationEasing={CHART_ANIMATION.easing}
                >
                  {pipeline.map((_, i) => (
                    <Cell key={i} fill={`url(#pipeGrad${i % PIPELINE_COLORS.length})`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value, name) => {
                    const n = typeof value === "number" ? value : 0;
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                    return [`${n} (${pct}%)`, String(name ?? "")];
                  }}
                />
              </PieChart>
          </MeasuredChart>
        )}
        {total > 0 && (
          <div className="dash-donut-center">
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        )}
      </div>
      <ul className="dash-pipeline-legend">
        {pipeline.map((slice, i) => (
          <li key={slice.status}>
            <i style={{ background: PIPELINE_COLORS[i % PIPELINE_COLORS.length] }} />
            <span>{slice.label}</span>
            <strong>{slice.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SubscriberChart({ timeline }: { timeline: TimelinePoint[] }) {
  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-4">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Growth</p>
          <h3 className="dash-chart-title">Newsletter sign-ups</h3>
        </div>
      </div>
      <div className="dash-chart-body">
        {timeline.length === 0 ? (
          <ChartEmpty message="No newsletter sign-ups in the last 14 days." />
        ) : (
          <MeasuredChart>
              <AreaChart data={timeline} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="4 6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_COLORS.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: CHART_COLORS.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="subscribers"
                  stroke={CHART_COLORS.green}
                  strokeWidth={2.5}
                  fill="url(#gradSubs)"
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

export function TopArticlesChart({
  articles,
}: {
  articles: AdminDashboardData["topArticles"];
}) {
  const data = articles.map((a) => ({
    ...a,
    shortTitle: a.title.length > 36 ? `${a.title.slice(0, 36)}…` : a.title,
  }));

  return (
    <div className="dash-chart-card dash-chart-card--wide dash-chart-card--animate dash-chart-card--delay-5">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Performance</p>
          <h3 className="dash-chart-title">Top stories by readership</h3>
        </div>
      </div>
      <div className="dash-chart-body">
        {data.length === 0 ? (
          <ChartEmpty message="No published articles with view data yet." />
        ) : (
          <MeasuredChart>
              <BarChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 52 }}>
                <defs>
                  <linearGradient id="gradTopViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={1} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.55} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="4 6" />
                <XAxis
                  dataKey="shortTitle"
                  tick={{ fontSize: 10, fill: CHART_COLORS.muted }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-24}
                  textAnchor="end"
                  height={72}
                />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value) => {
                    const n = typeof value === "number" ? value : 0;
                    return [n.toLocaleString(), "Views"];
                  }}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { title?: string })?.title ?? ""
                  }
                />
                <Bar
                  dataKey="views"
                  fill="url(#gradTopViews)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={40}
                  animationDuration={CHART_ANIMATION.barDuration}
                  animationEasing={CHART_ANIMATION.easing}
                />
              </BarChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}

export function TodayPulseChart({ timeline }: { timeline: TimelinePoint[] }) {
  const last7 = timeline.slice(-7);
  const data = last7.map((point) => ({ ...point }));

  return (
    <div className="dash-chart-card dash-chart-card--animate dash-chart-card--delay-2">
      <div className="dash-chart-header">
        <div>
          <p className="dash-chart-eyebrow">Live pulse</p>
          <h3 className="dash-chart-title">Reader activity</h3>
        </div>
        <div className="dash-chart-legend">
          <span className="dash-legend-item">
            <i style={{ background: CHART_COLORS.blue }} /> Engagement
          </span>
        </div>
      </div>
      <div className="dash-chart-body">
        {data.length === 0 ? (
          <ChartEmpty message="No reader activity data yet." />
        ) : (
          <MeasuredChart>
              <ComposedChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPulse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} strokeDasharray="4 6" />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="articles"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={2}
                  fill="url(#gradPulse)"
                  animationDuration={CHART_ANIMATION.duration}
                />
                <Bar
                  dataKey="comments"
                  fill={CHART_COLORS.purple}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={18}
                  opacity={0.85}
                  animationDuration={CHART_ANIMATION.barDuration}
                />
              </ComposedChart>
          </MeasuredChart>
        )}
      </div>
    </div>
  );
}
