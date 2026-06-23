import Link from "next/link";
import type { ArticleListItem } from "@/types";
import { PageBackdrop } from "@/components/presse-ivoire/PageBackdrop";
import { SectionImage } from "@/components/presse-ivoire/SectionImage";
import { SectionRelatedNav } from "@/components/category/SectionRelatedNav";
import { URGENT_SECTION } from "@/lib/sections";
import { formatRelativeDate } from "@/lib/utils";

interface UrgentPageViewProps {
  articles: ArticleListItem[];
  alerts: { text: string; link?: string }[];
}

function formatMeta(article: ArticleListItem) {
  const author = article.authors[0]?.name ?? "Editorial";
  const date = article.publishedAt ? formatRelativeDate(article.publishedAt) : "";
  return `${author} · ${date} · ${article.readingTime} min`;
}

export function UrgentPageView({ articles, alerts }: UrgentPageViewProps) {
  const [featured, ...rest] = articles;

  return (
    <div className="urgent-page urgent-page--revolution">
      <PageBackdrop />

      <header className="section-page-hero section-page-hero--breaking urgent-page-hero">
        <div className="section-page-hero-ornament" aria-hidden />
        <div className="section-page-hero-grid" aria-hidden />
        <div className="container section-page-hero-inner">
          <nav className="category-breadcrumb section-page-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>Urgent</span>
          </nav>

          <div className="section-page-hero-main">
            <div>
              <span className="section-page-hero-eyebrow urgent-page-eyebrow">
                <span className="breaking-dot" aria-hidden />
                {URGENT_SECTION.eyebrow}
              </span>
              <h1 className="section-page-hero-title">{URGENT_SECTION.title}</h1>
              <p className="section-page-hero-lead">{URGENT_SECTION.lead}</p>
            </div>
          </div>

          <div className="section-page-hero-actions">
            <Link href="/rss" className="section-page-hero-link">
              Subscribe to RSS
            </Link>
            <Link href="/" className="section-page-hero-link section-page-hero-link--muted">
              Back to homepage
            </Link>
          </div>
        </div>
      </header>

      <div className="container urgent-page-inner">
        {alerts.length > 0 && (
          <div className="urgent-alerts urgent-page-alerts" role="list" aria-label="Live alerts">
            {alerts.map((alert) =>
              alert.link ? (
                <Link key={alert.text} href={alert.link} className="urgent-alert-pill" role="listitem">
                  <span className="breaking-dot" aria-hidden />
                  {alert.text}
                </Link>
              ) : (
                <span key={alert.text} className="urgent-alert-pill" role="listitem">
                  <span className="breaking-dot" aria-hidden />
                  {alert.text}
                </span>
              )
            )}
          </div>
        )}

        {articles.length === 0 ? (
          <p className="category-empty">
            No urgent alerts at the moment.{" "}
            <Link href="/">Back to home</Link>
          </p>
        ) : (
          <>
            {featured && (
              <Link
                href={`/article/${featured.slug}`}
                className="ec-card-h ec-card-h--featured urgent-featured-h article-reveal"
              >
                <div className="ec-card-h-media">
                  <SectionImage
                    src={featured.featuredImage}
                    alt={featured.title}
                    sizes="(max-width: 768px) 100vw, 560px"
                    priority
                  />
                  <span className="breaking-badge">
                    <span className="breaking-dot" />
                    Breaking
                  </span>
                  {featured.isPremium && <span className="premium-badge">Premium</span>}
                </div>
                <div className="ec-card-h-content">
                  <span className="tag">{featured.category.name}</span>
                  <h2 className="ec-card-title large">{featured.title}</h2>
                  <p className="ec-card-excerpt">{featured.excerpt}</p>
                  <p className="ec-card-meta">
                    <span>{formatMeta(featured)}</span>
                  </p>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <>
                <div className="category-section-label article-reveal article-reveal--delay-1">
                  <span>Latest alerts</span>
                  <span className="category-count">
                    {rest.length} story{rest.length > 1 ? "ies" : ""}
                  </span>
                </div>

                <div className="urgent-list urgent-page-list">
                  {rest.map((article, index) => (
                    <Link
                      key={article._id}
                      href={`/article/${article.slug}`}
                      className={`ec-card-h ec-card-h--compact urgent-list-item article-reveal article-reveal--delay-${(index % 3) + 1}`}
                    >
                      <span className="urgent-list-num" aria-hidden>
                        {String(index + 2).padStart(2, "0")}
                      </span>
                      <div className="ec-card-h-media">
                        <SectionImage
                          src={article.featuredImage}
                          alt={article.title}
                          sizes="120px"
                        />
                      </div>
                      <div className="ec-card-h-content">
                        <div className="ec-card-cat">{article.category.name}</div>
                        <div className="ec-card-title ec-card-title-sm">{article.title}</div>
                        <p className="ec-card-excerpt ec-card-excerpt-sm">{article.excerpt}</p>
                        <div className="ec-card-meta">
                          <span>{formatMeta(article)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <SectionRelatedNav
        currentSlug="urgent"
        relatedSlugs={[...URGENT_SECTION.relatedSlugs]}
        showRegions
      />
    </div>
  );
}
