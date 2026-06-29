import { OpinionSectionHome } from "@/components/site-chrome/OpinionSectionHome";
import { ThematicSectionHome } from "@/components/site-chrome/ThematicSectionHome";
import type { HomeOpinion, HomeThematicCol } from "@/types/home";

interface HomeInsightsBandProps {
  opinions: HomeOpinion[];
  thematic: HomeThematicCol[];
}

export function HomeInsightsBand({ opinions, thematic }: HomeInsightsBandProps) {
  return (
    <section className="home-band home-band--insights" aria-label="Analysis and sections">
      <div className="container home-insights-layout">
        <OpinionSectionHome data={opinions} embedded />
        <ThematicSectionHome data={thematic} embedded />
      </div>
    </section>
  );
}
