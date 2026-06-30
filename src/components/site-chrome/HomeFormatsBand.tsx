import type { HomeRubriqueBlock } from "@/types/home";
import { TopicRowHome } from "@/components/site-chrome/TopicRowHome";

interface HomeFormatsBandProps {
  formats: HomeRubriqueBlock[];
}

export function HomeFormatsBand({ formats }: HomeFormatsBandProps) {
  const visible = formats.filter((block) => block.articles.length > 0);
  if (visible.length === 0) return null;

  return (
    <section className="home-band home-band--formats" aria-label="Videos, podcasts, and visual stories">
      <div className="container home-topics-stack">
        {visible.map((block, index) => (
          <TopicRowHome key={block.slug} block={block} index={index} />
        ))}
      </div>
    </section>
  );
}
