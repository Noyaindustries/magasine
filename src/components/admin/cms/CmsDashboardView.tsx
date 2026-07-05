"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Eye, MessageSquare, Sparkles } from "lucide-react";
import type { AdminDashboardData, DashboardActivityItem } from "@/lib/admin-dashboard";
import {
  downloadWeeklyReport,
  exportCategoryTrafficCsv,
} from "@/lib/cms-dashboard-export";
import { CmsDashboardIcons } from "@/components/admin/cms/CmsIcons";
import { DashboardKpiCard } from "@/components/admin/dashboard/DashboardKpiCard";
import {
  CategoryChart,
  CategoryTrafficChart,
  PipelineChart,
  PublishingChart,
  SubscriberChart,
  TodayPulseChart,
  TopArticlesChart,
} from "@/components/admin/dashboard/DashboardCharts";
import { toast } from "@/lib/toast";

interface CmsDashboardViewProps {
  data: AdminDashboardData;
  userName: string;
  todayLabel: string;
}

const KPI_ACCENTS = ["#1a3896", "#22C55E", "#C9A227", "#9B2226"];

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
        <div className="atime" suppressHydrationWarning>{formatRelative(item.at)}</div>
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

export function CmsDashboardView({ data, userName, todayLabel }: CmsDashboardViewProps) {

  const kpiCards = [
    {
      label: "Articles published",
      value: data.kpis[0]?.value ?? 0,
      trend: data.kpis[0]?.trend ?? 0,
      spark: data.kpis[0]?.sparkline ?? [0],
      format: "number" as const,
    },
    {
      label: "Total readership",
      value: data.totalViews,
      trend: data.kpis[1]?.trend ?? 0,
      spark: data.kpis[1]?.sparkline ?? [0],
      format: "compact" as const,
    },
    {
      label: "Newsletter subscribers",
      value: data.kpis[2]?.value ?? 0,
      spark: data.kpis[2]?.sparkline ?? [0],
      format: "number" as const,
      trendOverride: {
        text: `+${data.monthlyNewSubscribers} this month`,
        direction: data.monthlyNewSubscribers > 0 ? ("up" as const) : ("flat" as const),
      },
    },
    {
      label: "Comments",
      value: data.kpis[3]?.value ?? data.totalComments,
      spark: data.kpis[3]?.sparkline ?? data.timeline.map((t) => t.comments),
      format: "number" as const,
      trendOverride: {
        text: `${data.pendingComments} to moderate`,
        direction: data.pendingComments > 0 ? ("down" as const) : ("flat" as const),
      },
    },
  ];

  return (
    <div className="view on cms-dashboard">
      <div className="cms-page-inner dash-root">
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

        <section className="dash-hero">
          <div className="dash-hero-mesh" aria-hidden />
          <div className="dash-hero-inner">
            <div>
              <p className="dash-hero-eyebrow">
                <Sparkles className="w-4 h-4" aria-hidden />
                Editorial intelligence
              </p>
              <h2 className="dash-hero-title">
                Good day, <em>{userName.split(" ")[0]}</em>
              </h2>
              <p className="dash-hero-date">{todayLabel}</p>
            </div>
            <div className="dash-hero-metrics">
              <div className="dash-hero-metric">
                <Eye className="w-4 h-4" aria-hidden />
                <span>{data.totalViews.toLocaleString()}</span>
                <small>Total views</small>
              </div>
              <div className="dash-hero-metric">
                <Clock className="w-4 h-4" aria-hidden />
                <span>{data.avgReadingTime} min</span>
                <small>Avg. read time</small>
              </div>
              <div className="dash-hero-metric">
                <MessageSquare className="w-4 h-4" aria-hidden />
                <span>{data.pendingReview}</span>
                <small>In review</small>
              </div>
            </div>
          </div>
        </section>

        {(data.pendingReview > 0 || data.pendingComments > 0) && (
          <div className="dash-alerts">
            {data.pendingReview > 0 && (
              <Link href="/admin/review" className="dash-alert dash-alert--gold">
                <strong>{data.pendingReview}</strong> article(s) awaiting review
              </Link>
            )}
            {data.pendingComments > 0 && (
              <Link href="/admin/comments" className="dash-alert dash-alert--blue">
                <strong>{data.pendingComments}</strong> comment(s) to moderate
              </Link>
            )}
          </div>
        )}

        <section className="dash-kpi-grid">
          {kpiCards.map((kpi, index) => (
            <DashboardKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              trend={kpi.trend}
              sparkline={kpi.spark}
              format={kpi.format}
              accent={KPI_ACCENTS[index] ?? KPI_ACCENTS[0]}
              trendOverride={"trendOverride" in kpi ? kpi.trendOverride : undefined}
            />
          ))}
        </section>

        <section className="dash-charts-grid">
          <PublishingChart timeline={data.timeline} />
          <PipelineChart pipeline={data.pipeline} />
          <CategoryTrafficChart
            categories={data.categories}
            onExportCsv={() => exportCategoryTrafficCsv(data.categories)}
          />
          <CategoryChart categories={data.categories} />
          <SubscriberChart timeline={data.timeline} />
          <TopArticlesChart articles={data.topArticles} />
        </section>

        <div className="g21 ga mb20">
          <TodayPulseChart timeline={data.timeline} />

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
                    <td className="tc-muted" suppressHydrationWarning>{formatRelative(article.updatedAt)}</td>
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
