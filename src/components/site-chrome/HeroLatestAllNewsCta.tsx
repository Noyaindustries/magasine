import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { ALL_NEWS_CTA } from "@/data/site-home";

interface HeroLatestAllNewsCtaProps {
  visibleCount: number;
}

export function HeroLatestAllNewsCta({ visibleCount }: HeroLatestAllNewsCtaProps) {
  return (
    <div className="hero-latest-all-news-wrap">
      <Link href={ALL_NEWS_CTA.href} className="hero-latest-all-news">
        <span className="hero-latest-all-news-accent" aria-hidden />

        <span className="hero-latest-all-news-icon-wrap" aria-hidden>
          <Newspaper className="hero-latest-all-news-icon" size={18} strokeWidth={2} />
        </span>

        <span className="hero-latest-all-news-body">
          <span className="hero-latest-all-news-kicker">{ALL_NEWS_CTA.kicker}</span>
          <span className="hero-latest-all-news-title">{ALL_NEWS_CTA.label}</span>
          <span className="hero-latest-all-news-desc">{ALL_NEWS_CTA.description}</span>
        </span>

        <span className="hero-latest-all-news-meta">
          {visibleCount > 0 && (
            <span className="hero-latest-all-news-count">
              {visibleCount} shown
            </span>
          )}
          <span className="hero-latest-all-news-action" aria-hidden>
            <ArrowRight size={18} strokeWidth={2.25} />
          </span>
        </span>
      </Link>
    </div>
  );
}
