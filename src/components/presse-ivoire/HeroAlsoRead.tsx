import Link from "next/link";
import type { HomeCard } from "@/types/home";
import { SectionImage } from "@/components/presse-ivoire/SectionImage";

interface HeroAlsoReadProps {
  cards: HomeCard[];
}

export function HeroAlsoRead({ cards }: HeroAlsoReadProps) {
  if (cards.length === 0) return null;

  return (
    <div className="hero-sub-section">
      <div className="hero-sub-header">
        <h3 className="hero-sub-title">Also read</h3>
        <Link href="/search" className="hero-sub-link">
          All news
        </Link>
      </div>
      <div className="hero-sub-articles hero-sub-articles--grid-3">
        {cards.slice(0, 6).map((card, i) => (
          <Link
            key={card.slug ?? card.title}
            href={card.slug ?? "#"}
            className="mini-card-h reveal visible"
            data-reveal-delay={i * 60}
          >
            <div className="mini-card-h-media">
              <SectionImage src={card.image} alt={card.title} sizes="160px" />
              <span className="mini-card-index">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <div className="mini-card-h-body">
              <div className="mini-card-cat">{card.cat}</div>
              <div className="mini-card-title">{card.title}</div>
              <div className="mini-card-meta">{card.meta}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
