export type SectionKind = "region" | "topic" | "format" | "investigation";

export interface SectionMeta {
  slug: string;
  label: string;
  kind: SectionKind;
  eyebrow: string;
  lead: string;
  relatedSlugs: string[];
  linkHref?: string;
  linkLabel?: string;
  formatLinks?: { label: string; href: string }[];
}

export const URGENT_SECTION = {
  eyebrow: "Alert feed",
  title: "Breaking — Live",
  lead: "Alerts, breaking news, and priority updates on Global South affairs — updated as stories develop.",
  relatedSlugs: ["news", "feature", "investigations", "africa", "west-asia"],
} as const;

export const ALL_NEWS_SECTION = {
  eyebrow: "",
  title: "All news",
  lead: "Every story from Global South Watch — reports, analysis, and updates across regions and sections, sorted by date.",
  relatedSlugs: ["news", "commentary", "explainer", "culture", "africa", "latin-america"],
} as const;

export const SECTION_META: Record<string, SectionMeta> = {
  africa: {
    slug: "africa",
    label: "Africa",
    kind: "region",
    eyebrow: "Region",
    lead: "News, analysis, and investigations across the African continent — from the Sahel to the Cape.",
    relatedSlugs: ["west-asia", "feature", "politics", "investigations", "commentary"],
    linkHref: "/rss?category=africa",
    linkLabel: "Africa RSS feed",
  },
  "latin-america": {
    slug: "latin-america",
    label: "Latin America",
    kind: "region",
    eyebrow: "Region",
    lead: "Coverage from Mexico to Patagonia — politics, economy, environment, and society.",
    relatedSlugs: ["feature", "politics", "news", "investigations", "special-reports"],
    linkHref: "/rss?category=latin-america",
    linkLabel: "Latin America RSS",
  },
  "south-asia": {
    slug: "south-asia",
    label: "South Asia",
    kind: "region",
    eyebrow: "Region",
    lead: "India, Pakistan, Bangladesh, Sri Lanka, and the wider subcontinent — trade, tech, and public policy.",
    relatedSlugs: ["feature", "politics", "news", "commentary", "health"],
    linkHref: "/rss?category=south-asia",
    linkLabel: "South Asia RSS",
  },
  "west-asia": {
    slug: "west-asia",
    label: "West Asia",
    kind: "region",
    eyebrow: "Region",
    lead: "Gulf states, Levant, Turkey, and Iran — energy, diplomacy, and regional security.",
    relatedSlugs: ["africa", "feature", "politics", "investigations", "news"],
    linkHref: "/rss?category=west-asia",
    linkLabel: "West Asia RSS",
  },
  news: {
    slug: "news",
    label: "News",
    kind: "topic",
    eyebrow: "News desk",
    lead: "National and local news from the Global South — institutions, society, and daily affairs.",
    relatedSlugs: ["commentary", "explainer", "culture", "africa", "investigations"],
    linkHref: "/rss?category=news",
    linkLabel: "News RSS",
    formatLinks: [
      { label: "All news hub", href: "/news" },
      { label: "Breaking news", href: "/urgent" },
    ],
  },
  commentary: {
    slug: "commentary",
    label: "Commentary",
    kind: "format",
    eyebrow: "Commentary",
    lead: "Analysis, columns, and debate from economists, activists, and public intellectuals across the Global South.",
    relatedSlugs: ["news", "explainer", "culture", "africa", "investigations"],
    linkHref: "/rss?category=commentary",
    linkLabel: "Commentary RSS",
  },
  explainer: {
    slug: "explainer",
    label: "Explainer",
    kind: "format",
    eyebrow: "Explainer",
    lead: "Context and background to help readers understand complex stories — institutions, policy, and history.",
    relatedSlugs: ["news", "commentary", "feature", "africa", "west-asia"],
    linkHref: "/rss?category=explainer",
    linkLabel: "Explainer RSS",
  },
  culture: {
    slug: "culture",
    label: "Culture",
    kind: "topic",
    eyebrow: "Culture",
    lead: "Arts, literature, heritage, sport, and cultural life across the Global South.",
    relatedSlugs: ["news", "commentary", "africa", "latin-america", "local"],
    linkHref: "/rss?category=culture",
    linkLabel: "Culture RSS",
  },
  politics: {
    slug: "politics",
    label: "Politics",
    kind: "topic",
    eyebrow: "Politics",
    lead: "Elections, parliaments, parties, and governance — political news from the Global South.",
    relatedSlugs: ["news", "feature", "opinion", "investigations", "africa"],
    linkHref: "/rss?category=politics",
    linkLabel: "Politics RSS",
    formatLinks: [
      { label: "All news", href: "/news" },
      { label: "News desk", href: "/category/news" },
    ],
  },
  health: {
    slug: "health",
    label: "Health",
    kind: "topic",
    eyebrow: "Health",
    lead: "Public health, epidemics, vaccines, and health systems from community clinics to continental policy.",
    relatedSlugs: ["news", "feature", "investigations", "local", "africa"],
    linkHref: "/rss?category=health",
    linkLabel: "Health RSS",
  },
  opinion: {
    slug: "opinion",
    label: "Opinion",
    kind: "format",
    eyebrow: "Opinion",
    lead: "Analysis, columns, and debate from economists, activists, and public intellectuals.",
    relatedSlugs: ["news", "politics", "feature", "investigations", "special-reports"],
    linkHref: "/rss?category=opinion",
    linkLabel: "Opinion RSS",
  },
  investigations: {
    slug: "investigations",
    label: "Investigations",
    kind: "investigation",
    eyebrow: "Investigations",
    lead: "Long-form probes, accountability journalism, and exclusive documents from our investigations desk.",
    relatedSlugs: ["special-reports", "politics", "news", "feature", "culture"],
    linkHref: "/rss?category=investigations",
    linkLabel: "Investigations RSS",
    formatLinks: [
      { label: "All news", href: "/news" },
      { label: "Special reports", href: "/category/special-reports" },
    ],
  },
  local: {
    slug: "local",
    label: "Local",
    kind: "topic",
    eyebrow: "Local",
    lead: "City and regional stories — heritage, communities, and life beyond the capital.",
    relatedSlugs: ["news", "culture", "special-reports", "africa"],
    linkHref: "/rss?category=local",
    linkLabel: "Local RSS",
  },
  feature: {
    slug: "feature",
    label: "Feature",
    kind: "topic",
    eyebrow: "Feature",
    lead: "International affairs, diplomacy, and global institutions seen from the Global South.",
    relatedSlugs: ["africa", "west-asia", "south-asia", "latin-america", "politics"],
    linkHref: "/rss?category=feature",
    linkLabel: "Feature RSS",
    formatLinks: [
      { label: "All news", href: "/news" },
      { label: "Politics", href: "/category/politics" },
    ],
  },
  multimedia: {
    slug: "multimedia",
    label: "Multimedia",
    kind: "format",
    eyebrow: "Multimedia",
    lead: "Video reports, podcasts, photo galleries, and visual storytelling from our correspondents.",
    relatedSlugs: ["news", "feature", "culture", "investigations", "special-reports"],
    linkHref: "/rss?category=multimedia",
    linkLabel: "Multimedia RSS",
    formatLinks: [
      { label: "Videos", href: "/videos" },
      { label: "Podcasts", href: "/podcasts" },
      { label: "Photo galleries", href: "/photo-galleries" },
    ],
  },
  "special-reports": {
    slug: "special-reports",
    label: "Special Reports",
    kind: "format",
    eyebrow: "Special reports",
    lead: "In-depth features, cross-border series, and narrative journalism on defining issues.",
    relatedSlugs: ["investigations", "special-reports", "opinion", "feature", "africa"],
    linkHref: "/rss?category=special-reports",
    linkLabel: "Special reports RSS",
    formatLinks: [
      { label: "All news", href: "/news" },
      { label: "Investigations", href: "/category/investigations" },
    ],
  },
};

