import type { HomeLatest, HomePageViewModel } from "@/types/home";
import {
  HeroCarouselMedia,
  HeroCarouselProvider,
  HeroCarouselStory,
} from "@/components/presse-ivoire/HeroCarousel";
import { HeroAlsoRead } from "@/components/presse-ivoire/HeroAlsoRead";
import { LatestNewsColumn } from "@/components/presse-ivoire/LatestNewsColumn";

interface HeroHomeProps {
  data: Pick<HomePageViewModel, "heroSlides" | "miniCards">;
  latest: HomeLatest;
  newsletterEnabled?: boolean;
}

export function HeroHome({ data, latest, newsletterEnabled = true }: HeroHomeProps) {
  if (data.heroSlides.length === 0) return null;

  return (
    <section className="hero hero-premium">
      <div className="container hero-shell">
        <HeroCarouselProvider slides={data.heroSlides}>
          <div className="hero-grid hero-grid--amargi">
            <div className="hero-lead reveal">
              <HeroCarouselMedia />
            </div>

            <div className="hero-center reveal" data-reveal-delay={80}>
              <HeroCarouselStory />
            </div>

            <div className="hero-also-read reveal" data-reveal-delay={120}>
              <HeroAlsoRead cards={data.miniCards} />
            </div>

            <LatestNewsColumn data={latest} newsletterEnabled={newsletterEnabled} />
          </div>
        </HeroCarouselProvider>
      </div>
    </section>
  );
}
