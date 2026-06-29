import type { HomeRubriqueBlock } from "@/types/home";
import { TopicRowHome } from "@/components/site-chrome/TopicRowHome";

interface HomeRubriquesBandProps {
  rubriques: HomeRubriqueBlock[];
}

export function HomeRubriquesBand({ rubriques }: HomeRubriquesBandProps) {
  if (rubriques.length === 0) return null;

  return (
    <section className="home-band home-band--topics" aria-label="Stories by subject">
      <div className="container home-topics-stack">
        {rubriques.map((block, index) => (
          <TopicRowHome key={block.slug} block={block} index={index} />
        ))}
      </div>
    </section>
  );
}
