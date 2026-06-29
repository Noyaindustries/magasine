import type { HomeLatest, HomeOpinion, HomePageViewModel } from "@/types/home";
import { HeroLeadImage, HeroLeadStory } from "@/components/site-chrome/HeroLead";
import { HeroAlsoRead } from "@/components/site-chrome/HeroAlsoRead";
import { HeroOpinionSection } from "@/components/site-chrome/HeroOpinionSection";
import { LatestNewsColumn } from "@/components/site-chrome/LatestNewsColumn";

interface HeroHomeProps {
  data: Pick<HomePageViewModel, "heroSlides" | "miniCards">;
  opinions: HomeOpinion[];
  latest: HomeLatest;
  newsletterEnabled?: boolean;
}

export function HeroHome({ data, opinions, latest, newsletterEnabled = true }: HeroHomeProps) {
  const slide = data.heroSlides[0];
  if (!slide) return null;

  return (
    <section className="hero hero-premium">
      <div className="container hero-shell">
        <div className="hero-grid hero-grid--amargi">
          <div className="hero-lead reveal">
            <HeroLeadImage slide={slide} />
          </div>

          <div className="hero-center reveal" data-reveal-delay={80}>
            <HeroLeadStory slide={slide} />
          </div>

          <div className="hero-also-read hero-also-read--band reveal" data-reveal-delay={100}>
            <HeroAlsoRead cards={data.miniCards} />
          </div>

          <div className="hero-opinion-band reveal" data-reveal-delay={120}>
            <HeroOpinionSection opinions={opinions} />
          </div>

          <LatestNewsColumn data={latest} newsletterEnabled={newsletterEnabled} />
        </div>
      </div>
    </section>
  );
}
