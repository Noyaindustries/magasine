import Link from "next/link";
import type { HomeOpinion } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";

interface HeroOpinionSectionProps {
  opinions: HomeOpinion[];
}

function OpinionRow({ opinions, rowOffset }: { opinions: HomeOpinion[]; rowOffset: number }) {
  return (
    <div className="hero-sub-articles hero-sub-articles--grid-3">
      {opinions.map((op, i) => {
        const href = op.slug ?? "/category/opinion";
        const headline = op.title ?? op.text;

        return (
          <Link
            key={op.slug ?? `hero-opinion-${rowOffset + i}`}
            href={href}
            className="mini-card-h reveal visible"
            data-reveal-delay={(rowOffset + i) * 60}
          >
            <div className="mini-card-h-media">
              <SectionImage
                src={op.image}
                alt={headline}
                sizes="(max-width: 768px) 33vw, 200px"
              />
            </div>
            <div className="mini-card-h-body">
              <div className="mini-card-cat">Opinion</div>
              <div className="mini-card-title">{headline}</div>
              <div className="mini-card-meta">{op.name}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function HeroOpinionSection({ opinions }: HeroOpinionSectionProps) {
  if (opinions.length === 0) return null;

  const visible = opinions.slice(0, 6);
  const rows = [visible.slice(0, 3), visible.slice(3, 6)].filter((row) => row.length > 0);

  return (
    <div className="hero-sub-section hero-opinion-section">
      <div className="hero-sub-header">
        <h3 className="hero-sub-title">Opinion &amp; Ideas</h3>
        <Link href="/category/opinion" className="hero-sub-link">
          All op-eds
        </Link>
      </div>
      <div className="hero-sub-articles-rows">
        {rows.map((row, rowIndex) => (
          <OpinionRow key={rowIndex} opinions={row} rowOffset={rowIndex * 3} />
        ))}
      </div>
    </div>
  );
}
