/** Données de démonstration du back-office CMS */

export const CMS_MEDIA_GRADIENTS = [
  { emoji: "📰", bg: "linear-gradient(135deg,#1a3a5c,#0f3460)" },
  { emoji: "🏟", bg: "linear-gradient(135deg,#2d1f3d,#4a2060)" },
  { emoji: "🌿", bg: "linear-gradient(135deg,#1a3a2a,#0f5c3a)" },
  { emoji: "☕", bg: "linear-gradient(135deg,#5c3a1a,#8b5e2d)" },
  { emoji: "💻", bg: "linear-gradient(135deg,#1a1a3a,#2d2d6b)" },
  { emoji: "⚽", bg: "linear-gradient(135deg,#3a1a1a,#6b2d2d)" },
  { emoji: "🌊", bg: "linear-gradient(135deg,#1a3a3a,#2d6b5c)" },
  { emoji: "🏗", bg: "linear-gradient(135deg,#3a2a1a,#7a5c2d)" },
  { emoji: "📱", bg: "linear-gradient(135deg,#2a1a3a,#5c2d6b)" },
  { emoji: "🌾", bg: "linear-gradient(135deg,#1a3a1a,#2d6b2d)" },
  { emoji: "🏛", bg: "linear-gradient(135deg,#3a3a1a,#6b6b2d)" },
  { emoji: "✈️", bg: "linear-gradient(135deg,#1a2a3a,#2d4a6b)" },
  { emoji: "🎵", bg: "linear-gradient(135deg,#3a1a2a,#6b2d5c)" },
  { emoji: "💊", bg: "linear-gradient(135deg,#1a3a3a,#0d6b6b)" },
  { emoji: "🌱", bg: "linear-gradient(135deg,#2a3a1a,#4a6b2d)" },
  { emoji: "🎭", bg: "linear-gradient(135deg,#3a1a3a,#6b2d6b)" },
] as const;

export const CMS_STORAGE_BREAKDOWN = [
  { label: "Images (JPG / WebP)", value: "2.8 GB", pct: 56, color: "var(--blue)" },
  { label: "Videos (MP4)", value: "1.1 GB", pct: 22, color: "var(--purple)" },
  { label: "Podcasts (MP3)", value: "0.2 GB", pct: 4, color: "var(--amber)" },
  { label: "Documents (PDF)", value: "0.1 GB", pct: 2, color: "var(--green)" },
] as const;

export const CMS_AD_ZONES = [
  {
    id: "header",
    name: "Top Banner — Header",
    position: "Above the main navigation",
    size: "728 × 90 px — Leaderboard",
    active: true,
    impressions: "840k",
    ctr: "4.2%",
    revenue: "480k FCFA",
  },
  {
    id: "sidebar",
    name: "Sidebar Rectangle",
    position: "Right column — article page",
    size: "300 × 250 px — Rectangle",
    active: true,
    impressions: "620k",
    ctr: "3.6%",
    revenue: "310k FCFA",
  },
  {
    id: "mid",
    name: "Mid-Article Banner",
    position: "Midway through the article body",
    size: "728 × 90 px — Mid-Content",
    active: true,
    impressions: "510k",
    ctr: "3.1%",
    revenue: "280k FCFA",
  },
  {
    id: "skyscraper",
    name: "Side Skyscraper",
    position: "Left sidebar — category page",
    size: "160 × 600 px — Skyscraper",
    active: false,
    impressions: "—",
    ctr: "—",
    revenue: "Paused",
  },
] as const;

export const CMS_NEWSLETTER_CAMPAIGNS = [
  {
    title: "Morning Newsletter — June 22, 2026",
    sub: "Weekly economy + sports roundup",
    sent: "14 523",
    opens: "5 802 (39.9%)",
    clicks: "1 848 (12.7%)",
    status: "pub" as const,
  },
  {
    title: "AFCON 2027 Special — June 20",
    sub: "Full coverage of the qualifiers",
    sent: "13 980",
    opens: "6 430 (46.0%)",
    clicks: "2 190 (15.7%)",
    status: "pub" as const,
  },
  {
    title: "Economy Newsletter — June 15",
    sub: "Markets and public policy this week",
    sent: "13 750",
    opens: "4 950 (36.0%)",
    clicks: "1 540 (11.2%)",
    status: "pub" as const,
  },
  {
    title: "Morning Newsletter — June 29, 2026",
    sub: "Draft in progress",
    sent: "—",
    opens: "—",
    clicks: "—",
    status: "plan" as const,
  },
] as const;

export const CMS_NEWSLETTER_LISTS = [
  { name: "General news", count: 8214, pct: 57, color: "var(--cms-red)" },
  { name: "Sports", count: 4890, pct: 34, color: "var(--blue)" },
  { name: "Finance & Economy", count: 3740, pct: 26, color: "var(--green)" },
] as const;

export const CMS_ROLE_MATRIX = [
  {
    role: "Super Admin",
    color: "var(--cms-red)",
    write: true,
    publish: true,
    editOthers: true,
    users: true,
    ads: true,
    settings: true,
  },
  {
    role: "Editor",
    color: "var(--purple)",
    write: true,
    publish: true,
    editOthers: true,
    users: false,
    ads: false,
    settings: false,
  },
  {
    role: "Author",
    color: "var(--green)",
    write: true,
    publish: "own",
    editOthers: false,
    users: false,
    ads: false,
    settings: false,
  },
  {
    role: "Contributor",
    color: "var(--amber)",
    write: true,
    publish: false,
    editOthers: false,
    users: false,
    ads: false,
    settings: false,
  },
  {
    role: "Moderator",
    color: "var(--t3)",
    write: false,
    publish: false,
    editOthers: false,
    users: false,
    ads: false,
    settings: false,
  },
] as const;
