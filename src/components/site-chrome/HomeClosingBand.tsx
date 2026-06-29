import { NewsletterBanner } from "@/components/site-chrome/NewsletterBanner";
import type { PublicSiteSettings } from "@/lib/site-settings";

interface HomeClosingBandProps {
  settings: Pick<
    PublicSiteSettings,
    | "newsletterEnabled"
    | "newsletterTitle"
    | "newsletterTitleEm"
    | "newsletterDescription"
    | "newsletterBenefits"
  >;
}

export function HomeClosingBand({ settings }: HomeClosingBandProps) {
  return (
    <section className="home-band home-band--closing" aria-label="Newsletter">
      <NewsletterBanner
        enabled={settings.newsletterEnabled}
        title={settings.newsletterTitle}
        titleEm={settings.newsletterTitleEm}
        description={settings.newsletterDescription}
        benefits={settings.newsletterBenefits}
      />
    </section>
  );
}
