"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import type { ArticleListRow } from "@/components/admin/cms/CmsArticlesView";
import { CmsStatusBadge, formatArticleDate, authorAvatarGradient, authorInitials, categoryAccent } from "@/components/admin/cms/cms-ui";
import { RelativeTime } from "@/components/admin/cms/RelativeTime";
import { CmsActionIcons } from "@/components/admin/cms/CmsIcons";
import { toast } from "@/lib/toast";
import {
  ARTICLES_PAGE_SIZE,
  buildPageHref,
  getPaginationItems,
  paginationRangeLabel,
} from "@/lib/pagination";

interface CmsArticlesTableProps {
  articles: ArticleListRow[];
  activeCount: number;
  page: number;
  totalPages: number;
  baseHref: string;
}

async function bulkAction(action: string, articleIds: string[]) {
  await fetch("/api/admin/articles/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, articleIds }),
  });
}

export function CmsArticlesTable({
  articles,
  activeCount,
  page,
  totalPages,
  baseHref,
}: CmsArticlesTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggleAll = () => {
    if (selected.size === articles.length) setSelected(new Set());
    else setSelected(new Set(articles.map((a) => a._id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const runBulk = async (action: "publish" | "archive" | "restore" | "delete") => {
    if (selected.size === 0) return;
    if (action === "delete" && !confirm("Delete the selected articles?")) return;
    setBusy(true);
    try {
      await bulkAction(action, Array.from(selected));
      setSelected(new Set());
      if (action === "delete") toast.success("Articles deleted");
      else if (action === "publish") toast.success("Articles published");
      else if (action === "archive") toast.success("Articles archived");
      else toast.success("Articles restored");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const rowAction = async (id: string, action: "publish" | "archive" | "restore" | "delete") => {
    if (action === "delete" && !confirm("Delete this article?")) return;
    setBusy(true);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
        if (res.ok) toast.success("Article deleted");
        else toast.error("Delete failed");
      } else {
        await bulkAction(action, [id]);
        toast.success(action === "publish" ? "Article published" : action === "archive" ? "Article archived" : "Article restored");
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const importCsv = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv,text/csv";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        toast.error("Empty or invalid CSV.");
        return;
      }
      toast.info(
        `CSV import: ${lines.length - 1} row(s) detected. Create articles via the editor for now.`
      );
    };
    input.click();
  };

  const pageItems = getPaginationItems(page, totalPages);
  const rangeLabel = paginationRangeLabel(page, ARTICLES_PAGE_SIZE, activeCount);

  return (
    <>
      <div className="vacts cms-articles-toolbar">
        <button type="button" className="btn btn-out" onClick={importCsv}>
          Import CSV
        </button>
      </div>

      {selected.size > 0 && (
        <div className="qarow">
          <button type="button" className="qa" disabled={busy} onClick={() => void runBulk("publish")}>
            Publish ({selected.size})
          </button>
          <button type="button" className="qa" disabled={busy} onClick={() => void runBulk("archive")}>
            Archive
          </button>
          <button type="button" className="qa" disabled={busy} onClick={() => void runBulk("delete")}>
            Delete
          </button>
        </div>
      )}

      <div className="card mb16">
        <div className="card-np">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={articles.length > 0 && selected.size === articles.length}
                    onChange={toggleAll}
                  />
                </th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Status</th>
                <th>Views</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 && (
                <tr>
                  <td colSpan={8} className="cms-empty-cell">
                    No articles match your filters.
                  </td>
                </tr>
              )}
              {articles.map((article) => {
                const color = categoryAccent(article.categoryName);
                const dateCell =
                  article.status === "published" && article.publishedAt
                    ? formatArticleDate(article.publishedAt)
                    : article.status === "scheduled" && article.scheduledAt
                      ? formatArticleDate(article.scheduledAt)
                      : article.status === "review"
                        ? (
                            <>
                              Submitted <RelativeTime iso={article.updatedAt} />
                            </>
                          )
                        : article.status === "draft"
                          ? (
                              <>
                                Edited <RelativeTime iso={article.updatedAt} />
                              </>
                            )
                          : <RelativeTime iso={article.updatedAt} />;

                return (
                  <tr key={article._id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${article.title}`}
                        checked={selected.has(article._id)}
                        onChange={() => toggleOne(article._id)}
                      />
                    </td>
                    <td>
                      <div className="tc-main">
                        {article.title}
                        {article.isDemo && (
                          <span className="cms-badge cms-badge--muted" style={{ marginLeft: 8 }}>
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="tc-sub">
                        {article.readingTime > 0
                          ? `${article.readingTime} min read`
                          : article.status === "draft"
                            ? "draft in progress"
                            : "—"}
                      </div>
                    </td>
                    <td>
                      <div className="cms-author-cell">
                        <div className="av" style={{ background: authorAvatarGradient(article.authorName) }}>
                          {authorInitials(article.authorName)}
                        </div>
                        <span>{article.authorName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "11.5px", color }}>{article.categoryName}</span>
                    </td>
                    <td>
                      <CmsStatusBadge status={article.status} scheduledAt={article.scheduledAt} />
                    </td>
                    <td style={{ fontFamily: "var(--mono)", fontSize: "11.5px" }}>
                      {article.views > 0 ? article.views.toLocaleString("en-US") : "—"}
                    </td>
                    <td className="tc-muted">{dateCell}</td>
                    <td>
                      <div className="cms-row-actions">
                        {article.status === "review" && (
                          <button
                            type="button"
                            className="btn btn-red btn-xs"
                            disabled={busy}
                            onClick={() => void rowAction(article._id, "publish")}
                          >
                            Publish
                          </button>
                        )}
                        <Link href={`/admin/articles/${article._id}`} className="btn btn-ghost btn-xs btn-icon" title="Edit">
                          <CmsActionIcons.edit size={14} className="cms-icon" aria-hidden />
                        </Link>
                        {article.status !== "draft" && article.slug && (
                          <Link href={`/article/${article.slug}`} className="btn btn-ghost btn-xs btn-icon" title="View" target="_blank">
                            <CmsActionIcons.view size={14} className="cms-icon" aria-hidden />
                          </Link>
                        )}
                        {article.status === "archived" ? (
                          <button type="button" className="btn btn-ghost btn-xs" disabled={busy} onClick={() => void rowAction(article._id, "restore")}>
                            Restore
                          </button>
                        ) : article.status === "draft" ? (
                          <button type="button" className="btn btn-ghost btn-xs btn-icon" title="Delete" disabled={busy} onClick={() => void rowAction(article._id, "delete")}>
                            <CmsActionIcons.delete size={14} className="cms-icon cms-icon--error" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pag">
          <div className="paginfo">
            {rangeLabel} · Page {page} of {totalPages}
          </div>
          <div className="pagbtns">
            {page > 1 ? (
              <Link href={buildPageHref(baseHref, page - 1)} className="pagb" aria-label="Previous page">
                ←
              </Link>
            ) : (
              <span className="pagb pagb--disabled" aria-hidden>
                ←
              </span>
            )}

            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="pagdots" aria-hidden>
                  …
                </span>
              ) : item === page ? (
                <span key={item} className="pagb on" aria-current="page">
                  {item}
                </span>
              ) : (
                <Link key={item} href={buildPageHref(baseHref, item)} className="pagb">
                  {item}
                </Link>
              )
            )}

            {page < totalPages ? (
              <Link href={buildPageHref(baseHref, page + 1)} className="pagb" aria-label="Next page">
                →
              </Link>
            ) : (
              <span className="pagb pagb--disabled" aria-hidden>
                →
              </span>
            )}
          </div>
        </div>
      )}

    </>
  );
}
