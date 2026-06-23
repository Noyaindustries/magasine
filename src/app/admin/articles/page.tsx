import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { formatDate } from "@/lib/utils";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { Plus } from "lucide-react";
import type { ArticleStatus } from "@/types";

const statusLabels: Record<string, string> = {
  draft: "Draft",
  review: "In review",
  scheduled: "Scheduled",
  published: "Published",
  archived: "Archived",
};

const FILTERS: { label: string; value?: ArticleStatus }[] = [
  { label: "All" },
  { label: "Draft", value: "draft" },
  { label: "In review", value: "review" },
  { label: "Published", value: "published" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Archived", value: "archived" },
];

interface PageProps {
  searchParams: Promise<{ status?: string; q?: string; flag?: string }>;
}

const FLAG_FILTERS: { label: string; value?: string }[] = [
  { label: "Featured", value: "featured" },
  { label: "Top story", value: "topStory" },
  { label: "Urgent", value: "urgent" },
  { label: "Editor's choice", value: "editorsChoice" },
  { label: "Video", value: "video" },
];

export default async function AdminArticlesPage({ searchParams }: PageProps) {
  const { status, q, flag } = await searchParams;

  if (status === "review" && !q?.trim() && !flag) {
    redirect("/admin/review");
  }

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (flag === "featured") filter.isFeatured = true;
  if (flag === "topStory") filter.isTopStory = true;
  if (flag === "urgent") filter.isUrgent = true;
  if (flag === "editorsChoice") filter.isEditorsChoice = true;
  if (flag === "video") filter.contentType = "video";
  if (q?.trim()) {
    filter.$or = [
      { title: { $regex: q.trim(), $options: "i" } },
      { excerpt: { $regex: q.trim(), $options: "i" } },
    ];
  }

  const articles = await Article.find(filter)
    .populate("category", "name")
    .populate("authors", "name")
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  return (
    <>
      <AdminPageTitle
        title="Articles"
        description="Create, edit, and publish editorial content."
        actions={
          <Link href="/admin/articles/new" className="admin-btn admin-btn--primary">
            <Plus className="w-4 h-4" />
            New article
          </Link>
        }
      />
      <div className="admin-content">
        <div className="admin-toolbar">
          <div className="admin-toolbar-filters">
            {FILTERS.map((f) => {
              const href = f.value ? `/admin/articles?status=${f.value}` : "/admin/articles";
              const active = f.value ? status === f.value : !status;
              return (
                <Link
                  key={f.label}
                  href={href}
                  className={`admin-filter-pill${active ? " admin-filter-pill--active" : ""}`}
                >
                  {f.label}
                </Link>
              );
            })}
          </div>
          <div className="admin-toolbar-filters">
            {FLAG_FILTERS.map((f) => {
              const params = new URLSearchParams();
              if (status) params.set("status", status);
              if (q) params.set("q", q);
              if (f.value) params.set("flag", f.value);
              const href = params.toString() ? `/admin/articles?${params}` : "/admin/articles";
              const active = flag === f.value;
              return (
                <Link
                  key={f.label}
                  href={href}
                  className={`admin-filter-pill${active ? " admin-filter-pill--active" : ""}`}
                >
                  {f.label}
                </Link>
              );
            })}
            {flag && (
              <Link href={`/admin/articles${status ? `?status=${status}` : ""}`} className="admin-filter-pill">
                Clear flag
              </Link>
            )}
          </div>
          <form className="admin-search-form" action="/admin/articles" method="get">
            {status && <input type="hidden" name="status" value={status} />}
            {flag && <input type="hidden" name="flag" value={flag} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search title…"
              className="admin-search-input"
            />
            <button type="submit" className="admin-btn admin-btn--secondary admin-btn--sm">
              Search
            </button>
          </form>
        </div>

        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th className="hidden md:table-cell">Category</th>
                <th className="hidden lg:table-cell">Status</th>
                <th className="hidden lg:table-cell">Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={String(article._id)}>
                  <td>
                    <p className="admin-table-title line-clamp-1">{article.title}</p>
                    <p className="admin-table-sub">
                      {(article.authors as unknown as { name: string }[])?.[0]?.name}
                    </p>
                  </td>
                  <td className="text-muted hidden md:table-cell">
                    {(article.category as unknown as { name: string })?.name}
                  </td>
                  <td className="hidden lg:table-cell">
                    <span
                      className={`admin-status-pill admin-status-pill--${article.status === "published" ? "published" : article.status === "review" ? "review" : article.status === "scheduled" ? "scheduled" : "draft"}`}
                    >
                      {statusLabels[article.status] ?? article.status}
                    </span>
                  </td>
                  <td className="text-muted hidden lg:table-cell">
                    {article.publishedAt ? formatDate(article.publishedAt) : "—"}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <Link href={`/admin/articles/${article._id}`} className="admin-action-link">
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {articles.length === 0 && (
            <p className="admin-empty">No articles match your filters.</p>
          )}
        </div>
      </div>
    </>
  );
}
