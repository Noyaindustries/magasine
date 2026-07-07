import Link from "next/link";
import type { HomeEditorsChoice } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { SectionHeader } from "@/components/site-chrome/SectionHeader";

interface EditorsChoiceSectionProps {
  data: HomeEditorsChoice;
}

function HorizontalCard({
  href,
  image,
  title,
  cat,
  excerpt,
  author,
  meta,
  tags,
  ribbon,
  compact = false,
  delay,
}: {
  href: string;
  image: string;
  title: string;
  cat?: string;
  excerpt?: string;
  author?: string;
  meta?: string;
  tags?: string[];
  ribbon?: string;
  compact?: boolean;
  delay?: number;
}) {
  return (
    <Link
      href={href}
      className={`ec-card-h reveal${compact ? " ec-card-h--compact" : " ec-card-h--featured"}`}
      {...(delay !== undefined ? { "data-reveal-delay": delay } : {})}
    >
      <div className="ec-card-h-media">
        <SectionImage
          src={image}
          alt={title}
          sizes={compact ? "200px" : "(max-width: 768px) 100vw, 480px"}
        />
        {ribbon && <span className="ec-card-ribbon">{ribbon}</span>}
      </div>
      <div className="ec-card-h-content">
        {tags && (
          <div className="ec-card-tags">
            <span className="tag">{tags[0]}</span>
            <span className="premium-badge">{tags[1]}</span>
          </div>
        )}
        {cat && <div className="ec-card-cat">{cat}</div>}
        <div className={`ec-card-title${compact ? " ec-card-title-sm" : " large"}`}>{title}</div>
        {excerpt && <p className={`ec-card-excerpt${compact ? " ec-card-excerpt-sm" : ""}`}>{excerpt}</p>}
        <div className="ec-card-meta">
          {author && <span>{author}</span>}
          {author && meta && <span>·</span>}
          {meta && <span>{meta}</span>}
        </div>
      </div>
    </Link>
  );
}

export function EditorsChoiceSection({ data }: EditorsChoiceSectionProps) {
  const { featured, rows, side } = data;

  if (!featured.title && rows.length === 0) return null;

  return (
    <div className="section section-premium section-editorial">
      <div className="container">
        <SectionHeader
          eyebrow="Editor's pick"
          title="Editor's Choice"
          linkHref="/search"
          linkLabel="View all"
        />
        <div className="editors-horizontal">
          <HorizontalCard
            href={featured.slug ?? "#"}
            image={featured.image}
            title={featured.title}
            excerpt={featured.excerpt}
            author={featured.author}
            meta={featured.meta}
            tags={featured.tags}
            ribbon="Featured"
          />

          <div className="editors-horizontal-grid">
            {rows.map((row, i) => (
              <HorizontalCard
                key={row.slug ?? row.title}
                href={row.slug ?? "#"}
                image={row.image}
                title={row.title}
                cat={row.cat}
                author={row.author}
                meta={row.time}
                compact
                delay={i * 60}
              />
            ))}
            <HorizontalCard
              href={side.slug ?? "#"}
              image={side.image}
              title={side.title}
              cat={side.cat}
              excerpt={side.excerpt}
              author={side.author}
              meta={side.time}
              compact
              delay={180}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
