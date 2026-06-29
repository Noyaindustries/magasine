import Link from "next/link";
import type { HomeRubriqueBlock } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { formatHomeCardMeta } from "@/lib/format-article";

interface RubriqueSectionHomeProps {
  block: HomeRubriqueBlock;
  index: number;
}

export function RubriqueSectionHome({ block, index }: RubriqueSectionHomeProps) {
  const [featured, ...rest] = block.articles;

  return (
    <div
      id={`rubrique-${block.slug}`}
      className={`rubrique-block${index % 2 === 1 ? " rubrique-block--alt" : ""}`}
    >
      <div className="rubrique-block-header">
        <h3 className="rubrique-block-title">{block.title}</h3>
        <Link href={block.href} className="rubrique-block-link">
          View all
        </Link>
      </div>

      <div className="rubrique-block-grid">
        {featured?.slug && (
          <Link href={featured.slug} className="rubrique-block-featured">
            <div className="rubrique-block-featured-media">
              <SectionImage src={featured.image} alt={featured.title} sizes="(max-width: 768px) 100vw, 360px" />
            </div>
            <div className="rubrique-block-featured-body">
              <div className="ec-card-cat">{featured.cat}</div>
              <div className="ec-card-title ec-card-title-sm">{featured.title}</div>
              {featured.excerpt && <p className="ec-card-excerpt ec-card-excerpt-sm">{featured.excerpt}</p>}
              <div className="ec-card-meta">
                <span>{featured.author ?? "Editorial"}</span>
                <span>·</span>
                <span>{featured.meta}</span>
              </div>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="rubrique-block-list">
            {rest.map((item) =>
              item.slug ? (
                <Link key={item.slug} href={item.slug} className="rubrique-block-item">
                  <div className="rubrique-block-item-img">
                    <SectionImage src={item.image} alt={item.title} sizes="80px" />
                  </div>
                  <div className="rubrique-block-item-body">
                    <div className="rubrique-block-item-cat">{item.cat}</div>
                    <div className="rubrique-block-item-title">{item.title}</div>
                    <div className="rubrique-block-item-meta">{formatHomeCardMeta(item)}</div>
                  </div>
                </Link>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
