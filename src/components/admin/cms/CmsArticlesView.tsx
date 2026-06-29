import Link from "next/link";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsArticlesTable } from "@/components/admin/cms/CmsArticlesTable";
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
  { label: "Tous", countKey: "all" },
  { label: "Publiés", id: "published", countKey: "published" },
  { label: "Brouillons", id: "draft", countKey: "draft" },
  { label: "En révision", id: "review", countKey: "review" },
  { label: "Planifiés", id: "scheduled", countKey: "scheduled" },
  { label: "Archivés", id: "archived", countKey: "archived" },
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
}

function buildArticlesHref(params: {
  status?: ArticleStatus;
  q?: string;
  category?: string;
  author?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.category) sp.set("category", params.category);
  if (params.author) sp.set("author", params.author);
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
}: CmsArticlesViewProps) {
  const activeCount = status ? counts[status] : counts.all;
  const paginationBase = buildArticlesHref({ status, q: query, category, author });

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Articles</div>
          <div className="vh2">
            {counts.all.toLocaleString("fr-FR")} articles · {counts.review} en attente ·{" "}
            {counts.scheduled} planifiés
          </div>
        </div>
        <div className="vacts">
          <Link href="/admin/articles/new" className="btn btn-red">
            + Nouvel article
          </Link>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((tab) => {
          const href = buildArticlesHref({ status: tab.id, q: query, category, author });
          const active = tab.id ? status === tab.id : !status;
          const count = counts[tab.countKey];
          return (
            <Link key={tab.label} href={href} className={active ? "tab on" : "tab"}>
              {tab.label} ({count.toLocaleString("fr-FR")})
            </Link>
          );
        })}
      </div>

      <form className="fbar" action="/admin/articles" method="get">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="fsearch">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="5" cy="5" r="3.5" stroke="var(--t3)" strokeWidth="1.5" />
            <path d="M8 8l2.5 2.5" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input name="q" type="search" defaultValue={query ?? ""} placeholder="Rechercher un article…" />
        </div>
        <select className="fsel" name="category" defaultValue={category ?? ""}>
          <option value="">Toutes les rubriques</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select className="fsel" name="author" defaultValue={author ?? ""}>
          <option value="">Tous les auteurs</option>
          {authors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-ghost btn-sm">
          Filtrer
        </button>
        <div className="fcount">
          {activeCount.toLocaleString("fr-FR")} résultats
          {totalPages > 1 ? ` · ${totalPages} pages` : ""}
        </div>
      </form>

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
