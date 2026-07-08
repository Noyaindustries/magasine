import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { ArticleDetail, ArticleListItem } from "@/types";
import type { Session } from "next-auth";
import {
  articleBadge,
  authorInitials,
  formatArticleDisplayDate,
  formatPublishedDate,
} from "@/lib/format-article";
import { resolveFeaturedImage } from "@/lib/images";
import { CommentsSection } from "@/components/article/CommentsSection";
import { NewsletterPrompt } from "@/components/article/NewsletterPrompt";
import { ArticleBody } from "@/components/article/ArticleBody";
import { PageBackdrop } from "@/components/site-chrome/PageBackdrop";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ArticleStickyRail, ArticleMobileToolbar } from "@/components/article/ArticleStickyRail";
import { AdView } from "@/components/ads/AdView";
import type { PublicAd } from "@/lib/ad-slots";

interface ArticleDetailViewProps {
  article: ArticleDetail;
  related: ArticleListItem[];
  navigation: {
    prev: { title: string; slug: string } | null;
    next: { title: string; slug: string } | null;
  };
  session: Session | null;
  siteUrl: string;
  adRight?: PublicAd | null;
  adBelow?: PublicAd | null;
}

export function ArticleDetailView({
  article,
  related,
  navigation,
  session: _session,
  siteUrl,
  adRight,
  adBelow,
}: ArticleDetailViewProps) {
  const author = article.authors[0];
  const badge = articleBadge(article);
  const heroImage = resolveFeaturedImage(article.featuredImage);
  const accentColor = article.category.color ?? "#1a3896";
  const articleUrl = `${siteUrl}/article/${article.slug}`;

  const style = {
    "--art-accent": accentColor,
    "--art-accent-soft": `${accentColor}14`,
  } as CSSProperties;

  return (
    <article className="article-page article-page--premium" style={style}>
      <PageBackdrop />

      <header className="art-article-header art-article-header--combined art-reveal">
        <figure className="art-article-header-cover">
          <div className="art-article-header-frame">
            <Image
              src={heroImage}
              alt={article.featuredImageAlt ?? article.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="art-article-header-scrim" aria-hidden />

            <div className="art-article-header-panel art-article-header-panel--overlay">
              <div className="container art-article-header-inner">
                <nav className="art-breadcrumb" aria-label="Breadcrumb">
                  <Link href="/">Home</Link>
                  <span className="art-breadcrumb-sep" aria-hidden>
                    /
                  </span>
                  <Link href={`/category/${article.category.slug}`}>{article.category.name}</Link>
                  <span className="art-breadcrumb-sep" aria-hidden>
                    /
                  </span>
                  <span className="art-breadcrumb-current">{article.title}</span>
                </nav>

                <div className="art-kicker-row">
                  <Link href={`/category/${article.category.slug}`} className="art-category-pill">
                    <span className="art-category-pill-dot" aria-hidden />
                    {article.category.name}
                  </Link>
                  {article.isUrgent && <span className="art-badge art-badge--urgent">Urgent</span>}
                  {article.isPremium && <span className="art-badge art-badge--premium">Premium</span>}
                  {article.contentType === "video" && (
                    <span className="art-badge art-badge--gold">Video</span>
                  )}
                  {article.contentType === "podcast" && (
                    <span className="art-badge art-badge--gold">Podcast</span>
                  )}
                  {badge !== "News" && badge !== article.category.name && !article.isUrgent && (
                    <span className="art-badge">{badge}</span>
                  )}
                </div>

                <h1 className="art-title">{article.title}</h1>

                {article.subtitle && <p className="art-subtitle">{article.subtitle}</p>}

                <div className="art-byline">
                  {author ? (
                    <Link href={`/author/${author.slug}`} className="art-author-card">
                      {author.avatar ? (
                        <Image
                          src={author.avatar}
                          alt={author.name}
                          width={52}
                          height={52}
                          className="art-author-avatar"
                        />
                      ) : (
                        <span className="art-author-avatar art-author-avatar--fallback" aria-hidden>
                          {authorInitials(author.name)}
                        </span>
                      )}
                      <span>
                        <span className="art-author-name">{author.name}</span>
                        {author.bio && (
                          <span className="art-author-role">{author.bio.split("—")[0]?.trim()}</span>
                        )}
                      </span>
                    </Link>
                  ) : (
                    <span />
                  )}

                  <div className="art-meta-strip">
                    {article.publishedAt && (
                      <time
                        className="art-meta-item"
                        dateTime={article.publishedAt}
                        title={formatPublishedDate(article.publishedAt)}
                      >
                        {formatArticleDisplayDate(article.publishedAt)}
                      </time>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {article.featuredImageCaption && (
            <figcaption className="art-article-header-caption">
              {article.featuredImageCaption}
            </figcaption>
          )}
        </figure>
      </header>

      <div className="container art-body-shell">
        <div className="art-layout art-reveal art-reveal--d3">
          <ArticleStickyRail
            url={articleUrl}
            title={article.title}
            articleId={article._id}
          />

          <div className="art-main">
            <ArticleMobileToolbar
              url={articleUrl}
              title={article.title}
              articleId={article._id}
            />

            <div className="art-deck">
              <span className="art-deck-label">The story</span>
              <p>{article.excerpt}</p>
            </div>

            <ArticleBody article={article} />

            {(article.isPremium || article.isEditorsChoice) && <NewsletterPrompt />}

            {author && (
              <aside className="art-author-box">
                <div className="art-author-box-header">
                  {author.avatar ? (
                    <Image
                      src={author.avatar}
                      alt=""
                      width={56}
                      height={56}
                      className="art-author-avatar"
                      aria-hidden
                    />
                  ) : (
                    <span className="art-author-avatar art-author-avatar--fallback" aria-hidden>
                      {authorInitials(author.name)}
                    </span>
                  )}
                  <div>
                    <span className="art-author-box-kicker">About the author</span>
                    <h3>{author.name}</h3>
                  </div>
                </div>
                {author.bio ? <p>{author.bio}</p> : null}
                <Link href={`/author/${author.slug}`} className="art-author-box-link">
                  View all articles
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </Link>
              </aside>
            )}

            {article.tags && article.tags.length > 0 && (
              <div className="art-tags">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="art-tag"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <CommentsSection articleId={article._id} variant="premium" />
          </div>

          <aside className="art-rail-right" aria-label="Sponsored">
            {adRight && <AdView ad={adRight} slot="article-right" className="art-rail-right-ad" />}
          </aside>
        </div>
      </div>

      {adBelow && (
        <section className="art-ad-below container" aria-label="Sponsored">
          <AdView ad={adBelow} slot="article-below" />
        </section>
      )}

      {(navigation.prev || navigation.next) && (
        <nav className="art-article-nav container art-reveal art-reveal--d4" aria-label="Article navigation">
          <div className="art-article-nav-grid">
            {navigation.prev ? (
              <Link href={`/article/${navigation.prev.slug}`} className="art-nav-card">
                <span className="art-nav-card-label">
                  <ChevronLeft className="w-4 h-4" aria-hidden />
                  Previous
                </span>
                <span className="art-nav-card-title">{navigation.prev.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {navigation.next ? (
              <Link
                href={`/article/${navigation.next.slug}`}
                className="art-nav-card art-nav-card--next"
              >
                <span className="art-nav-card-label">
                  Next
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </span>
                <span className="art-nav-card-title">{navigation.next.title}</span>
              </Link>
            ) : null}
          </div>
        </nav>
      )}

      {related.length > 0 && (
        <section
          className="art-related container art-reveal art-reveal--d5"
          aria-labelledby="related-heading"
        >
          <div className="art-related-header">
            <h2 id="related-heading" className="art-related-title">
              Continue reading
            </h2>
            <span className="art-related-sub">Related coverage</span>
          </div>
          <div className="art-related-grid">
            {related.map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
