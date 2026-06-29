import Link from "next/link";
import type { HomeRubriqueBlock } from "@/types/home";
import { SectionImage } from "@/components/site-chrome/SectionImage";
import { formatHomeCardMeta } from "@/lib/format-article";

interface TopicRowHomeProps {
  block: HomeRubriqueBlock;
  index: number;
}

export function TopicRowHome({ block, index }: TopicRowHomeProps) {
  const articles = block.articles.slice(0, 4);
  if (articles.length === 0) return null;

  return (
    <section
      className={`topic-row reveal${index % 2 === 1 ? " topic-row--alt" : ""}`}
      data-reveal-delay={index * 50}
      aria-labelledby={`topic-row-${block.slug}`}
    >
      <div className="topic-row-header">
        <h3 id={`topic-row-${block.slug}`} className="topic-row-title">
          {block.title}
        </h3>
        <Link href={block.href} className="topic-row-link">
          View all
        </Link>
      </div>

      <div className="topic-row-grid">
        {articles.map((article, i) =>
          article.slug ? (
            <Link
              key={article.slug}
              href={article.slug}
              className="topic-row-card"
              data-reveal-delay={i * 40}
            >
              <div className="topic-row-card-media">
                <SectionImage
                  src={article.image}
                  alt={article.title}
                  sizes="(max-width: 768px) 45vw, 280px"
                />
              </div>
              <div className="topic-row-card-body">
                <span className="topic-row-card-cat">{article.cat}</span>
                <h4 className="topic-row-card-title">{article.title}</h4>
                <span className="topic-row-card-meta">{formatHomeCardMeta(article)}</span>
              </div>
            </Link>
          ) : null
        )}
      </div>
    </section>
  );
}
