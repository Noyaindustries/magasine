export type HomeSectionId =
  | "intro"
  | "urgent"
  | "hero"
  | "megaAd"
  | "editorial"
  | "live"
  | "media"
  | "insights"
  | "rubriques"
  | "closing";

export interface HomeSectionMeta {
  id: HomeSectionId;
  label: string;
  description: string;
  articleFlag?: string;
  articlesHref?: string;
}

export const HOME_SECTIONS: HomeSectionMeta[] = [
  {
    id: "intro",
    label: "Masthead & pulse",
    description: "Edition header, live pulse stats, and trust strip.",
  },
  {
    id: "urgent",
    label: "Breaking / Urgent",
    description: "Ticker alerts and urgent story list.",
    articleFlag: "isUrgent",
    articlesHref: "/admin/articles?flag=urgent",
  },
  {
    id: "hero",
    label: "Hero lead",
    description: "Main featured image, story column, and Also read sidebar.",
    articleFlag: "isFeatured",
    articlesHref: "/admin/articles?flag=featured",
  },
  {
    id: "megaAd",
    label: "Mega ad slot",
    description: "Full-width advertising placement below the hero.",
  },
  {
    id: "editorial",
    label: "Editor's choice",
    description: "Curated picks from the newsroom.",
    articleFlag: "isEditorsChoice",
    articlesHref: "/admin/articles?flag=editorsChoice",
  },
  {
    id: "live",
    label: "Latest updates",
    description: "Most recently published articles.",
    articlesHref: "/admin/articles?status=published",
  },
  {
    id: "media",
    label: "Formats",
    description: "Videos, podcasts, and photo galleries on the homepage.",
    articleFlag: "contentType:video",
    articlesHref: "/admin/articles?flag=video",
  },
  {
    id: "insights",
    label: "Opinion & thematic",
    description: "Opinion category plus culture columns.",
    articlesHref: "/admin/articles?status=published",
  },
  {
    id: "rubriques",
    label: "Subject rows",
    description: "Horizontal article rows by editorial subject in the lower homepage.",
    articlesHref: "/admin/categories",
  },
  {
    id: "closing",
    label: "Stats & newsletter",
    description: "Impact stats and newsletter signup band.",
  },
];

export const DEFAULT_HOME_SECTIONS: Record<HomeSectionId, boolean> = {
  intro: false,
  urgent: false,
  hero: true,
  megaAd: true,
  editorial: true,
  live: false,
  media: true,
  insights: true,
  rubriques: true,
  closing: true,
};

export const DEFAULT_PULSE_STATS = [
  { value: "54", label: "countries" },
  { value: "127", label: "stories / week" },
  { value: "2M+", label: "readers" },
];

export interface TrustPartnerItem {
  name: string;
  logo: string;
  width: number;
  height: number;
  url?: string;
  isActive: boolean;
}

export const DEFAULT_TRUST_PARTNERS: TrustPartnerItem[] = [
  { name: "RFI", logo: "/images/partners/rfi.svg", width: 72, height: 28, isActive: true },
  { name: "Jeune Afrique", logo: "/images/partners/jeune-afrique.svg", width: 120, height: 28, isActive: true },
  { name: "BBC Afrique", logo: "/images/partners/bbc-afrique.svg", width: 110, height: 28, isActive: true },
  { name: "France 24", logo: "/images/partners/france24.svg", width: 96, height: 28, isActive: true },
  { name: "The Africa Report", logo: "/images/partners/the-africa-report.svg", width: 130, height: 28, isActive: true },
  { name: "Le Monde Afrique", logo: "/images/partners/lemonde-afrique.svg", width: 130, height: 28, isActive: true },
];

export const DEFAULT_MASTHEAD_BADGE = "Today's Edition";
export const DEFAULT_TRUST_STRIP_LABEL = "As seen in";

export const DEFAULT_CLOSING_STATS = [
  { num: "2", suffix: "M+", label: "Monthly Readers" },
  { num: "145", suffix: "k", label: "Newsletter Subscribers" },
  { num: "16", suffix: "+", label: "Editorial Sections" },
  { num: "48", suffix: "h", label: "Continuous Coverage" },
];

export const DEFAULT_NEWSLETTER_COPY = {
  title: "",
  titleEm: "delivered straight to your inbox.",
  description:
    "An editorial selection of the most important news from Africa and the Global South, curated by our newsroom.",
  benefits: [
    "Daily briefing every morning",
    "Regional editions you choose",
    "Investigation alerts — always free",
  ],
};
