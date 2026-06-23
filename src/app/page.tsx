import { getHomePageData } from "@/lib/data";
import { mapHomePageData } from "@/lib/map-home-data";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { HomeBackdrop } from "@/components/presse-ivoire/HomeBackdrop";
import { RevolutionShell } from "@/components/presse-ivoire/RevolutionShell";
import { HeroHome } from "@/components/presse-ivoire/HeroHome";
import { MegaAd } from "@/components/presse-ivoire/MegaAd";
import { EditorsChoiceSection } from "@/components/presse-ivoire/EditorsChoiceSection";
import { LatestSection } from "@/components/presse-ivoire/LatestSection";
import { VideoSectionHome } from "@/components/presse-ivoire/VideoSectionHome";
import { OpinionSectionHome } from "@/components/presse-ivoire/OpinionSectionHome";
import { HomeRubriquesBand } from "@/components/presse-ivoire/HomeRubriquesBand";
import { HomeClosingBand } from "@/components/presse-ivoire/HomeClosingBand";
import { SectionDivider } from "@/components/presse-ivoire/SectionDivider";

export const revalidate = 60;

export default async function HomePage() {
  const [raw, siteSettings] = await Promise.all([getHomePageData(), getPublicSiteSettings()]);
  const data = mapHomePageData(raw);
  const sections = siteSettings.homeSections;

  return (
    <div className="home-page home-page--revolution">
      <HomeBackdrop />
      <RevolutionShell />

      {sections.hero && (
        <section className="home-band home-band--hero">
          <HeroHome
            data={data}
            latest={data.latest}
            newsletterEnabled={siteSettings.newsletterEnabled}
          />
        </section>
      )}

      {sections.megaAd && (
        <section className="home-band home-band--ad">
          <MegaAd />
        </section>
      )}

      {sections.editorial && (
        <>
          <SectionDivider label="Editorial" />
          <section className="home-band home-band--editorial">
            <EditorsChoiceSection data={data.editorsChoice} />
          </section>
        </>
      )}

      {sections.insights && data.opinions.length > 0 && (
        <section className="home-band home-band--opinion">
          <OpinionSectionHome data={data.opinions} />
        </section>
      )}

      {sections.rubriques && (
        <>
          <SectionDivider label="By subject" />
          <HomeRubriquesBand rubriques={data.rubriques} />
        </>
      )}

      {sections.live && (
        <>
          <SectionDivider label="Latest" />
          <section className="home-band home-band--live">
            <LatestSection data={data.latest} />
          </section>
        </>
      )}

      {sections.media && (
        <>
          <SectionDivider label="Multimedia" />
          <section className="home-band home-band--media">
            <VideoSectionHome data={data.videos} />
          </section>
        </>
      )}

      {sections.closing && <HomeClosingBand settings={siteSettings} />}
    </div>
  );
}