export const ALL_SECTION_SLUGS = Object.keys(SECTION_META);

export const REGION_SLUGS = ["africa", "latin-america", "south-asia", "west-asia"] as const;

export const MENU_TOPIC_SLUGS = ["news", "commentary", "explainer", "culture"] as const;

export function buildFallbackSectionMeta(
  slug: string,
  category: { name: string; description?: string }
): SectionMeta {
  const isRegion = (REGION_SLUGS as readonly string[]).includes(slug);
  const relatedSlugs = isRegion
    ? [...REGION_SLUGS.filter((s) => s !== slug), "news"].slice(0, 5)
    : [...MENU_TOPIC_SLUGS.filter((s) => s !== slug), ...REGION_SLUGS.slice(0, 2)].slice(0, 5);

  return {
    slug,
    label: category.name,
    kind: isRegion ? "region" : "topic",
    eyebrow: isRegion ? "Region" : "Section",
    lead: category.description ?? `Coverage and analysis from ${category.name}.`,
    relatedSlugs,
    linkHref: `/rss?category=${slug}`,
    linkLabel: `${category.name} RSS`,
  };
}

export function getSectionMeta(slug: string): SectionMeta | null {
  const resolved = LEGACY_SECTION_SLUG_MAP[slug] ?? slug;
  return SECTION_META[resolved] ?? null;
}

export function resolveSectionMeta(
  slug: string,
  category: { name: string; description?: string }
): SectionMeta {
  return getSectionMeta(slug) ?? buildFallbackSectionMeta(slug, category);
}

/** @deprecated Legacy French slugs — resolved for old bookmarks and RSS links. */
const LEGACY_SECTION_SLUG_MAP: Record<string, string> = {
  actualites: "news",
  politique: "politics",
  sante: "health",
  monde: "feature",
  world: "feature",
  "reportages-speciaux": "special-reports",
  opinion: "commentary",
};

export function getSectionLabel(slug: string): string {
  return getSectionMeta(slug)?.label ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
