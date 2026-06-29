import Link from "next/link";
import type { HomeCard } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { formatHomeCardMeta } from "@/lib/format-article";

interface HeroAlsoReadProps {
  cards: HomeCard[];
}

function AlsoReadRow({ cards, rowOffset }: { cards: HomeCard[]; rowOffset: number }) {
  return (
    <div className="hero-sub-articles hero-sub-articles--grid-3">
      {cards.map((card, i) => (
        <Link
          key={card.slug ?? card.title}
          href={card.slug ?? "#"}
          className="mini-card-h reveal visible"
          data-reveal-delay={(rowOffset + i) * 60}
        >
          <div className="mini-card-h-media">
            <SectionImage src={card.image} alt={card.title} sizes="(max-width: 768px) 33vw, 200px" />
            <span className="mini-card-index">{String(rowOffset + i + 1).padStart(2, "0")}</span>
          </div>
          <div className="mini-card-h-body">
            <div className="mini-card-cat">{card.cat}</div>
            <div className="mini-card-title">{card.title}</div>
            <div className="mini-card-meta">{formatHomeCardMeta(card)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function HeroAlsoRead({ cards }: HeroAlsoReadProps) {
  if (cards.length === 0) return null;

  const visible = cards.slice(0, 6);
  const rows = [visible.slice(0, 3), visible.slice(3, 6)].filter((row) => row.length > 0);

  return (
    <div className="hero-sub-section">
      <div className="hero-sub-header">
        <h3 className="hero-sub-title">Also read</h3>
        <Link href="/news" className="hero-sub-link">
          All news
        </Link>
      </div>
      <div className="hero-sub-articles-rows">
        {rows.map((row, rowIndex) => (
          <AlsoReadRow key={rowIndex} cards={row} rowOffset={rowIndex * 3} />
        ))}
      </div>
    </div>
  );
}
