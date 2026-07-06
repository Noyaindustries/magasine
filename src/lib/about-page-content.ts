export const ABOUT_PILLAR_ICONS = ["book-open", "users", "scale", "radio"] as const;
export type AboutPillarIcon = (typeof ABOUT_PILLAR_ICONS)[number];

export interface AboutPillar {
  icon: AboutPillarIcon;
  title: string;
  text: string;
}

export interface AboutValue {
  label: string;
  text: string;
}

export interface AboutGlanceItem {
  label: string;
  value: string;
}

export interface AboutStat {
  num: string;
  label: string;
}

export interface AboutPageContent {
  metaDescription: string;
  eyebrow: string;
  titleMain: string;
  titleEm: string;
  lead: string;
  whoWeAreTitle: string;
  whoWeAreParagraphs: string[];
  glanceTitle: string;
  glanceItems: AboutGlanceItem[];
  coverageRegions: string[];
  missionSubtitle: string;
  missionTitle: string;
  missionLead: string;
  missionParagraph: string;
  missionPillars: AboutPillar[];
  valuesTitle: string;
  values: AboutValue[];
  howWeWorkTitle: string;
  howWeWorkIntro: string;
  howWeWorkItems: string[];
  statsTitle: string;
  statsSubtitle: string;
  stats: AboutStat[];
  ctaTeamText: string;
  ctaDonateText: string;
  ctaNewsletterText: string;
}

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  metaDescription:
    "Global South Watch — our mission, story, and commitment to independent journalism from Africa and the Global South.",
  eyebrow: "Global South Watch",
  titleMain: "About",
  titleEm: "us",
  lead: "Global South Watch is an independent newsroom reporting from Africa and the Global South — with rigor, proximity, and a commitment to public-interest journalism.",
  whoWeAreTitle: "Who we are",
  whoWeAreParagraphs: [
    "Founded by Noya Industries and published from Abidjan, Global South Watch is a digital news portal dedicated to Africa and the wider Global South. We bring together journalists, correspondents, columnists, and experts based across the continent and in the diaspora.",
    "From elections and economic policy to culture, climate, and health, we cover the stories that shape societies south of the equator — for readers who want reliable reporting without Western-centric filters.",
  ],
  glanceTitle: "At a glance",
  glanceItems: [
    { label: "Headquarters", value: "Abidjan, Côte d'Ivoire" },
    { label: "Publisher", value: "Noya Industries" },
    { label: "Languages", value: "French, English, and regional editions" },
    { label: "Formats", value: "Articles, investigations, video, podcasts, newsletters" },
  ],
  coverageRegions: ["Africa", "Latin America", "South Asia", "West Asia"],
  missionSubtitle: "Our mission",
  missionTitle: "To inform, analyze, and amplify agents of change across the Global South",
  missionLead:
    "We believe quality journalism rooted in local realities is essential to understanding global transformations and building informed public debate. Our mission is to give readers the context, evidence, and voices they need to engage with the world on equal terms.",
  missionParagraph:
    "We do not chase clicks at the expense of accuracy. We invest in correspondents on the ground, long-form investigations, and formats that reach audiences wherever they are — from morning briefings to in-depth reports.",
  missionPillars: [
    {
      icon: "book-open",
      title: "Inform with depth",
      text: "We explain transformations — political, economic, social and cultural — with context, not just headlines.",
    },
    {
      icon: "users",
      title: "Center Southern voices",
      text: "Our correspondents live in the regions they cover. Local expertise drives every story we publish.",
    },
    {
      icon: "scale",
      title: "Hold power to account",
      text: "Investigations, fact-checking, and public-interest reporting are at the heart of our newsroom.",
    },
    {
      icon: "radio",
      title: "Stay free and accessible",
      text: "Breaking news stays free. We reach readers through the web, newsletters, podcasts, and video.",
    },
  ],
  valuesTitle: "Our values",
  values: [
    {
      label: "Editorial independence",
      text: "No political or commercial interference in topic selection or editorial line.",
    },
    {
      label: "Factual rigor",
      text: "Cross-checked sources, transparent methods, and visible corrections when we err.",
    },
    {
      label: "Pluralism",
      text: "Diversity of voices, territories, and legitimate perspectives on every subject.",
    },
    {
      label: "Proximity",
      text: "Reporting rooted in the field — from Abidjan to São Paulo, Mumbai to Nairobi.",
    },
  ],
  howWeWorkTitle: "How we work",
  howWeWorkIntro:
    "Every story passes through editorial review. Sensitive claims are verified with multiple sources; anonymous sources are used only when the public interest clearly outweighs the risk, and never without senior editorial approval.",
  howWeWorkItems: [
    "Field reporting prioritized over desk rewrites",
    "Visible corrections when facts change",
    "Source protection as a non-negotiable principle",
    "Clear separation between news and opinion",
  ],
  statsTitle: "Key figures",
  statsSubtitle: "Reach and editorial scope — updated annually",
  stats: [
    { num: "2M+", label: "Monthly readers" },
    { num: "145k", label: "Newsletter subscribers" },
    { num: "42", label: "Countries covered" },
    { num: "120+", label: "Regional correspondents" },
  ],
  ctaTeamText: "Meet the journalists and correspondents behind our coverage.",
  ctaDonateText: "Independent journalism needs readers who believe in the mission.",
  ctaNewsletterText:
    "Get the morning briefing and regional newsletters — free, curated by our newsroom.",
};

