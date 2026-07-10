import Link from "next/link";
import type { ArticleAdminStats } from "@/lib/article-admin-stats";

interface CmsArticlesStatsProps {
  stats: ArticleAdminStats;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR");
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
    <section className="articles-stats" aria-label="Statistiques des articles">
      <div className="admin-stats-grid articles-stats-grid">
        <StatCard value={formatNumber(overview.total)} label="Total en base" />
        <StatCard
          value={formatNumber(overview.real)}
          label="Vos articles (hors test)"
          hint={`${formatNumber(overview.publishedReal)} publié(s) sur le site`}
        />
        <StatCard
          value={formatNumber(overview.demo)}
          label="Articles de test"
          hint={
            overview.virtualOnSite > 0
              ? `+ ${formatNumber(overview.virtualOnSite)} virtuels sur le site`
              : `${formatNumber(overview.publishedDemo)} publié(s) en test`
          }
          href="/admin/articles?demo=1"
        />
        <StatCard
          value={formatNumber(overview.publishedTotal)}
          label="Publiés"
          hint={`${formatNumber(overview.publishedThisWeek)} cette semaine · ${formatNumber(overview.publishedThisMonth)} ce mois`}
          href="/admin/articles?status=published"
        />
        <StatCard
          value={formatNumber(
            stats.byStatus.draft + stats.byStatus.review + stats.byStatus.scheduled
          )}
          label="En attente"
          hint={`${formatNumber(stats.byStatus.draft)} brouillons · ${formatNumber(stats.byStatus.review)} en relecture · ${formatNumber(stats.byStatus.scheduled)} planifiés`}
        />
        <StatCard
          value={formatNumber(overview.totalViews)}
          label="Vues cumulées"
          hint={`${formatNumber(overview.realViews)} sur vos articles · ~${overview.avgReadingTime} min lecture`}
        />
      </div>

      <div className="articles-stats-panels">
        <div className="articles-stats-panel">
          <h3 className="articles-stats-panel-title">Par statut</h3>
          <ul className="articles-stats-list">
            <li>
              <Link href="/admin/articles?status=published">Publiés</Link>
              <span>{formatNumber(stats.byStatus.published)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=draft">Brouillons</Link>
              <span>{formatNumber(stats.byStatus.draft)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=review">En relecture</Link>
              <span>{formatNumber(stats.byStatus.review)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=scheduled">Planifiés</Link>
              <span>{formatNumber(stats.byStatus.scheduled)}</span>
            </li>
            <li>
              <Link href="/admin/articles?status=archived">Archivés</Link>
              <span>{formatNumber(stats.byStatus.archived)}</span>
            </li>
          </ul>
        </div>

        <div className="articles-stats-panel">
          <h3 className="articles-stats-panel-title">Par format</h3>
          <ul className="articles-stats-list">
            {byContentType.map((row) => (
              <li key={row.type}>
                <span>{row.label}</span>
                <span>
                  {formatNumber(row.total)}
                  <em>{formatNumber(row.published)} publiés</em>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="articles-stats-panel">
          <h3 className="articles-stats-panel-title">Mise en avant (publiés)</h3>
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
          <h3 className="articles-stats-panel-title">Par rubrique</h3>
          {byCategory.length === 0 ? (
            <p className="articles-stats-empty">Aucun article en base.</p>
          ) : (
            <div className="articles-stats-table-wrap">
              <table className="articles-stats-table">
                <thead>
                  <tr>
                    <th>Rubrique</th>
                    <th>Total</th>
                    <th>Publiés</th>
                    <th>Vues</th>
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
                            Aucun publié — invisible sur le site
                          </span>
                        )}
                        {partial && (
                          <span className="articles-stats-row-hint">
                            {row.total - row.published} non publié(s)
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
