import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { ArticleDetail, ArticleListItem } from "@/types";
import type { Session } from "next-auth";
import { formatRelativeDate } from "@/lib/utils";
import {
  articleBadge,
  authorInitials,
  formatPublishedDate,
  formatViews,
} from "@/lib/format-article";
import { resolveFeaturedImage } from "@/lib/images";
import { CommentsSection } from "@/components/article/CommentsSection";
import { NewsletterPrompt } from "@/components/article/NewsletterPrompt";
import { ArticleBody } from "@/components/article/ArticleBody";
import { PageBackdrop } from "@/components/presse-ivoire/PageBackdrop";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ArticleStickyRail, ArticleMobileToolbar } from "@/components/article/ArticleStickyRail";

interface ArticleDetailViewProps {
  article: ArticleDetail;
  related: ArticleListItem[];
  navigation: {
    prev: { title: string; slug: string } | null;
    next: { title: string; slug: string } | null;
  };
  session: Session | null;
  siteUrl: string;
}

export function ArticleDetailView({
  article,
  related,
  navigation,
  session: _session,
  siteUrl,
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

      <div className="art-hero-band">
        <div className="container art-hero-inner">
          <nav className="art-breadcrumb art-reveal" aria-label="Breadcrumb">
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

          <header className="art-reveal art-reveal--d1">
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
                    {formatRelativeDate(article.publishedAt)}
                  </time>
                )}
                <span className="art-meta-divider" aria-hidden />
                <span className="art-meta-item">
                  <Clock className="w-3.5 h-3.5" aria-hidden />
                  {article.readingTime} min read
                </span>
                {typeof article.views === "number" && article.views > 0 && (
                  <>
                    <span className="art-meta-divider" aria-hidden />
                    <span className="art-meta-item">
                      <Eye className="w-3.5 h-3.5" aria-hidden />
                      {formatViews(article.views)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>
      </div>

      <figure className="art-hero-media art-reveal art-reveal--d2">
        <div className="art-hero-frame">
          <Image
            src={heroImage}
            alt={article.featuredImageAlt ?? article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
        </div>
        {article.featuredImageCaption && (
          <figcaption className="art-hero-caption">{article.featuredImageCaption}</figcaption>
        )}
      </figure>

      <div className="container art-body-shell">
        <div className="art-layout art-reveal art-reveal--d3">
          <ArticleStickyRail
            url={articleUrl}
            title={article.title}
            articleId={article._id}
            readingTime={article.readingTime}
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

            {author?.bio && (
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
                <p>{author.bio}</p>
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
        </div>
      </div>

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
