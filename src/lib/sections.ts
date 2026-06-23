export type SectionKind = "region" | "topic" | "format" | "investigation";

export interface SectionMeta {
  slug: string;
  label: string;
  kind: SectionKind;
  number: string;
  eyebrow: string;
  lead: string;
  relatedSlugs: string[];
  linkHref?: string;
  linkLabel?: string;
  formatLinks?: { label: string; href: string }[];
}

export const URGENT_SECTION = {
  number: "00",
  eyebrow: "Alert feed",
  title: "Breaking — Live",
  lead: "Alerts, breaking news, and priority updates on Global South affairs — updated as stories develop.",
  relatedSlugs: ["actualites", "monde", "investigations", "africa", "west-asia"],
} as const;

export const SECTION_META: Record<string, SectionMeta> = {
  africa: {
    slug: "africa",
    label: "Africa",
    kind: "region",
    number: "01",
    eyebrow: "Region",
    lead: "News, analysis, and investigations across the African continent — from the Sahel to the Cape.",
    relatedSlugs: ["west-asia", "monde", "politique", "investigations", "local"],
    linkHref: "/rss?category=africa",
    linkLabel: "Africa RSS feed",
  },
  "latin-america": {
    slug: "latin-america",
    label: "Latin America",
    kind: "region",
    number: "02",
    eyebrow: "Region",
    lead: "Coverage from Mexico to Patagonia — politics, economy, environment, and society.",
    relatedSlugs: ["monde", "politique", "actualites", "investigations", "multimedia"],
    linkHref: "/rss?category=latin-america",
    linkLabel: "Latin America RSS",
  },
  "south-asia": {
    slug: "south-asia",
    label: "South Asia",
    kind: "region",
    number: "03",
    eyebrow: "Region",
    lead: "India, Pakistan, Bangladesh, Sri Lanka, and the wider subcontinent — trade, tech, and public policy.",
    relatedSlugs: ["monde", "technologie", "politique", "sante", "opinion"],
    linkHref: "/rss?category=south-asia",
    linkLabel: "South Asia RSS",
  },
  "west-asia": {
    slug: "west-asia",
    label: "West Asia",
    kind: "region",
    number: "04",
    eyebrow: "Region",
    lead: "Gulf states, Levant, Turkey, and Iran — energy, diplomacy, and regional security.",
    relatedSlugs: ["africa", "monde", "politique", "investigations", "actualites"],
    linkHref: "/rss?category=west-asia",
    linkLabel: "West Asia RSS",
  },
  actualites: {
    slug: "actualites",
    label: "News",
    kind: "topic",
    number: "05",
    eyebrow: "News desk",
    lead: "National and local news from the Global South — institutions, society, and daily affairs.",
    relatedSlugs: ["politique", "monde", "local", "opinion", "investigations"],
    linkHref: "/rss?category=actualites",
    linkLabel: "News RSS",
  },
  politique: {
    slug: "politique",
    label: "Politics",
    kind: "topic",
    number: "05b",
    eyebrow: "Politics",
    lead: "Elections, parliaments, parties, and governance — political news from the Global South.",
    relatedSlugs: ["actualites", "monde", "opinion", "investigations", "africa"],
    linkHref: "/rss?category=politique",
    linkLabel: "Politics RSS",
  },
  technologie: {
    slug: "technologie",
    label: "Technology",
    kind: "topic",
    number: "08",
    eyebrow: "Technology",
    lead: "Innovation, digital infrastructure, AI, and startups reshaping the Global South.",
    relatedSlugs: ["politique", "actualites", "multimedia", "south-asia", "africa"],
    linkHref: "/rss?category=technologie",
    linkLabel: "Tech RSS",
  },
  sante: {
    slug: "sante",
    label: "Health",
    kind: "topic",
    number: "09",
    eyebrow: "Health",
    lead: "Public health, epidemics, vaccines, and health systems from community clinics to continental policy.",
    relatedSlugs: ["actualites", "monde", "investigations", "local", "africa"],
    linkHref: "/rss?category=sante",
    linkLabel: "Health RSS",
  },
  opinion: {
    slug: "opinion",
    label: "Opinion",
    kind: "format",
    number: "11",
    eyebrow: "Opinion",
    lead: "Analysis, columns, and debate from economists, activists, and public intellectuals.",
    relatedSlugs: ["actualites", "politique", "monde", "investigations", "reportages-speciaux"],
    linkHref: "/rss?category=opinion",
    linkLabel: "Opinion RSS",
  },
  multimedia: {
    slug: "multimedia",
    label: "Multimedia",
    kind: "format",
    number: "12",
    eyebrow: "Multimedia",
    lead: "Video reports, podcasts, and visual storytelling from our newsroom and correspondents.",
    relatedSlugs: ["investigations", "reportages-speciaux", "actualites", "culture"],
    linkHref: "/rss?category=multimedia",
    linkLabel: "Multimedia RSS",
    formatLinks: [
      { label: "All videos", href: "/videos" },
      { label: "Podcasts", href: "/podcasts" },
    ],
  },
  investigations: {
    slug: "investigations",
    label: "Investigations",
    kind: "investigation",
    number: "13",
    eyebrow: "Investigations",
    lead: "Long-form probes, accountability journalism, and exclusive documents from our investigations desk.",
    relatedSlugs: ["reportages-speciaux", "politique", "actualites", "monde", "multimedia"],
    linkHref: "/rss?category=investigations",
    linkLabel: "Investigations RSS",
  },
  local: {
    slug: "local",
    label: "Local",
    kind: "topic",
    number: "14",
    eyebrow: "Local",
    lead: "City and regional stories — heritage, communities, and life beyond the capital.",
    relatedSlugs: ["actualites", "culture", "multimedia", "africa"],
    linkHref: "/rss?category=local",
    linkLabel: "Local RSS",
  },
  monde: {
    slug: "monde",
    label: "World",
    kind: "topic",
    number: "15",
    eyebrow: "World",
    lead: "International affairs, diplomacy, and global institutions seen from the Global South.",
    relatedSlugs: ["africa", "west-asia", "south-asia", "latin-america", "politique"],
    linkHref: "/rss?category=monde",
    linkLabel: "World RSS",
  },
  "reportages-speciaux": {
    slug: "reportages-speciaux",
    label: "Special Reports",
    kind: "format",
    number: "16",
    eyebrow: "Special reports",
    lead: "In-depth features, cross-border series, and narrative journalism on defining issues.",
    relatedSlugs: ["investigations", "multimedia", "opinion", "monde", "africa"],
    linkHref: "/rss?category=reportages-speciaux",
    linkLabel: "Special reports RSS",
  },
};

export const ALL_SECTION_SLUGS = Object.keys(SECTION_META);

export const REGION_SLUGS = ["africa", "latin-america", "south-asia", "west-asia"] as const;

export function getSectionMeta(slug: string): SectionMeta | null {
  return SECTION_META[slug] ?? null;
}

export function getSectionLabel(slug: string): string {
  return SECTION_META[slug]?.label ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
