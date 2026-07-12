import Link from "next/link";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsArticlesTable } from "@/components/admin/cms/CmsArticlesTable";
import { CmsArticlesStats } from "@/components/admin/cms/CmsArticlesStats";
import { CmsHomepageHeroGuide } from "@/components/admin/cms/CmsHomepageHeroGuide";
import { DemoContentActions } from "@/components/admin/cms/DemoContentActions";
import type { ArticleAdminStats } from "@/lib/article-admin-stats";
import type { ArticleStatus } from "@/types";

export interface ArticleListRow {
  _id: string;
  slug: string;
  title: string;
  status: ArticleStatus;
  categoryName: string;
  authorName: string;
  views: number;
  readingTime: number;
  updatedAt: string;
  publishedAt?: string;
  scheduledAt?: string;
  isDemo?: boolean;
}

export interface ArticleStatusCounts {
  all: number;
  published: number;
  draft: number;
  review: number;
  scheduled: number;
  archived: number;
}

const TABS: { id?: ArticleStatus; label: string; countKey: keyof ArticleStatusCounts }[] = [
  { label: "All", countKey: "all" },
  { label: "Published", id: "published", countKey: "published" },
  { label: "Drafts", id: "draft", countKey: "draft" },
  { label: "In review", id: "review", countKey: "review" },
  { label: "Scheduled", id: "scheduled", countKey: "scheduled" },
  { label: "Archived", id: "archived", countKey: "archived" },
];

interface CmsArticlesViewProps {
  articles: ArticleListRow[];
  counts: ArticleStatusCounts;
  status?: ArticleStatus;
  query?: string;
  category?: string;
  author?: string;
  page: number;
  totalPages: number;
  categories: string[];
  authors: string[];
  demoCount: number;
  virtualDemoCount: number;
  seedTotal: number;
  demoOnly?: boolean;
  stats: ArticleAdminStats;
}

function buildArticlesHref(params: {
  status?: ArticleStatus;
  q?: string;
  category?: string;
  author?: string;
  page?: number;
  demo?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.category) sp.set("category", params.category);
  if (params.author) sp.set("author", params.author);
  if (params.demo) sp.set("demo", "1");
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `/admin/articles?${qs}` : "/admin/articles";
}

export function CmsArticlesView({
  articles,
  counts,
  status,
  query,
  category,
  author,
  page,
  totalPages,
  categories,
  authors,
  demoCount,
  virtualDemoCount,
  seedTotal,
  demoOnly,
  stats,
}: CmsArticlesViewProps) {
  const activeCount = status ? counts[status] : counts.all;
  const paginationBase = buildArticlesHref({ status, q: query, category, author, demo: demoOnly });

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Articles</div>
          <div className="vh2">
            {stats.overview.total.toLocaleString("en-US")} in database ·{" "}
            {stats.overview.publishedReal.toLocaleString("en-US")} published (your articles) ·{" "}
            {stats.byStatus.review} in review
          </div>
        </div>
        <div className="vacts vacts--stacked">
          <DemoContentActions
            demoCount={demoCount}
            virtualDemoCount={virtualDemoCount}
            seedTotal={seedTotal}
          />
          <div className="vacts-row">
          <Link href="/admin/articles/new?type=video" className="btn btn-out">
            + New video
          </Link>
          <Link href="/admin/articles/new" className="btn btn-red">
            + New article
          </Link>
          </div>
        </div>
      </div>

      <CmsArticlesStats stats={stats} />

      <CmsHomepageHeroGuide stats={stats} />

      <div className="tabs">
        {demoOnly ? (
          <span className="tab on">Tests ({demoCount.toLocaleString("en-US")})</span>
        ) : (
          <Link
            href={buildArticlesHref({ status, q: query, category, author, demo: true })}
            className="tab"
          >
            Tests ({demoCount.toLocaleString("en-US")})
          </Link>
        )}
        {demoOnly && (
          <Link href={buildArticlesHref({ status, q: query, category, author })} className="tab">
            ← All articles
          </Link>
        )}
        {TABS.map((tab) => {
          const href = buildArticlesHref({
            status: tab.id,
            q: query,
            category,
            author,
            demo: demoOnly,
          });
          const active = !demoOnly && (tab.id ? status === tab.id : !status);
          const count = counts[tab.countKey];
          return (
            <Link key={tab.label} href={href} className={active ? "tab on" : "tab"}>
              {tab.label} ({count.toLocaleString("en-US")})
            </Link>
          );
        })}
      </div>

      <form className="fbar" action="/admin/articles" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        {demoOnly && <input type="hidden" name="demo" value="1" />}
        <div className="fsearch">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="5" cy="5" r="3.5" stroke="var(--t3)" strokeWidth="1.5" />
            <path d="M8 8l2.5 2.5" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input name="q" type="search" defaultValue={query ?? ""} placeholder="Search articles…" />
        </div>
        <select className="fsel" name="category" defaultValue={category ?? ""}>
          <option value="">All categories</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select className="fsel" name="author" defaultValue={author ?? ""}>
          <option value="">All authors</option>
          {authors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ghost btn-sm">
          Filter
        </button>
        <div className="fcount">
          {activeCount.toLocaleString("en-US")} results
          {totalPages > 1 ? ` · ${totalPages} pages` : ""}
        </div>
      </form>

      {demoOnly && articles.length === 0 && (
        <p className="demo-content-empty">
          No test articles in the database yet.
          {virtualDemoCount > 0
            ? ` Click « Load test articles (${virtualDemoCount}) » above.`
            : " Use « Load test articles » or « Identify seed articles »."}
        </p>
      )}

      <CmsArticlesTable
        articles={articles}
        activeCount={activeCount}
        page={page}
        totalPages={totalPages}
        baseHref={paginationBase}
      />
    </CmsPage>
  );
}
