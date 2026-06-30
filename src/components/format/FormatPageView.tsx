import type { CSSProperties } from "react";
import Link from "next/link";
import type { ArticleListItem } from "@/types";
import { PageBackdrop } from "@/components/site-chrome/PageBackdrop";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionRelatedNav } from "@/components/category/SectionRelatedNav";
import { formatArticleCardMeta } from "@/lib/format-article";

export interface FormatPageConfig {
  slug: string;
  eyebrow: string;
  title: string;
  lead: string;
  accent?: string;
  relatedSlugs: string[];
  emptyMessage: string;
  emptyLinks?: { label: string; href: string }[];
  rssHref?: string;
}

interface FormatPageViewProps {
  config: FormatPageConfig;
  articles: ArticleListItem[];
}

export function FormatPageView({ config, articles }: FormatPageViewProps) {
  const [featured, ...rest] = articles;

  return (
    <div className="format-page format-page--revolution" data-format={config.slug}>
      <PageBackdrop />

      <header
        className="section-page-hero section-page-hero--format"
        style={
          config.accent
            ? ({ "--section-accent": config.accent } as CSSProperties)
            : undefined
        }
      >
        <div className="section-page-hero-ornament" aria-hidden />
        <div className="section-page-hero-grid" aria-hidden />
        <div className="container section-page-hero-inner">
          <nav className="category-breadcrumb section-page-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>{config.title}</span>
          </nav>

          <div className="section-page-hero-main">
            <div>
              <span className="section-page-hero-eyebrow">{config.eyebrow}</span>
              <h1 className="section-page-hero-title">{config.title}</h1>
              <p className="section-page-hero-lead">{config.lead}</p>
            </div>
          </div>

          <div className="section-page-hero-actions">
            {config.rssHref && (
              <Link href={config.rssHref} className="section-page-hero-link">
                RSS feed
              </Link>
            )}
            <Link href="/videos" className="section-page-hero-link section-page-hero-link--muted">
              Videos
            </Link>
            <Link href="/podcasts" className="section-page-hero-link section-page-hero-link--muted">
              Podcasts
            </Link>
          </div>
        </div>
      </header>

      <div className="container format-page-inner">
        {articles.length === 0 ? (
          <div className="format-page-empty">
            <p>{config.emptyMessage}</p>
            {config.emptyLinks && config.emptyLinks.length > 0 && (
              <div className="format-page-empty-links">
                {config.emptyLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="section-page-hero-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {featured && (
              <Link
                href={`/article/${featured.slug}`}
                className="ec-card-h ec-card-h--featured category-featured article-reveal"
              >
                <div className="ec-card-h-media">
                  <SectionImage
                    src={featured.featuredImage}
                    alt={featured.title}
                    sizes="(max-width: 768px) 100vw, 560px"
                    priority
                  />
                  <span className="content-type-badge">{config.title}</span>
                </div>
                <div className="ec-card-h-content">
                  <span className="tag">{featured.category.name}</span>
                  <h2 className="ec-card-title large">{featured.title}</h2>
                  <p className="ec-card-excerpt">{featured.excerpt}</p>
                  <p className="ec-card-meta">
                    <span>{formatArticleCardMeta(featured)}</span>
                  </p>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <>
                <div className="category-section-label article-reveal article-reveal--delay-1">
                  <span>All {config.title.toLowerCase()}</span>
                  <span className="category-count">
                    {articles.length} item{articles.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="category-grid">
                  {rest.map((article, index) => (
                    <Link
                      key={article._id}
                      href={`/article/${article.slug}`}
                      className={`ec-card-h ec-card-h--compact category-card article-reveal article-reveal--delay-${(index % 3) + 1}`}
                    >
                      <div className="ec-card-h-media">
                        <SectionImage
                          src={article.featuredImage}
                          alt={article.title}
                          sizes="(max-width: 768px) 100vw, 320px"
                        />
                      </div>
                      <div className="ec-card-h-content">
                        <div className="ec-card-cat">{article.category.name}</div>
                        <div className="ec-card-title ec-card-title-sm">{article.title}</div>
                        <p className="ec-card-excerpt ec-card-excerpt-sm">{article.excerpt}</p>
                        <div className="ec-card-meta">
                          <span>{formatArticleCardMeta(article)}</span>
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
        currentSlug={config.slug}
        relatedSlugs={config.relatedSlugs}
      />
    </div>
  );
}
