"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Clock,
  Eye,
  FileText,
  Home,
  MessageSquare,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { AdminDashboardData } from "@/lib/admin-dashboard";
import type { HomeSectionId } from "@/lib/homepage-sections";
import { DashboardKpiCard } from "@/components/admin/dashboard/DashboardKpiCard";
import {
  CategoryChart,
  PipelineChart,
  PublishingChart,
  SubscriberChart,
  TopArticlesChart,
} from "@/components/admin/dashboard/DashboardCharts";

const KPI_ACCENTS = ["#1a3896", "#c9a227", "#2D6A4F", "#9B2226"];

type DashboardHomepageSection = {
  id: HomeSectionId;
  label: string;
  enabled: boolean;
  count: number;
};

interface AdminDashboardViewProps {
  data: AdminDashboardData;
  userName: string;
  homepageSections?: DashboardHomepageSection[];
  canEditHome: boolean;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminDashboardView({
  data,
  userName,
  homepageSections,
  canEditHome,
}: AdminDashboardViewProps) {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dash-root">
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
            <p className="dash-hero-date">{today}</p>
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
              <FileText className="w-4 h-4" aria-hidden />
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
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          )}
          {data.pendingComments > 0 && (
            <Link href="/admin/comments" className="dash-alert dash-alert--blue">
              <strong>{data.pendingComments}</strong> comment(s) to moderate
              <MessageSquare className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      <section className="dash-kpi-grid">
        {data.kpis.map((kpi, i) => (
          <DashboardKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            sparkline={kpi.sparkline}
            format={kpi.format}
            accent={KPI_ACCENTS[i % KPI_ACCENTS.length]}
          />
        ))}
      </section>

      <section className="dash-charts-grid">
        <PublishingChart timeline={data.timeline} />
        <PipelineChart pipeline={data.pipeline} />
        <CategoryChart categories={data.categories} />
        <SubscriberChart timeline={data.timeline} />
        <TopArticlesChart articles={data.topArticles} />
      </section>

      <section className="dash-bottom-grid">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <p className="dash-chart-eyebrow">Newsroom</p>
              <h3 className="dash-panel-title">Recent activity</h3>
            </div>
            <Link href="/admin/articles" className="dash-panel-link">
              All articles <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ul className="dash-activity-list">
            {data.recentArticles.map((article) => (
              <li key={article._id}>
                <Link href={`/admin/articles/${article._id}`} className="dash-activity-row">
                  <div className="dash-activity-icon">
                    <PenLine className="w-4 h-4" />
                  </div>
                  <div className="dash-activity-body">
                    <p className="dash-activity-title">{article.title}</p>
                    <p className="dash-activity-meta">
                      {article.category} · <span className={`dash-status dash-status--${article.status}`}>{article.status}</span>
                    </p>
                  </div>
                  <time className="dash-activity-time">{formatRelative(article.updatedAt)}</time>
                </Link>
              </li>
            ))}
            {data.recentArticles.length === 0 && (
              <li className="dash-empty">No articles yet.</li>
            )}
          </ul>
        </div>

        {canEditHome && homepageSections && (
          <div className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <p className="dash-chart-eyebrow">Homepage</p>
                <h3 className="dash-panel-title">Live sections</h3>
              </div>
              <Link href="/admin/homepage" className="dash-panel-link">
                Editor <Home className="w-3.5 h-3.5" />
              </Link>
            </div>
            <ul className="dash-sections-grid">
              {homepageSections.map((section) => (
                <li
                  key={section.id}
                  className={`dash-section-chip ${section.enabled ? "dash-section-chip--live" : ""}`}
                >
                  <span className="dash-section-chip-label">{section.label}</span>
                  <span className="dash-section-chip-status">
                    {section.enabled ? "Live" : "Off"}
                  </span>
                  <span className="dash-section-chip-count">{section.count} items</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="dash-panel dash-panel--actions">
          <div className="dash-panel-head">
            <div>
              <p className="dash-chart-eyebrow">Shortcuts</p>
              <h3 className="dash-panel-title">Quick actions</h3>
            </div>
          </div>
          <div className="dash-quick-actions">
            <Link href="/admin/articles/new" className="dash-quick-action dash-quick-action--primary">
              <PenLine className="w-5 h-5" />
              New article
            </Link>
            <Link href="/admin/review" className="dash-quick-action">
              Review queue
            </Link>
            {canEditHome && (
              <Link href="/admin/homepage" className="dash-quick-action">
                Homepage editor
              </Link>
            )}
            {canEditHome && (
              <Link href="/admin/about" className="dash-quick-action">
                <BookOpen className="w-5 h-5" />
                About page
              </Link>
            )}
            <Link href="/admin/newsletter" className="dash-quick-action">
              Newsletter
            </Link>
            <Link href="/" target="_blank" className="dash-quick-action">
              View live site <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
