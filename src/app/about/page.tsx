import type { Metadata } from "next";
import { AboutPageView } from "@/components/about/AboutPageView";
import { getAboutPageContent } from "@/lib/about-page";
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
  const content = await getAboutPageContent();
  return <AboutPageView content={content} />;
}
