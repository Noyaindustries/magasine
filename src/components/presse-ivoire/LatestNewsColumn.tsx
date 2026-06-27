import Link from "next/link";
import type { HomeLatest } from "@/types/home";
import { SectionImage } from "@/components/presse-ivoire/SectionImage";
import { HeroLatestAllNewsCta } from "@/components/presse-ivoire/HeroLatestAllNewsCta";
import { HeroLatestNewsletter } from "@/components/presse-ivoire/HeroLatestNewsletter";
import { formatHomeCardMeta } from "@/lib/format-article";

interface LatestNewsColumnProps {
  data: HomeLatest;
  newsletterEnabled?: boolean;
}

export function LatestNewsColumn({ data, newsletterEnabled = true }: LatestNewsColumnProps) {
  const { featured, items } = data;
  const visibleCount = (featured.slug ? 1 : 0) + items.length;

  return (
    <aside className="hero-latest-column reveal visible" data-reveal-delay={160}>
      <div className="hero-latest-panel">
        <div className="hero-latest-header">
          <h3 className="hero-latest-title">Latest News</h3>
        </div>

        {featured.slug && (
          <Link href={featured.slug} className="hero-latest-featured">
            <div className="hero-latest-featured-media">
              <SectionImage src={featured.image} alt={featured.title} sizes="96px" />
            </div>
            <div className="hero-latest-featured-body">
              <span className="hero-latest-cat">{featured.cat}</span>
              <p className="hero-latest-featured-title">{featured.title}</p>
              <span className="hero-latest-meta">{formatHomeCardMeta(featured)}</span>
            </div>
          </Link>
        )}

        <ul className="hero-latest-list">
          {items.map((item, i) => {
            const body = (
              <>
                <div className="hero-latest-item-media">
                  <SectionImage src={item.image} alt={item.title} sizes="72px" />
                </div>
                <div className="hero-latest-item-body">
                  <span className="hero-latest-item-cat">{item.cat}</span>
                  <span className="hero-latest-item-title">{item.title}</span>
                  <span className="hero-latest-item-meta">{formatHomeCardMeta(item)}</span>
                </div>
              </>
            );

            return (
              <li key={item.slug ?? `${item.title}-${i}`}>
                {item.slug ? (
                  <Link href={item.slug} className="hero-latest-item">
                    {body}
                  </Link>
                ) : (
                  <div className="hero-latest-item">{body}</div>
                )}
              </li>
            );
          })}
        </ul>

        <HeroLatestAllNewsCta visibleCount={visibleCount} />

        <HeroLatestNewsletter enabled={newsletterEnabled} />
      </div>
    </aside>
  );
}
