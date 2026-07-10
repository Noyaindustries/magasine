"use client";

import Link from "next/link";
import { useSiteNav } from "@/components/site-chrome/SiteNavContext";
import { newsHubFilterHref } from "@/lib/news-hub";

interface NewsHubSectionsProps {
  sectionCounts: Record<string, number>;
  activeHref?: string;
}

export function NewsHubSections({ sectionCounts, activeHref }: NewsHubSectionsProps) {
  const { newsMenu } = useSiteNav();

  return (
    <section className="news-hub-sections" aria-labelledby="news-hub-sections-title">
      <div className="news-hub-sections-head">
        <h2 id="news-hub-sections-title">Browse news</h2>
        <p>Jump to a desk, live feed, or reporting vertical.</p>
      </div>
      <ul className="news-hub-sections-grid">
        {newsMenu.map((item) => {
          const href = newsHubFilterHref(item.href);
          const isActive = activeHref === item.href || activeHref === href;
          const count = sectionCounts[item.href] ?? 0;

          return (
            <li key={item.href}>
              <Link
                href={href}
                className={`news-hub-section-card${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="news-hub-section-card-accent" aria-hidden />
                <span className="news-hub-section-card-body">
                  <span className="news-hub-section-card-label">{item.label}</span>
                  <span className="news-hub-section-card-desc">{item.description}</span>
                </span>
                <span className="news-hub-section-card-count">
                  {count} {count === 1 ? "story" : "stories"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