function isPillarIcon(value: unknown): value is AboutPillarIcon {
  return typeof value === "string" && ABOUT_PILLAR_ICONS.includes(value as AboutPillarIcon);
}

function mergePillars(raw?: AboutPillar[]): AboutPillar[] {
  if (!raw?.length) return DEFAULT_ABOUT_PAGE.missionPillars;
  return raw.map((pillar, index) => {
    const fallback = DEFAULT_ABOUT_PAGE.missionPillars[index] ?? DEFAULT_ABOUT_PAGE.missionPillars[0]!;
    return {
      icon: isPillarIcon(pillar.icon) ? pillar.icon : fallback.icon,
      title: pillar.title?.trim() || fallback.title,
      text: pillar.text?.trim() || fallback.text,
    };
  });
}

function mergeStringArray(raw: string[] | undefined, fallback: string[]): string[] {
  if (!raw?.length) return fallback;
  const cleaned = raw.map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function mergeGlanceItems(raw?: AboutGlanceItem[]): AboutGlanceItem[] {
  if (!raw?.length) return DEFAULT_ABOUT_PAGE.glanceItems;
  const cleaned = raw
    .map((item) => ({
      label: item.label?.trim() ?? "",
      value: item.value?.trim() ?? "",
    }))
    .filter((item) => item.label && item.value);
  return cleaned.length ? cleaned : DEFAULT_ABOUT_PAGE.glanceItems;
}

function mergeValues(raw?: AboutValue[]): AboutValue[] {
  if (!raw?.length) return DEFAULT_ABOUT_PAGE.values;
  const cleaned = raw
    .map((item) => ({
      label: item.label?.trim() ?? "",
      text: item.text?.trim() ?? "",
    }))
    .filter((item) => item.label && item.text);
  return cleaned.length ? cleaned : DEFAULT_ABOUT_PAGE.values;
}

function mergeStats(raw?: AboutStat[]): AboutStat[] {
  if (!raw?.length) return DEFAULT_ABOUT_PAGE.stats;
  const cleaned = raw
    .map((item) => ({
      num: item.num?.trim() ?? "",
      label: item.label?.trim() ?? "",
    }))
    .filter((item) => item.num && item.label);
  return cleaned.length ? cleaned : DEFAULT_ABOUT_PAGE.stats;
}

export function mergeAboutPageContent(raw: unknown): AboutPageContent {
  if (!raw || typeof raw !== "object") return DEFAULT_ABOUT_PAGE;
  const patch = raw as Partial<AboutPageContent>;

  return {
    metaDescription: patch.metaDescription?.trim() || DEFAULT_ABOUT_PAGE.metaDescription,
    eyebrow: patch.eyebrow?.trim() || DEFAULT_ABOUT_PAGE.eyebrow,
    titleMain: patch.titleMain?.trim() || DEFAULT_ABOUT_PAGE.titleMain,
    titleEm: patch.titleEm?.trim() || DEFAULT_ABOUT_PAGE.titleEm,
    lead: patch.lead?.trim() || DEFAULT_ABOUT_PAGE.lead,
    whoWeAreTitle: patch.whoWeAreTitle?.trim() || DEFAULT_ABOUT_PAGE.whoWeAreTitle,
    whoWeAreParagraphs: mergeStringArray(
      patch.whoWeAreParagraphs,
      DEFAULT_ABOUT_PAGE.whoWeAreParagraphs
    ),
    glanceTitle: patch.glanceTitle?.trim() || DEFAULT_ABOUT_PAGE.glanceTitle,
    glanceItems: mergeGlanceItems(patch.glanceItems),
    coverageRegions: mergeStringArray(
      patch.coverageRegions,
      DEFAULT_ABOUT_PAGE.coverageRegions
    ),
    missionSubtitle: patch.missionSubtitle?.trim() || DEFAULT_ABOUT_PAGE.missionSubtitle,
    missionTitle: patch.missionTitle?.trim() || DEFAULT_ABOUT_PAGE.missionTitle,
    missionLead: patch.missionLead?.trim() || DEFAULT_ABOUT_PAGE.missionLead,
    missionParagraph: patch.missionParagraph?.trim() || DEFAULT_ABOUT_PAGE.missionParagraph,
    missionPillars: mergePillars(patch.missionPillars),
    valuesTitle: patch.valuesTitle?.trim() || DEFAULT_ABOUT_PAGE.valuesTitle,
    values: mergeValues(patch.values),
    howWeWorkTitle: patch.howWeWorkTitle?.trim() || DEFAULT_ABOUT_PAGE.howWeWorkTitle,
    howWeWorkIntro: patch.howWeWorkIntro?.trim() || DEFAULT_ABOUT_PAGE.howWeWorkIntro,
    howWeWorkItems: mergeStringArray(patch.howWeWorkItems, DEFAULT_ABOUT_PAGE.howWeWorkItems),
    statsTitle: patch.statsTitle?.trim() || DEFAULT_ABOUT_PAGE.statsTitle,
    statsSubtitle: patch.statsSubtitle?.trim() || DEFAULT_ABOUT_PAGE.statsSubtitle,
    stats: mergeStats(patch.stats),
    ctaTeamText: patch.ctaTeamText?.trim() || DEFAULT_ABOUT_PAGE.ctaTeamText,
    ctaDonateText: patch.ctaDonateText?.trim() || DEFAULT_ABOUT_PAGE.ctaDonateText,
    ctaNewsletterText: patch.ctaNewsletterText?.trim() || DEFAULT_ABOUT_PAGE.ctaNewsletterText,
  };
}
