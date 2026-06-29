import { getHomePageData } from "@/lib/data";
import { mapHomePageData } from "@/lib/map-home-data";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { HomeBackdrop } from "@/components/site-chrome/HomeBackdrop";
import { RevolutionShell } from "@/components/site-chrome/RevolutionShell";
import { HeroHome } from "@/components/site-chrome/HeroHome";
import { MegaAd } from "@/components/site-chrome/MegaAd";
import { EditorsChoiceSection } from "@/components/site-chrome/EditorsChoiceSection";
import { LatestSection } from "@/components/site-chrome/LatestSection";
import { VideoSectionHome } from "@/components/site-chrome/VideoSectionHome";
import { HomeRubriquesBand } from "@/components/site-chrome/HomeRubriquesBand";
import { HomeClosingBand } from "@/components/site-chrome/HomeClosingBand";
import { SectionDivider } from "@/components/site-chrome/SectionDivider";

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
            opinions={sections.insights ? data.opinions : []}
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
