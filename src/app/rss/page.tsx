import type { Metadata } from "next";
import Link from "next/link";
import { Rss, Globe2, Zap, Radio } from "lucide-react";
import { CopyFeedButton } from "@/components/utilities/CopyFeedButton";
import { FOOTER_COLS } from "@/data/site-home";
import { getFeedUrl, getSiteUrl, PUBLISHER_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: "RSS Feeds",
  description: `Subscribe to ${SITE_NAME} RSS feeds — breaking news and regional editions from the Global South. Published by ${PUBLISHER_NAME}.`,
};

const READERS = [
  { name: "Feedly", url: "https://feedly.com/i/subscription/feed/" },
  { name: "Inoreader", url: "https://www.inoreader.com/?add_feed=" },
  { name: "NewsBlur", url: "https://newsblur.com/?url=" },
];

const REGION_FEEDS = FOOTER_COLS.regions.map((region) => ({
  label: region.label,
  slug: region.href.replace("/category/", ""),
}));

export default function RssPage() {
  const feedUrl = getFeedUrl();
  const siteUrl = getSiteUrl();

  return (
    <div className="utility-page">
      <header className="utility-hero">
        <div className="utility-hero-ornament" aria-hidden />
        <div className="container utility-hero-inner">
          <span className="utility-eyebrow">
            <Rss className="utility-eyebrow-icon" aria-hidden />
            Syndication
          </span>
          <h1 className="utility-title">
            RSS feeds
            <span> from the Global South</span>
          </h1>
          <p className="utility-lead">
            {SITE_TAGLINE}. Add our feeds to your favourite reader and get new stories
            as soon as they are published — free, without an account.
          </p>
        </div>
      </header>

      <div className="container utility-body utility-body--split">
        <section className="utility-card" aria-labelledby="rss-main-heading">
          <h2 id="rss-main-heading">Main feed</h2>
          <p className="utility-card-sub">
            All published articles, newest first (up to 40 items per request).
          </p>
          <div className="utility-feed-url">
            <code>{feedUrl}</code>
            <CopyFeedButton feedUrl={feedUrl} />
          </div>
          <div className="utility-feed-actions">
            <a href={feedUrl} className="utility-hero-btn utility-hero-btn--primary">
              Open XML feed
            </a>
            <Link href="/sitemap" className="utility-hero-btn">
              Browse sitemap
            </Link>
          </div>

          <h3 className="utility-subheading">Add to your reader</h3>
          <ul className="utility-reader-list">
            {READERS.map((reader) => (
              <li key={reader.name}>
                <a
                  href={`${reader.url}${encodeURIComponent(feedUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe with {reader.name}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <aside className="utility-aside">
          <h2>Regional feeds</h2>
          <p className="utility-aside-lead">
            Filter stories by region using category parameters on the main feed URL.
          </p>
          <ul className="utility-feed-list">
            {REGION_FEEDS.map((region) => {
              const regionalUrl = `${feedUrl}?category=${region.slug}`;
              return (
                <li key={region.slug}>
                  <div className="utility-feed-list-head">
                    <Globe2 className="w-4 h-4" aria-hidden />
                    <strong>{region.label}</strong>
                  </div>
                  <code className="utility-feed-list-url">{regionalUrl}</code>
                  <div className="utility-feed-list-actions">
                    <a href={regionalUrl}>Open feed</a>
                    <CopyFeedButton feedUrl={regionalUrl} label="Copy" />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="utility-aside-box">
            <Zap className="utility-aside-box-icon" aria-hidden />
            <div>
              <h3>Breaking news</h3>
              <p>
                For live alerts, visit our{" "}
                <Link href="/urgent">breaking feed</Link> or subscribe to the{" "}
                <Link href="/newsletter">newsletter</Link>.
              </p>
            </div>
          </div>

          <div className="utility-aside-box utility-aside-box--muted">
            <Radio className="utility-aside-box-icon" aria-hidden />
            <div>
              <h3>Publisher</h3>
              <p>
                {SITE_NAME} is published by {PUBLISHER_NAME}. Technical enquiries:{" "}
                <a href="mailto:tech@globalsouthwatch.com">tech@globalsouthwatch.com</a>
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="utility-steps" aria-label="How RSS works">
        <div className="container">
          <p className="utility-steps-label">How it works</p>
          <div className="utility-steps-grid">
            {[
              { num: "01", title: "Copy a feed URL", text: "Use the main feed or a regional variant above." },
              { num: "02", title: "Paste in your reader", text: "Feedly, Inoreader, Apple News, or any RSS app." },
              { num: "03", title: "Get new stories", text: "Updates arrive automatically when we publish." },
            ].map((step) => (
              <article key={step.num} className="utility-step">
                <span className="utility-step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
          <p className="utility-footer-note utility-footer-note--center">
            Legacy URL <code>/api/feed</code> remains available and mirrors <code>{siteUrl}/feed.xml</code>.
          </p>
        </div>
      </section>
    </div>
  );
}
