"use client";

import Link from "next/link";
import type { ArticleListItem } from "@/types";
import { PageBackdrop } from "@/components/site-chrome/PageBackdrop";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionRelatedNav } from "@/components/category/SectionRelatedNav";
import { ALL_NEWS_SECTION } from "@/lib/sections";
import { formatArticleCardMeta } from "@/lib/format-article";
import { newsHubActiveHref } from "@/lib/news-hub";
import { NewsHubSections } from "@/components/news/NewsHubSections";
import { NewsBreakingStrip } from "@/components/news/NewsBreakingStrip";
import { AllNewsHubFilters, useActiveNewsLabel } from "@/components/news/AllNewsHubFilters";
import { useSiteNav } from "@/components/site-chrome/SiteNavContext";

interface AllNewsPageViewProps {
  articles: ArticleListItem[];
  activeCategory?: string;
  sectionCounts: Record<string, number>;
  urgentArticles: ArticleListItem[];
  alerts: { text: string; link?: string }[];
}

function AllNewsPageContent({
  articles,
  activeCategory,
  sectionCounts,
  urgentArticles,
  alerts,
}: AllNewsPageViewProps) {
  const { newsMenu } = useSiteNav();
  const [featured, ...rest] = articles;
  const activeNewsHref = newsHubActiveHref(activeCategory, newsMenu);
  const activeLabel = useActiveNewsLabel(activeCategory);

  return (
    <div className="category-page category-page--revolution all-news-page">
      <PageBackdrop />

      <header className="section-page-hero section-page-hero--topic all-news-page-hero">
        <div className="section-page-hero-ornament" aria-hidden />
        <div className="section-page-hero-grid" aria-hidden />
        <div className="container section-page-hero-inner">
          <nav className="category-breadcrumb section-page-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden>/</span>
            <span>{activeLabel ?? "All news"}</span>
          </nav>

          <div className="section-page-hero-main">
            <div>
              {ALL_NEWS_SECTION.eyebrow ? (
                <span className="section-page-hero-eyebrow">{ALL_NEWS_SECTION.eyebrow}</span>
              ) : null}
              <h1 className="section-page-hero-title">
                {activeLabel ? `${activeLabel}` : ALL_NEWS_SECTION.title}
              </h1>
              <p className="section-page-hero-lead">
                {activeLabel
                  ? `Stories from ${activeLabel.toLowerCase()} — filter, browse, or jump to another news desk.`
                  : ALL_NEWS_SECTION.lead}
              </p>
            </div>
          </div>

          <div className="section-page-hero-actions">
            <Link href="/urgent" className="section-page-hero-link">
              Breaking news
            </Link>
            <Link href="/rss" className="section-page-hero-link">
              Subscribe to RSS
            </Link>
            <Link href="/search" className="section-page-hero-link section-page-hero-link--muted">
              Search archive
            </Link>
          </div>
        </div>
      </header>

      <div className="container all-news-page-inner">
        {!activeCategory && (
          <>
            <NewsBreakingStrip alerts={alerts} urgentArticles={urgentArticles} />
            <NewsHubSections sectionCounts={sectionCounts} activeHref={activeNewsHref} />
          </>
        )}

        <AllNewsHubFilters activeCategory={activeCategory} />

        {activeCategory && (
          <NewsHubSections sectionCounts={sectionCounts} activeHref={activeNewsHref} />
        )}

        {activeLabel && (
          <p className="all-news-active-filter">
            Showing <strong>{activeLabel}</strong> —{" "}
            <Link href="/news">Clear filter</Link>
          </p>
        )}

        {articles.length === 0 ? (
          <p className="category-empty">
            No articles match this filter yet.{" "}
            <Link href="/news">View all news</Link>
          </p>
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
                  {featured.isPremium && <span className="premium-badge">Premium</span>}
                  {featured.isUrgent && (
                    <span className="breaking-badge">
                      <span className="breaking-dot" />
                      Urgent
                    </span>
                  )}
                  {featured.contentType === "video" && (
                    <span className="content-type-badge">Video</span>
                  )}
                  {featured.contentType === "podcast" && (
                    <span className="content-type-badge">Podcast</span>
                  )}
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
                  <span>{activeLabel ? `${activeLabel} articles` : "Latest articles"}</span>
                  <span className="category-count">
                    {articles.length} article{articles.length > 1 ? "s" : ""}
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
        currentSlug="news"
        relatedSlugs={[...ALL_NEWS_SECTION.relatedSlugs]}
        showRegions
      />
    </div>
  );
}

export function AllNewsPageView(props: AllNewsPageViewProps) {
  return <AllNewsPageContent {...props} />;
}
