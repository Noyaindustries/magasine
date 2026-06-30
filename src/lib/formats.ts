import type { FormatPageConfig } from "@/components/format/FormatPageView";

export const FORMAT_PAGES: Record<string, FormatPageConfig> = {
  videos: {
    slug: "videos",
    eyebrow: "Video",
    title: "Videos",
    lead: "Reports, interviews, and documentaries on Global South news â€” field reporting in motion.",
    accent: "#1a3896",
    relatedSlugs: ["investigations", "special-reports", "podcasts", "news"],
    emptyMessage: "No videos published yet. Explore our written investigations and features.",
    emptyLinks: [
      { label: "Investigations", href: "/category/investigations" },
      { label: "Special reports", href: "/category/special-reports" },
    ],
    rssHref: "/feed.xml?category=news",
  },
  podcasts: {
    slug: "podcasts",
    eyebrow: "Audio",
    title: "Podcasts",
    lead: "Analysis, debates, and audio stories to understand the defining issues of the Global South.",
    accent: "#94563c",
    relatedSlugs: ["opinion", "news", "videos", "culture"],
    emptyMessage: "Our podcasts are coming soon. Meanwhile, explore video reports and opinion columns.",
    emptyLinks: [
      { label: "Watch videos", href: "/videos" },
      { label: "Read opinion", href: "/category/opinion" },
    ],
    rssHref: "/feed.xml?category=news",
  },
  infographics: {
    slug: "infographics",
    eyebrow: "Visual data",
    title: "Infographics",
    lead: "Charts, maps, and visual explainers that make complex Global South stories accessible at a glance.",
    accent: "#4361EE",
    relatedSlugs: ["politics", "health", "feature", "news"],
    emptyMessage: "New infographics are on the way. Browse politics and news coverage in the meantime.",
    emptyLinks: [
      { label: "Photo galleries", href: "/photo-galleries" },
      { label: "Politics section", href: "/category/politics" },
    ],
    rssHref: "/feed.xml?category=news",
  },
  "photo-galleries": {
    slug: "photo-galleries",
    eyebrow: "Photography",
    title: "Photo galleries",
    lead: "Photo essays and visual reports from correspondents across Africa, Latin America, Asia, and the diaspora.",
    accent: "#588157",
    relatedSlugs: ["local", "special-reports", "investigations", "culture"],
    emptyMessage: "No photo galleries published yet. Discover our video reports and special features.",
    emptyLinks: [
      { label: "Videos", href: "/videos" },
      { label: "Features", href: "/category/special-reports" },
    ],
    rssHref: "/feed.xml?category=news",
  },
};
