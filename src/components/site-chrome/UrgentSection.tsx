import Link from "next/link";
import type { HomeUrgent } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionHeader } from "@/components/site-chrome/SectionHeader";

interface UrgentSectionProps {
  data: HomeUrgent;
}

export function UrgentSection({ data }: UrgentSectionProps) {
  const [featured, ...rest] = data.articles;

  return (
    <section id="urgent" className="home-band home-band--urgent" aria-label="Breaking news">
      <div className="container">
        <SectionHeader
          eyebrow="Alert feed"
          title="🔥 Breaking — Live"
          linkHref="/urgent"
          linkLabel="All breaking news"
        />

        {data.alerts.length > 0 && (
          <div className="urgent-alerts">
            {data.alerts.slice(0, 5).map((alert) =>
              alert.link ? (
                <Link key={alert.text} href={alert.link} className="urgent-alert-pill">
                  <span className="breaking-dot" aria-hidden />
                  {alert.text}
                </Link>
              ) : (
                <span key={alert.text} className="urgent-alert-pill">
                  <span className="breaking-dot" aria-hidden />
                  {alert.text}
                </span>
              )
            )}
          </div>
        )}

        {featured && (
          <Link href={featured.slug} className="ec-card-h ec-card-h--featured urgent-featured-h">
            <div className="ec-card-h-media">
              <SectionImage src={featured.image} alt={featured.title} sizes="(max-width: 768px) 100vw, 520px" />
              <span className="breaking-badge">
                <span className="breaking-dot" />
                Breaking
              </span>
            </div>
            <div className="ec-card-h-content">
              <span className="tag">{featured.cat}</span>
              <h3 className="ec-card-title large">{featured.title}</h3>
              <p className="ec-card-meta">
                <span>{featured.meta}</span>
              </p>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="urgent-list">
            {rest.map((item) => (
              <Link key={item.slug} href={item.slug} className="ec-card-h ec-card-h--compact urgent-list-item">
                <span className="urgent-list-num" aria-hidden>
                  {item.num}
                </span>
                <div className="ec-card-h-media">
                  <SectionImage src={item.image} alt={item.title} sizes="120px" />
                </div>
                <div className="ec-card-h-content">
                  <div className="ec-card-cat">{item.cat}</div>
                  <div className="ec-card-title ec-card-title-sm">{item.title}</div>
                  <div className="ec-card-meta">
                    <span>{item.meta}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
