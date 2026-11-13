import type { Metadata } from "next";
import { AboutPageView } from "@/components/about/AboutPageView";
import { getAboutPageContent } from "@/lib/about-page";
import { getPublicSiteSettings } from "@/lib/site-settings";
import "./about-page.css";
export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutPageContent();
  return {
    title: "About",
    description: content.metaDescription,
  };
}

export default async function AProposPage() {
  const [content, settings] = await Promise.all([
    getAboutPageContent(),
    getPublicSiteSettings(),
  ]);
  const location = settings.contactLocation.trim();
  const glanceItems = location
    ? content.glanceItems.map((item) =>
        item.label.trim().toLowerCase() === "headquarters" ? { ...item, value: location } : item
      )
    : content.glanceItems;

  return <AboutPageView content={{ ...content, glanceItems }} />;
}
