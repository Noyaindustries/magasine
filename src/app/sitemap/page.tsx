import type { Metadata } from "next";
import Link from "next/link";
import { Map, FileCode2, Rss, ExternalLink } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { FOOTER_COLS } from "@/data/site-home";
import { mockCategories } from "@/lib/mock-data";
import { filterRetiredCategories } from "@/lib/retired-categories";
import { getSiteUrl, getSitemapUrl, PUBLISHER_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sitemap",
  description: `Browse all pages, sections, and articles on ${SITE_NAME} — published by ${PUBLISHER_NAME}.`,
};

const MAIN_LINKS = [
  { label: "Home", href: "/" },
  { label: "All news", href: "/news" },
  { label: "About us", href: "/about" },
  { label: "Our mission", href: "/about#mission" },
  { label: "Breaking news", href: "/urgent" },
  { label: "Search", href: "/search" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Donate", href: "/donate" },
  { label: "Videos", href: "/videos" },
  { label: "Podcasts", href: "/podcasts" },
];

const ACCOUNT_LINKS = [
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/register" },
  { label: "My profile", href: "/profile" },
];

const FEED_LINKS = [
  { label: "RSS feeds hub", href: "/rss" },
  { label: "Main RSS feed (XML)", href: "/feed.xml" },
  { label: "Machine sitemap (XML)", href: "/sitemap.xml" },
];

async function getSitemapData() {
  let articleCount = 0;
  let recentArticles: { title: string; slug: string }[] = [];
  let categories: { name: string; slug: string }[] = [];

  try {
    await connectDB();
    const [count, recent, cats] = await Promise.all([
      Article.countDocuments({ status: "published" }),
      Article.find({ status: "published" })
        .sort({ publishedAt: -1 })
        .limit(12)
        .select("title slug")
        .lean(),
      Category.find({ isActive: true }).sort({ order: 1 }).select("name slug").lean(),
    ]);
    articleCount = count;
    recentArticles = recent.map((a) => ({ title: a.title, slug: a.slug }));
    categories = filterRetiredCategories(cats.map((c) => ({ name: c.name, slug: c.slug })));
  } catch {
    categories = mockCategories.map((c) => ({ name: c.name, slug: c.slug }));
    articleCount = 0;
  }

  if (categories.length === 0) {
    categories = mockCategories.map((c) => ({ name: c.name, slug: c.slug }));
  }

  return { articleCount, recentArticles, categories };
}

export default async function SitemapPage() {
  const { articleCount, recentArticles, categories } = await getSitemapData();
  const xmlUrl = getSitemapUrl();

  return (
    <div className="utility-page">
      <header className="utility-hero">
        <div className="utility-hero-ornament" aria-hidden />
        <div className="container utility-hero-inner">
          <span className="utility-eyebrow">
            <Map className="utility-eyebrow-icon" aria-hidden />
            Site navigation
          </span>
          <h1 className="utility-title">
            Sitemap
            <span> {SITE_NAME}</span>
          </h1>
          <p className="utility-lead">
            Find every major section of our newsroom — regions, formats, legal pages,
            and the latest published stories. Published by {PUBLISHER_NAME}.
          </p>
          <div className="utility-hero-actions">
            <a href={xmlUrl} className="utility-hero-btn utility-hero-btn--primary">
              <FileCode2 className="w-4 h-4" aria-hidden />
              XML sitemap
            </a>
            <Link href="/rss" className="utility-hero-btn">
              <Rss className="w-4 h-4" aria-hidden />
              RSS feeds
            </Link>
          </div>
        </div>
      </header>

      <div className="container utility-body">
        <div className="utility-sitemap-grid">
          <section className="utility-panel" aria-labelledby="sitemap-main">
            <h2 id="sitemap-main">Main pages</h2>
            <ul className="utility-link-list">
              {MAIN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-regions">
            <h2 id="sitemap-regions">Regions</h2>
            <ul className="utility-link-list">
              {FOOTER_COLS.regions.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-sections">
            <h2 id="sitemap-sections">Editorial sections</h2>
            <ul className="utility-link-list">
              {FOOTER_COLS.sections.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-formats">
            <h2 id="sitemap-formats">Formats</h2>
            <ul className="utility-link-list">
              {FOOTER_COLS.formats.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-about">
            <h2 id="sitemap-about">About &amp; contact</h2>
            <ul className="utility-link-list">
              {FOOTER_COLS.about.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-legal">
            <h2 id="sitemap-legal">Legal &amp; trust</h2>
            <ul className="utility-link-list">
              {FOOTER_COLS.legal.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/accessibility">Accessibility</Link>
              </li>
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-account">
            <h2 id="sitemap-account">Reader account</h2>
            <ul className="utility-link-list">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="utility-panel" aria-labelledby="sitemap-feeds">
            <h2 id="sitemap-feeds">Feeds &amp; syndication</h2>
            <ul className="utility-link-list">
              {FEED_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="utility-wide-panel" aria-labelledby="sitemap-categories">
          <div className="utility-wide-panel-head">
            <h2 id="sitemap-categories">All categories</h2>
            <p>{categories.length} active sections · {articleCount > 0 ? `${articleCount} published articles` : "articles indexed in XML sitemap"}</p>
          </div>
          <ul className="utility-chip-list">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link href={`/category/${cat.slug}`} className="utility-chip">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {recentArticles.length > 0 && (
          <section className="utility-wide-panel" aria-labelledby="sitemap-recent">
            <div className="utility-wide-panel-head">
              <h2 id="sitemap-recent">Latest articles</h2>
              <Link href="/search" className="utility-inline-link">
                View all <ExternalLink className="w-3.5 h-3.5" aria-hidden />
              </Link>
            </div>
            <ol className="utility-article-list">
              {recentArticles.map((article) => (
                <li key={article.slug}>
                  <Link href={`/article/${article.slug}`}>{article.title}</Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="utility-footer-note">
          Search engines and aggregators should use the{" "}
          <a href={xmlUrl}>XML sitemap</a> at {getSiteUrl()}/sitemap.xml.
        </p>
      </div>
    </div>
  );
}
