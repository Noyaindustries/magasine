import Link from "next/link";
import { ArticleCard } from "@/components/article/ArticleCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ArticleListItem } from "@/types";

interface SidebarProps {
  topStories: ArticleListItem[];
  popularTags: { name: string; count: number }[];
}

export function Sidebar({ topStories, popularTags }: SidebarProps) {
  return (
    <aside className="space-y-10">
      <div className="bg-surface border border-border rounded-sm p-6 shadow-card">
        <h3 className="font-serif text-lg font-bold text-charcoal mb-1">Top Stories</h3>
        <div className="w-12 h-0.5 bg-gold mb-5" />
        {topStories.map((article) => (
          <ArticleCard key={article._id} article={article} variant="compact" />
        ))}
      </div>

      <div className="bg-surface-elevated border border-border-gold rounded-sm p-6">
        <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold-dark mb-4">
          Popular Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Link
              key={tag.name}
              href={`/search?q=${encodeURIComponent(tag.name)}`}
              className="px-3 py-1.5 text-xs bg-muted-bg text-muted hover:bg-gold-light hover:text-gold-dark rounded-sm transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-charcoal text-white rounded-sm p-6 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold mb-2">Advertisement</p>
        <div className="aspect-[300/250] bg-white/5 border border-white/10 rounded-sm flex items-center justify-center">
          <span className="text-xs text-white/30">300 × 250</span>
        </div>
      </div>
    </aside>
  );
}

export function EditorsChoice({ articles }: { articles: ArticleListItem[] }) {
  if (!articles.length) return null;

  return (
    <section id="editors-choice" className="mb-16">
      <SectionTitle
        title="Editor's Choice"
        subtitle="Editorial selection"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((article, i) => (
          <ArticleCard
            key={article._id}
            article={article}
            className={i === 0 ? "md:col-span-1" : ""}
          />
        ))}
      </div>
    </section>
  );
}

export function LatestUpdates({ articles }: { articles: ArticleListItem[] }) {
  if (!articles.length) return null;

  return (
    <section className="mb-16">
      <SectionTitle title="Latest Updates" subtitle="Live feed" />
      <div className="space-y-3">
        {articles.map((article) => (
          <ArticleCard key={article._id} article={article} variant="horizontal" />
        ))}
      </div>
    </section>
  );
}

export function AdBanner({ size = "728x90" }: { size?: "728x90" | "300x250" }) {
  const dimensions = size === "728x90" ? "aspect-[728/90]" : "aspect-[300/250]";

  return (
    <div className={`${dimensions} max-w-full mx-auto bg-muted-bg border border-dashed border-border rounded-sm flex items-center justify-center mb-16`}>
      <span className="text-xs text-muted tracking-wider uppercase">
        Ad space {size}
      </span>
    </div>
  );
}

export function VideoSection({ articles }: { articles: ArticleListItem[] }) {
  if (!articles.length) return null;

  return (
    <section className="mb-16 luxury-gradient rounded-sm p-8 lg:p-10 border border-border-gold/30">
      <SectionTitle
        title="Featured Videos"
        subtitle="Video"
        href="/videos"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article._id} article={article} variant="video" />
        ))}
      </div>
    </section>
  );
}

export function ThematicSection({
  title,
  subtitle,
  articles,
  href,
}: {
  title: string;
  subtitle: string;
  articles: ArticleListItem[];
  href: string;
}) {
  if (!articles.length) return null;

  return (
    <section className="mb-16">
      <SectionTitle title={title} subtitle={subtitle} href={href} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article._id} article={article} />
        ))}
      </div>
    </section>
  );
}
