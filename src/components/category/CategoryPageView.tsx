import type { CSSProperties } from "react";
import Link from "next/link";
import type { ArticleListItem } from "@/types";
import type { SectionKind } from "@/lib/sections";
import { PageBackdrop } from "@/components/site-chrome/PageBackdrop";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionPageHero } from "@/components/category/SectionPageHero";
import { SectionRelatedNav } from "@/components/category/SectionRelatedNav";
import { formatArticleCardMeta } from "@/lib/format-article";
import { isNewsHubCategory } from "@/lib/news-hub";

interface CategoryPageViewProps {
  category: {
    name: string;
    slug: string;
    description?: string;
    color?: string;
  };
  sectionMeta: {
    kind: SectionKind;
    eyebrow: string;
    lead: string;
    relatedSlugs: string[];
    linkHref?: string;
    linkLabel?: string;
    formatLinks?: { label: string; href: string }[];
  };
  articles: ArticleListItem[];
}


export function CategoryPageView({ category, sectionMeta, articles }: CategoryPageViewProps) {
  const [featured, ...rest] = articles;
  const isRegion = sectionMeta.kind === "region";

  return (
    <div
      className={`category-page category-page--revolution category-page--${sectionMeta.kind}`}
      data-section={category.slug}
      style={
        category.color
          ? ({ "--section-accent": category.color } as CSSProperties)
          : undefined
      }
    >
      <PageBackdrop />

      <SectionPageHero
        name={category.name}
        slug={category.slug}
        kind={sectionMeta.kind}
        eyebrow={sectionMeta.eyebrow}
        lead={sectionMeta.lead}
        description={category.description}
        accent={category.color}
        linkHref={sectionMeta.linkHref}
        linkLabel={sectionMeta.linkLabel}
        formatLinks={sectionMeta.formatLinks}
        parentCrumb={
          isNewsHubCategory(category.slug)
            ? { label: "All news", href: "/news" }
            : undefined
        }
      />

      <div className="container category-page-inner">
        {articles.length === 0 ? (
          <p className="category-empty">
            No articles published in this section yet.{" "}
            <Link href="/">Back to home</Link>
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
                  <span>All articles</span>
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
        currentSlug={category.slug}
        relatedSlugs={sectionMeta.relatedSlugs}
        showRegions={!isRegion}
      />
    </div>
  );
}
