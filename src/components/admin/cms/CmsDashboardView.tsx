"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminDashboardData, DashboardActivityItem } from "@/lib/admin-dashboard";
import {
  downloadWeeklyReport,
  exportCategoryTrafficCsv,
} from "@/lib/cms-dashboard-export";
import { CmsDashboardIcons } from "@/components/admin/cms/CmsIcons";
import { toast } from "@/lib/toast";

interface CmsDashboardViewProps {
  data: AdminDashboardData;
}

const KPI_TONES = ["k-red", "k-green", "k-amber", "k-blue"] as const;
const SPARK_COLORS = ["#1A3896", "#22C55E", "#C9A227", "#60A5FA"] as const;

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString("en-US");
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatScheduled(iso: string) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `Scheduled — ${day} ${time}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function avatarGradient(name: string) {
  const hues = ["#1A3896", "#22C55E", "#C9A227", "#60A5FA", "#8B5CF6", "#EC4899"];
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hues[code % hues.length]!;
  return `linear-gradient(135deg, ${hue}, #141829)`;
}

function StatusBadge({
  status,
  scheduledAt,
}: {
  status: string;
  scheduledAt?: string;
}) {
  if (status === "published") return <span className="badge b-pub">Published</span>;
  if (status === "review") return <span className="badge b-rev">In review</span>;
  if (status === "scheduled") {
    return (
      <span className="badge b-plan">
        {scheduledAt ? formatScheduled(scheduledAt) : "Scheduled"}
      </span>
    );
  }
  if (status === "draft") return <span className="badge b-draft">Draft</span>;
  return <span className="badge b-arch">{status}</span>;
}

function Sparkline({ values, color, id }: { values: number[]; color: string; id: string }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 120;
      const y = 28 - (v / max) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  const lastValue = values[values.length - 1] ?? 0;
  const lastX = 120;
  const lastY = 28 - (lastValue / max) * 22;
  const area = `0,30 0,${28 - ((values[0] ?? 0) / max) * 22} ${points} 120,30`;

  return (
    <svg viewBox="0 0 120 30" width="100%" height="30" overflow="visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill={`url(#${id})`} stroke="none" points={area} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        opacity="0.85"
      />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  );
}

function ActivityRow({ item }: { item: DashboardActivityItem }) {
  const inner = (
    <>
      <div className={`aico aico--${item.tone}`}>{item.icon}</div>
      <div>
        <div className="atxt">
          {item.actor && (
            <>
              <strong>{item.actor}</strong>{" "}
            </>
          )}
          {item.action}
          {item.subject && (
            <>
              {" "}
              {item.subjectEmphasis === "strong" ? (
                <strong>{item.subject}</strong>
              ) : (
                <em>{item.subject}</em>
              )}
            </>
          )}
        </div>
        <div className="atime">{formatRelative(item.at)}</div>
      </div>
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="aitem aitem--link">
        {inner}
      </Link>
    );
  }

  return <div className="aitem">{inner}</div>;
}

function PublishButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        });
        if (!res.ok) {
          toast.error("Failed to publish");
          return;
        }
        toast.success("Article published");
        router.refresh();
      } catch {
        toast.error("Failed to publish");
      }
    });
  };

  return (
    <button
      type="button"
      className="btn btn-red btn-sm"
      onClick={handlePublish}
      disabled={pending}
    >
      {pending ? "…" : "Publish"}
    </button>
  );
}

