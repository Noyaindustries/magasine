import { cache } from "react";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateSiteSettings, SiteSettings } from "@/models/SiteSettings";
import {
  DEFAULT_ABOUT_PAGE,
  mergeAboutPageContent,
  type AboutPageContent,
} from "@/lib/about-page-content";

export type {
  AboutGlanceItem,
  AboutPageContent,
  AboutPillar,
  AboutPillarIcon,
  AboutStat,
  AboutValue,
} from "@/lib/about-page-content";

export { ABOUT_PILLAR_ICONS, DEFAULT_ABOUT_PAGE, mergeAboutPageContent } from "@/lib/about-page-content";

export const getAboutPageContent = cache(async (): Promise<AboutPageContent> => {
  try {
    await connectDB();
    const doc = await getOrCreateSiteSettings();
    return mergeAboutPageContent(doc.aboutPage);
  } catch {
    return DEFAULT_ABOUT_PAGE;
  }
});

export async function updateAboutPageContent(patch: AboutPageContent): Promise<AboutPageContent> {
  await connectDB();
  const existing = await getOrCreateSiteSettings();
  const doc = await SiteSettings.findById(existing._id);
  if (!doc) throw new Error("Settings not found");

  doc.aboutPage = mergeAboutPageContent(patch);
  await doc.save();
  return mergeAboutPageContent(doc.aboutPage);
}
