import Link from "next/link";
import type { HomeLatest } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionHeader } from "@/components/site-chrome/SectionHeader";

interface LatestSectionProps {
  data: HomeLatest;
}

export function LatestSection({ data }: LatestSectionProps) {
  const { featured, items } = data;

  return (
    <div className="section section-premium section-cream section-live">
      <div className="container">
        <SectionHeader
          eyebrow="News"
          title="Latest Updates"
          linkHref="/news"
          linkLabel="View all"
        />
        <div className="latest-layout">
          <Link href={featured.slug ?? "#"} className="latest-featured-h reveal">
            <div className="latest-featured-h-media">
              <SectionImage src={featured.image} alt={featured.title} sizes="(max-width: 768px) 100vw, 520px" />
            </div>
            <div className="latest-featured-h-body">
              <span className="tag">{featured.cat}</span>
              <div className="ec-card-title latest-featured-title">{featured.title}</div>
              <div className="ec-card-meta">
                <span>{featured.author ?? "Editorial"}</span>
                <span>·</span>
                <span>{featured.meta}</span>
              </div>
            </div>
          </Link>

          <div className="latest-timeline reveal" data-reveal-delay={100}>
            <div className="latest-timeline-line" aria-hidden />
            {items.map((item, i) => {
              const content = (
                <>
                  <span className="latest-item-rank">{String(i + 1).padStart(2, "0")}</span>
                  <div className="latest-item-img">
                    <SectionImage src={item.image} alt={item.title} sizes="100px" />
                  </div>
                  <div className="latest-item-content">
                    <div className="latest-item-cat">{item.cat}</div>
                    <div className="latest-item-title">{item.title}</div>
                    <div className="latest-item-time">{item.meta}</div>
                  </div>
                </>
              );

              return item.slug ? (
                <Link key={item.slug} href={item.slug} className="latest-item latest-item-premium">
                  {content}
                </Link>
              ) : (
                <div key={item.title} className="latest-item latest-item-premium">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
