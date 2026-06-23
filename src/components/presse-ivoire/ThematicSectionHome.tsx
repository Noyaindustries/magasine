import Link from "next/link";
import type { HomeThematicCol } from "@/types/home";
import { SectionImage } from "@/components/presse-ivoire/SectionImage";
import { SectionHeader } from "@/components/presse-ivoire/SectionHeader";

interface ThematicSectionHomeProps {
  data: HomeThematicCol[];
  embedded?: boolean;
}

export function ThematicSectionHome({ data, embedded = false }: ThematicSectionHomeProps) {
  return (
    <div className={`thematic-section thematic-section-premium${embedded ? " thematic-section--embedded" : ""}`}>
      <div className={embedded ? undefined : "container"}>
        <SectionHeader
          eyebrow="Sections"
          title="Featured by Theme"
          linkHref="/search"
          linkLabel="All sections"
        />
        <div className="thematic-grid thematic-grid-premium">
          {data.map((col, i) => (
            <div key={col.title} className="thematic-col reveal" data-reveal-delay={i * 100}>
              <div className="thematic-col-header">
                <span className="thematic-col-title">{col.title}</span>
                <Link href={col.href} className="thematic-col-link">
                  View all
                </Link>
              </div>
              {col.main.slug ? (
                <Link href={col.main.slug} className="thematic-main thematic-main-premium">
                  <div className="thematic-main-img">
                    <SectionImage src={col.main.image} alt={col.main.title} sizes="140px" />
                  </div>
                  <div>
                    <div className="thematic-main-cat">{col.main.cat}</div>
                    <div className="thematic-main-title">{col.main.title}</div>
                  </div>
                </Link>
              ) : (
                <div className="thematic-main thematic-main-premium">
                  <div className="thematic-main-img">
                    <SectionImage src={col.main.image} alt={col.main.title} sizes="140px" />
                  </div>
                  <div>
                    <div className="thematic-main-cat">{col.main.cat}</div>
                    <div className="thematic-main-title">{col.main.title}</div>
                  </div>
                </div>
              )}
              <div className="thematic-sub">
                {col.subs.map((sub) => (
                  <div key={sub.num} className="thematic-sub-item thematic-sub-item-premium">
                    <span className="sub-num">{sub.num}</span>
                    <div>
                      <div className="thematic-sub-cat">{sub.cat}</div>
                      {sub.slug ? (
                        <Link href={sub.slug} className="thematic-sub-title">
                          {sub.title}
                        </Link>
                      ) : (
                        <div className="thematic-sub-title">{sub.title}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
