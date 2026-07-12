import Link from "next/link";
import type { ArticleAdminStats } from "@/lib/article-admin-stats";

interface CmsArticlesStatsProps {
  stats: ArticleAdminStats;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function StatCard({
  value,
  label,
  hint,
  href,
}: {
  value: string;
  label: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="admin-stat-card-value">{value}</div>
      <div className="admin-stat-card-label">{label}</div>
      {hint ? <div className="articles-stat-hint">{hint}</div> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="admin-stat-card articles-stat-card--link">
        {content}
      </Link>
    );
  }

  return <div className="admin-stat-card">{content}</div>;
}

export function CmsArticlesStats({ stats }: CmsArticlesStatsProps) {
  const { overview, byContentType, byCategory, editorialFlags } = stats;

  return (
    <section className="articles-stats" aria-label="Article statistics">
      <div className="admin-stats-grid articles-stats-grid">
        <StatCard value={formatNumber(overview.total)} label="Total in database" />
        <StatCard
          value={formatNumber(overview.real)}
          label="Your articles (excluding test)"
          hint={`${formatNumber(overview.publishedReal)} published on site`}
        />
        <StatCard
          value={formatNumber(overview.demo)}
          label="Test articles"
          hint={
            overview.virtualOnSite > 0
              ? `+ ${formatNumber(overview.virtualOnSite)} virtual on site`
              : `${formatNumber(overview.publishedDemo)} published as test`
          }
          href="/admin/articles?demo=1"
        />
        <StatCard
          value={formatNumber(overview.publishedTotal)}
          label="Published"
          hint={`${formatNumber(overview.publishedThisWeek)} this week · ${formatNumber(overview.publishedThisMonth)} this month`}
          href="/admin/articles?status=published"
        />
        <StatCard
          value={formatNumber(
            stats.byStatus.draft + stats.byStatus.review + stats.byStatus.scheduled
          )}
          label="Pending"
          hint={`${formatNumber(stats.byStatus.draft)} drafts · ${formatNumber(stats.byStatus.review)} in review · ${formatNumber(stats.byStatus.scheduled)} scheduled`}
        />
        <StatCard
          value={formatNumber(overview.totalViews)}
          label="Total views"
          hint={`${formatNumber(overview.realViews)} on your articles · ~${overview.avgReadingTime} min read`}
        />
      </div>

      <div className="articles-stats-panels">
        <div className="articles-stats-panel">
          <h3 className="articles-stats-panel-title">By status</h3>
          <ul className="articles-stats-list">
            <li>
              <Link href="/admin/articles?status=published">Published</Link>
              <span>{formatNumber(stats.byStatus.published)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=draft">Drafts</Link>
              <span>{formatNumber(stats.byStatus.draft)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=review">In review</Link>
              <span>{formatNumber(stats.byStatus.review)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=scheduled">Scheduled</Link>
              <span>{formatNumber(stats.byStatus.scheduled)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=archived">Archived</Link>
              <span>{formatNumber(stats.byStatus.archived)}</span>
            </li>
          </ul>
        </div>

        <div className="articles-stats-panel">
          <h3 className="articles-stats-panel-title">By format</h3>
          <ul className="articles-stats-list">
            {byContentType.map((row) => (
              <li key={row.type}>
                <span>{row.label}</span>
                <span>
                  {formatNumber(row.total)}
                  <em>{formatNumber(row.published)} published</em>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="articles-stats-panel">
          <h3 className="articles-stats-panel-title">Homepage features (published)</h3>
          <ul className="articles-stats-list">
            {editorialFlags.map((row) => (
              <li key={row.key}>
                <span>{row.label}</span>
                <span>{formatNumber(row.count)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="articles-stats-panel articles-stats-panel--wide">
          <h3 className="articles-stats-panel-title">By section</h3>
          {byCategory.length === 0 ? (
            <p className="articles-stats-empty">No articles in database.</p>
          ) : (
            <div className="articles-stats-table-wrap">
              <table className="articles-stats-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Total</th>
                    <th>Published</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory.map((row) => {
                    const unpublished = row.total > 0 && row.published === 0;
                    const partial = row.published > 0 && row.published < row.total;
                    return (
                    <tr
                      key={row.slug}
                      className={
                        unpublished
                          ? "articles-stats-row--warning"
                          : partial
                            ? "articles-stats-row--partial"
                            : undefined
                      }
                    >
                      <td>
                        <Link href={`/admin/articles?category=${encodeURIComponent(row.name)}`}>
                          {row.name}
                        </Link>
                        {unpublished && (
                          <span className="articles-stats-row-hint">
                            None published — invisible on site
                          </span>
                        )}
                        {partial && (
                          <span className="articles-stats-row-hint">
                            {row.total - row.published} unpublished
                          </span>
                        )}
                      </td>
                      <td>{formatNumber(row.total)}</td>
                      <td>{formatNumber(row.published)}</td>
                      <td>{formatNumber(row.views)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
