import type { FormatPageConfig } from "@/components/format/FormatPageView";

export const FORMAT_PAGES: Record<string, FormatPageConfig> = {
  videos: {
    slug: "videos",
    number: "V1",
    eyebrow: "Multimedia",
    title: "Videos",
    lead: "Reports, interviews, and documentaries on Global South news — field reporting in motion.",
    accent: "#1a3896",
    relatedSlugs: ["multimedia", "investigations", "reportages-speciaux", "podcasts"],
    emptyMessage: "No videos published yet. Explore our written investigations and features.",
    emptyLinks: [
      { label: "Investigations", href: "/category/investigations" },
      { label: "Special reports", href: "/category/reportages-speciaux" },
    ],
    rssHref: "/feed.xml?category=multimedia",
  },
  podcasts: {
    slug: "podcasts",
    number: "P1",
    eyebrow: "Audio",
    title: "Podcasts",
    lead: "Analysis, debates, and audio stories to understand the defining issues of the Global South.",
    accent: "#94563c",
    relatedSlugs: ["multimedia", "opinion", "actualites", "videos"],
    emptyMessage: "Our podcasts are coming soon. Meanwhile, explore video reports and opinion columns.",
    emptyLinks: [
      { label: "Watch videos", href: "/videos" },
      { label: "Read opinion", href: "/category/opinion" },
    ],
    rssHref: "/feed.xml?category=multimedia",
  },
  infographics: {
    slug: "infographics",
    number: "I1",
    eyebrow: "Visual data",
    title: "Infographics",
    lead: "Charts, maps, and visual explainers that make complex Global South stories accessible at a glance.",
    accent: "#4361EE",
    relatedSlugs: ["multimedia", "politique", "sante", "monde"],
    emptyMessage: "New infographics are on the way. Browse multimedia and politics coverage in the meantime.",
    emptyLinks: [
      { label: "Photo galleries", href: "/photo-galleries" },
      { label: "Politics section", href: "/category/politique" },
    ],
    rssHref: "/feed.xml?category=multimedia",
  },
  "photo-galleries": {
    slug: "photo-galleries",
    number: "G1",
    eyebrow: "Photography",
    title: "Photo galleries",
    lead: "Photo essays and visual reports from correspondents across Africa, Latin America, Asia, and the diaspora.",
    accent: "#588157",
    relatedSlugs: ["multimedia", "local", "reportages-speciaux", "investigations"],
    emptyMessage: "No photo galleries published yet. Discover our video reports and special features.",
    emptyLinks: [
      { label: "Videos", href: "/videos" },
      { label: "Features", href: "/category/reportages-speciaux" },
    ],
    rssHref: "/feed.xml?category=multimedia",
  },
};
