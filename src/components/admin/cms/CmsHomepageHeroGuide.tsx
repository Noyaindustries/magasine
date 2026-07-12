import Link from "next/link";
import type { ArticleAdminStats } from "@/lib/article-admin-stats";

interface CmsHomepageHeroGuideProps {
  stats: ArticleAdminStats;
}

function findCategoryPublished(stats: ArticleAdminStats, slug: string): number {
  return stats.byCategory.find((row) => row.slug === slug)?.published ?? 0;
}

export function CmsHomepageHeroGuide({ stats }: CmsHomepageHeroGuideProps) {
  const { overview, editorialFlags } = stats;
  const publishedReal = overview.publishedReal;
  const featuredCount = editorialFlags.find((row) => row.key === "featured")?.count ?? 0;
  const opinionPublished = findCategoryPublished(stats, "opinion");

  const relatedTarget = 6;
  const opinionTarget = 3;
  const relatedOk = publishedReal >= relatedTarget;
  const opinionOk = opinionPublished >= opinionTarget;
  const heroOk = featuredCount >= 1;

  return (
    <details className="articles-hero-guide">
      <summary className="articles-hero-guide-summary">
        <span className="articles-hero-guide-title">How to fill the homepage (hero)</span>
        <span
          className={
            relatedOk && opinionOk && heroOk
              ? "articles-hero-guide-badge articles-hero-guide-badge--ok"
              : "articles-hero-guide-badge"
          }
        >
          {relatedOk && opinionOk && heroOk ? "Complete" : "Needs work"}
        </span>
      </summary>

      <div className="articles-hero-guide-body">
        <p className="articles-hero-guide-intro">
          After removing test articles, only your <strong>published</strong> articles appear on the
          homepage. Here is how to populate each block visible below the main image.
        </p>

        <div className="articles-hero-guide-grid">
          <article className="articles-hero-guide-card">
            <h3>Hero main image</h3>
            <p>
              An article with <strong>Homepage feature</strong> enabled in the editor, then status{" "}
              <strong>Published</strong>.
            </p>
            <p className="articles-hero-guide-status">
              {heroOk ? (
                <>✓ {featuredCount} featured article(s)</>
              ) : (
                <>⚠ No published « Homepage feature » article</>
              )}
            </p>
            <Link href="/admin/articles/new" className="articles-hero-guide-link">
              + Create main article
            </Link>
          </article>

          <article className="articles-hero-guide-card">
            <h3>Related Stories</h3>
            <p>
              The <strong>latest published articles</strong> (all sections), up to 6 cards. The main
              hero article is excluded automatically.
            </p>
            <p className="articles-hero-guide-status">
              {relatedOk ? (
                <>✓ {publishedReal} published article(s) — full row</>
              ) : (
                <>
                  ⚠ {publishedReal}/{relatedTarget} published articles recommended ({Math.max(0, relatedTarget - publishedReal)} missing)
                </>
              )}
            </p>
            <Link href="/admin/articles/new" className="articles-hero-guide-link">
              + Add an article
            </Link>
          </article>

          <article className="articles-hero-guide-card">
            <h3>Opinion &amp; Ideas</h3>
            <p>
              <strong>Published</strong> articles whose main section is <strong>Opinion</strong> (not
              just a region checked alongside).
            </p>
            <p className="articles-hero-guide-status">
              {opinionOk ? (
                <>✓ {opinionPublished} published Opinion article(s)</>
              ) : (
                <>
                  ⚠ {opinionPublished}/{opinionTarget} published Opinion articles ({Math.max(0, opinionTarget - opinionPublished)} missing)
                </>
              )}
            </p>
            <Link
              href="/admin/articles/new"
              className="articles-hero-guide-link"
            >
              + Create an Opinion article
            </Link>
          </article>
        </div>

        <ol className="articles-hero-guide-steps">
          <li>
            <Link href="/admin/articles/new">New article</Link> → title, featured image, excerpt,
            content, author.
          </li>
          <li>Choose the <strong>topic section</strong> (Politics, Feature, Opinion…).</li>
          <li>
            Check <strong>Homepage feature</strong> only for the main hero article.
          </li>
          <li>Set status to <strong>Published</strong> and save.</li>
          <li>
            Repeat for <strong>5–6 varied articles</strong> + <strong>2–3 in Opinion</strong>.
          </li>
        </ol>

        <p className="articles-hero-guide-footnote">
          The homepage updates in ~1 minute. To disable any remaining placeholder content:{" "}
          <code>ENABLE_DEMO_CONTENT=false</code> in <code>.env.local</code>.
        </p>
      </div>
    </details>
  );
}