export function CmsDashboardView({ data }: CmsDashboardViewProps) {
  const maxCategoryViews = Math.max(...data.categories.map((c) => c.views), 1);

  const kpiCards = [
    {
      label: "Articles published",
      value: data.kpis[0]?.value ?? 0,
      trend: data.kpis[0]?.trend ?? 0,
      spark: data.kpis[0]?.sparkline ?? [0],
      format: "number" as const,
      trendSuffix: "vs last month",
    },
    {
      label: "Unique readers",
      value: data.totalViews,
      trend: data.kpis[1]?.trend ?? 0,
      spark: data.kpis[1]?.sparkline ?? [0],
      format: "compact" as const,
      trendSuffix: "this week",
    },
    {
      label: "Newsletter subscribers",
      value: data.kpis[2]?.value ?? 0,
      absoluteDelta: data.monthlyNewSubscribers,
      spark: data.kpis[2]?.sparkline ?? [0],
      format: "number" as const,
      trendSuffix: "this month",
    },
    {
      label: "Comments",
      value: data.kpis[3]?.value ?? data.totalComments,
      spark: data.kpis[3]?.sparkline ?? data.timeline.map((t) => t.comments),
      format: "number" as const,
      moderationCount: data.pendingComments,
    },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>(".cms-dashboard .bfill").forEach((el) => {
        const width = el.style.width;
        el.style.width = "0";
        window.requestAnimationFrame(() => {
          el.style.transition = "width 1s cubic-bezier(.4,0,.2,1)";
          el.style.width = width;
        });
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="view on cms-dashboard">
      <div className="cms-page-inner">
        <div className="qarow">
          <Link href="/admin/articles/new" className="qa">
            <div className="qaico qaico--red">
              <CmsDashboardIcons.edit size={14} aria-hidden />
            </div>
            Write an article
          </Link>
          <Link href="/admin/medias" className="qa">
            <div className="qaico qaico--blue">
              <CmsDashboardIcons.media size={14} aria-hidden />
            </div>
            Add media
          </Link>
          <Link href="/admin/newsletter" className="qa">
            <div className="qaico qaico--green">
              <CmsDashboardIcons.newsletter size={14} aria-hidden />
            </div>
            Send newsletter
          </Link>
          <Link href="/admin/comments" className="qa">
            <div className="qaico qaico--amber">
              <CmsDashboardIcons.comments size={14} aria-hidden />
            </div>
            {data.pendingComments} comment{data.pendingComments > 1 ? "s" : ""} to moderate
          </Link>
          <button
            type="button"
            className="qa qa--btn"
            onClick={() => downloadWeeklyReport(data.weeklyReport)}
          >
            <div className="qaico qaico--purple">
              <CmsDashboardIcons.report size={14} aria-hidden />
            </div>
            Weekly report
          </button>
        </div>

        <div className="kgrid">
          {kpiCards.map((kpi, index) => (
            <div key={kpi.label} className={`kpi ${KPI_TONES[index]}`}>
              <div className="klbl">{kpi.label}</div>
              <div className="kval">
                {kpi.format === "compact"
                  ? formatCompact(kpi.value)
                  : kpi.value.toLocaleString("en-US")}
              </div>
              <div className="kmeta">
                {"moderationCount" in kpi && kpi.moderationCount !== undefined ? (
                  <span className="kdelta dn">
                    ▼ {kpi.moderationCount} flagged{kpi.moderationCount > 1 ? "" : ""}
                  </span>
                ) : "absoluteDelta" in kpi && kpi.absoluteDelta !== undefined ? (
                  <span className={`kdelta ${kpi.absoluteDelta >= 0 ? "up" : "dn"}`}>
                    {kpi.absoluteDelta >= 0 ? "▲" : "▼"}{" "}
                    {kpi.absoluteDelta >= 0 ? "+" : ""}
                    {kpi.absoluteDelta.toLocaleString("en-US")}
                  </span>
                ) : (
                  <span className={`kdelta ${(kpi.trend ?? 0) >= 0 ? "up" : "dn"}`}>
                    {(kpi.trend ?? 0) >= 0 ? "▲" : "▼"}{" "}
                    {(kpi.trend ?? 0) >= 0 ? "+" : ""}
                    {Math.abs(kpi.trend ?? 0)}%
                  </span>
                )}
                {"moderationCount" in kpi
                  ? " to moderate"
                  : "trendSuffix" in kpi
                    ? ` ${kpi.trendSuffix}`
                    : null}
              </div>
              <div className="kspark">
                <Sparkline
                  values={kpi.spark}
                  color={SPARK_COLORS[index] ?? SPARK_COLORS[0]}
                  id={`cms-spark-${index}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="g21 ga mb20">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Traffic by category — last 7 days</span>
              <button
                type="button"
                className="card-act card-act--btn"
                onClick={() => exportCategoryTrafficCsv(data.categories)}
                disabled={data.categories.length === 0}
              >
                Export CSV ↗
              </button>
            </div>
            <div className="card-body">
              {data.categories.length === 0 && (
                <p className="cms-empty">No category data yet.</p>
              )}
              {data.categories.map((cat) => (
                <div key={cat.name} className="brow">
                  <span className="blbl">{cat.name}</span>
                  <div className="btrack">
                    <div
                      className="bfill"
                      style={{
                        width: `${Math.round((cat.views / maxCategoryViews) * 100)}%`,
                        background: cat.color,
                      }}
                    />
                  </div>
                  <span className="bnum">{cat.views.toLocaleString("en-US")}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent activity</span>
              <Link href="/admin/articles" className="card-act">
                View all
              </Link>
            </div>
            <div className="card-body cms-activity-body">
              {data.activityFeed.length === 0 && (
                <p className="cms-empty">No recent activity.</p>
              )}
              {data.activityFeed.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Articles awaiting approval</span>
            <Link href="/admin/articles" className="card-act">
              View all articles →
            </Link>
          </div>
          <div className="card-np">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Title &amp; Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingArticles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="cms-empty-cell">
                      No articles pending.
                    </td>
                  </tr>
                )}
                {data.pendingArticles.map((article) => (
                  <tr key={article._id}>
                    <td>
                      <div className="tc-main">{article.title}</div>
                      <div className="tc-sub">
                        {article.category} · {article.readingTime} min ·{" "}
                        <span style={{ color: article.categoryColor }}>{article.category}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cms-author-cell">
                        <div className="av" style={{ background: avatarGradient(article.authorName) }}>
                          {initials(article.authorName)}
                        </div>
                        <span>{article.authorName}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={article.status} scheduledAt={article.scheduledAt} />
                    </td>
                    <td className="tc-muted">{formatRelative(article.updatedAt)}</td>
                    <td>
                      <div className="cms-row-actions">
                        {article.status === "review" && (
                          <PublishButton articleId={article._id} />
                        )}
                        {article.status === "scheduled" ? (
                          <Link href={`/admin/articles/${article._id}`} className="btn btn-out btn-sm">
                            View
                          </Link>
                        ) : null}
                        <Link href={`/admin/articles/${article._id}`} className="btn btn-ghost btn-sm">
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
