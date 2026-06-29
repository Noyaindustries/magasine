import { IMG } from "@/lib/images";

export const TICKER_ITEMS = [
  "Presidential election: first-round results expected tonight",
  "Politics: parliament debates new data protection framework",
  "Culture: Abidjan biennial opens with record international attendance",
  "Health: new anti-malaria protocol adopted across 12 West African countries",
];

export const REGION_NAV = [
  { label: "Africa", href: "/category/africa", description: "Continental news & analysis", accent: "#1a3896" },
  { label: "Latin America", href: "/category/latin-america", description: "From Mexico to Patagonia", accent: "#2D6A4F" },
  { label: "South Asia", href: "/category/south-asia", description: "Subcontinent & diaspora", accent: "#E85D04" },
  { label: "West Asia", href: "/category/west-asia", description: "Gulf, Levant & beyond", accent: "#9B2226" },
] as const;

export const ALL_NEWS_LINK = { label: "All news", href: "/news" } as const;

export const ALL_NEWS_CTA = {
  kicker: "News feed",
  label: "All news",
  description: "Every story from our desks and regions",
  href: "/news",
} as const;

/** @deprecated Use ALL_NEWS_CTA */
export const VIEW_ALL_STORIES_LINK = {
  label: "View all stories",
  href: ALL_NEWS_CTA.href,
} as const;

/** News dropdown — desktop main menu */
export const NEWS_MENU_NAV = [
  {
    label: "All news",
    href: "/news",
    description: "Latest stories across every section",
  },
  {
    label: "News desk",
    href: "/category/news",
    description: "Breaking and daily reporting",
  },
  {
    label: "Breaking news",
    href: "/urgent",
    description: "Live updates and urgent alerts",
  },
  {
    label: "Investigations",
    href: "/category/investigations",
    description: "Accountability journalism and probes",
  },
  {
    label: "Special reports",
    href: "/category/special-reports",
    description: "In-depth features and cross-border series",
  },
  {
    label: "Politics",
    href: "/category/politics",
    description: "Elections, parliaments, and governance",
  },
  {
    label: "World",
    href: "/category/world",
    description: "International affairs from the Global South",
  },
] as const;

export const PRIMARY_NAV = [
  { label: "News", href: "/category/news" },
  { label: "Commentary", href: "/category/commentary" },
  { label: "Explainer", href: "/category/explainer" },
  { label: "Culture", href: "/category/culture" },
] as const;

export const SECONDARY_NAV: { label: string; href: string }[] = [];

export const HEADER_UTILITY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Our mission", href: "/about#mission" },
  { label: "Newsletter", href: "/newsletter" },
] as const;

export const HEADER_TOP_ACTIONS = [
  { label: "Support our work", href: "/donate" },
] as const;

export const HEADER_SOCIAL_NETWORKS = [
  "facebook",
  "twitter",
  "instagram",
  "youtube",
  "linkedin",
] as const;

export const NAV_SUBSCRIBE_LINK = { label: "Subscribe", href: "/newsletter" } as const;

export const NAV_SEARCH_LINK = { label: "Search", href: "/search" } as const;

export const SITE_TAGLINE = "Decolonizing media";

/** Multimedia & long-form formats — footer, sitemap */
export const FOOTER_FORMAT_LINKS = [
  { label: "Videos", href: "/videos" },
  { label: "Podcasts", href: "/podcasts" },
  { label: "Infographics", href: "/infographics" },
  { label: "Photo galleries", href: "/photo-galleries" },
  { label: "Investigations", href: "/category/investigations" },
  { label: "Special reports", href: "/category/special-reports" },
] as const;

/** Reader & partner links — footer only */
export const FOOTER_SUPPORT_LINKS = [
  { label: "Newsletter", href: "/newsletter" },
  { label: "Donate", href: "/donate" },
  { label: "Contact", href: "/contact" },
  { label: "Write for us", href: "/write-for-us" },
  { label: "Search", href: "/search" },
] as const;

/** @deprecated Use PRIMARY_NAV + SECONDARY_NAV + REGION_NAV */
export const HEADER_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

/** @deprecated Second menu removed */
export const NAV_SECTIONS: { label: string; href: string }[] = [];

/** About & mission — footer, mobile menu, sitemap, desktop nav */
export const ABOUT_NAV = [
  { label: "About us", href: "/about" },
  { label: "Our mission", href: "/about#mission" },
  { label: "Our team", href: "/team" },
] as const;

/** About dropdown — desktop main menu */
export const ABOUT_MENU_NAV = [
  {
    label: "About us",
    href: "/about",
    description: "Our story and independent newsroom",
  },
  {
    label: "Our mission",
    href: "/about#mission",
    description: "Why we report from the Global South",
  },
  {
    label: "Our team",
    href: "/team",
    description: "Journalists and correspondents worldwide",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Editorial desk, partnerships, and tips",
  },
  {
    label: "Write for us",
    href: "/write-for-us",
    description: "Pitch commentary and field reporting",
  },
] as const;

export const HERO_MAIN = {
  slug: "la-grande-reforme-fiscale-ouest-africaine-qui-gagne-qui-perd-dans-luemoa",
  image: IMG.politics,
  badge: "Exclusive Investigation",
  title: "West Africa's major tax reform:",
  titleEm: "who wins and who loses in WAEMU?",
  category: "Politics",
  excerpt:
    "An in-depth look at new common tax directives across the Union's eight member states. Our experts break down the stakes for businesses, households, and governments across the region.",
  author: "Ama Kouassi",
  authorRole: "Economics Correspondent",
  authorInitials: "AK",
  readingTime: "7 min read",
  timeAgo: "June 22, 2026",
  date: "June 22, 2026",
  isPremium: true,
};

export const HERO_MINI_CARDS = [
  {
    cat: "Politics",
    title: "Parliament passes personal data protection law",
    author: "Sékou Koné",
    meta: "June 22, 2026",
    image: IMG.politics,
    slug: "/article/le-parlement-vote-la-loi-sur-la-protection-des-donnees-personnelles",
  },
  {
    cat: "World",
    title: "AU Summit: continent adopts roadmap for food self-sufficiency",
    author: "Ama Kouassi",
    meta: "June 22, 2026",
    image: IMG.africa,
    slug: "/article/sommet-de-l-ua-le-continent-adopte-une-feuille-de-route-pour-l-autonomie-alimentaire",
  },
  {
    cat: "Health",
    title: "RTS,S malaria vaccine: nationwide mass vaccination campaign launched",
    author: "Dr. Fatou Bamba",
    meta: "June 21, 2026",
    image: IMG.health,
    slug: "/article/vaccin-antipaludisme-rtss-la-cote-divoire-lance-sa-campagne-nationale-de-vaccination-de-masse",
  },
  {
    cat: "Local",
    title: "Grand-Bassam UNESCO extension: colonial heritage site officially expanded",
    author: "Marie-Jo Bamba",
    meta: "June 21, 2026",
    image: IMG.heritage,
    slug: "/article/grand-bassam-classee-au-patrimoine-mondial-lunesco-officialise-lextension-du-site-colonial",
  },
];

export const TOP_STORIES = [
  { num: "01", cat: "World", title: "UN adopts historic resolution on developing countries' sovereign debt", meta: "Nadia Mensah · June 21, 2026", image: IMG.un, slug: "/article/lonu-adopte-une-resolution-historique-sur-la-dette-souveraine-des-pays-en-developpement" },
  { num: "02", cat: "Investigation", title: "Embezzlement probe: three ministers charged in public construction contracts case", meta: "Investigations Desk · June 22, 2026", image: IMG.investigation, slug: "/article/detournement-de-fonds-publics-trois-ministres-mis-en-examen-dans-laffaire-des-marches-de-construction" },
  { num: "03", cat: "Health", title: "RTS,S malaria vaccine: Côte d'Ivoire launches nationwide mass vaccination campaign", meta: "Dr. Fatou Bamba · June 22, 2026", image: IMG.health, slug: "/article/vaccin-antipaludisme-rtss-la-cote-divoire-lance-sa-campagne-nationale-de-vaccination-de-masse" },
  { num: "04", cat: "Culture", title: "Grand-Bassam UNESCO extension: colonial heritage site officially expanded", meta: "Marie-Jo Bamba · June 21, 2026", image: IMG.heritage, slug: "/article/grand-bassam-classee-au-patrimoine-mondial-lunesco-officialise-lextension-du-site-colonial" },
  { num: "05", cat: "Local", title: "Grand-Bassam UNESCO extension: colonial heritage site officially expanded", meta: "Marie-Jo Bamba · June 21, 2026", image: IMG.heritage, slug: "/article/grand-bassam-classee-au-patrimoine-mondial-lunesco-officialise-lextension-du-site-colonial" },
  { num: "06", cat: "World", title: "UN adopts historic resolution on developing countries' sovereign debt", meta: "Nadia Mensah · June 21, 2026", image: IMG.un, slug: "/article/lonu-adopte-une-resolution-historique-sur-la-dette-souveraine-des-pays-en-developpement" },
];

export const POPULAR_TAGS = [
  "#AFCON2027", "#WAEMU", "#FinTech", "#Agriculture", "#Elections",
  "#Abidjan", "#MobileMoney", "#Climate", "#Diaspora",
];

export const EDITORS_CHOICE = {
  featured: {
    tags: ["Report", "★ Top Story"],
    title: "Ivorian farmers turning cocoa into premium chocolate — and challenging global brands",
    excerpt: "They grow, process, and export. A new generation of cocoa growers is reshaping the world chocolate market from plantations in Bélier.",
    author: "Brice Ahi",
    meta: "June 21, 2026",
    image: IMG.cacao,
    slug: "/article/ces-agriculteurs-ivoiriens-qui-transforment-le-cacao-en-chocolat-haut-de-gamme",
  },
  rows: [
    { cat: "Opinion", title: "Should Francophone Africa rethink public debt? An economist's view", author: "Prof. Adjoua Mensah", time: "June 20, 2026", image: IMG.economy, slug: "/article/faut-il-repenser-le-modele-de-la-dette-publique-en-afrique-francophone" },
    { cat: "Environment", title: "Sassandra deforestation: investigation reveals true scale of forest loss since 2020", author: "Investigations Desk", time: "June 22, 2026", image: IMG.forest, slug: "/article/deforestation-du-sassandra-lenquete-qui-revele-lampleur-reelle-des-pertes-forestieres" },
  ],
  side: {
    cat: "Diaspora",
    title: "Ivoirians in France: how the second generation is reinventing ties with home",
    excerpt: "Portraits of eight young Franco-Ivorian entrepreneurs who chose to return and build in Côte d'Ivoire.",
    author: "Marie-Jo Bamba",
    time: "June 21, 2026",
    image: IMG.diaspora,
    slug: "/article/ivoiriens-de-france-comment-la-deuxieme-generation-reinvente-le-lien-avec-le-pays",
  },
};

export const LATEST = {
  featured: {
    cat: "Politics",
    badge: "JUNE 22, 2026",
    title: "Parliament passes personal data protection law — a first for Francophone West Africa",
    author: "Sékou Koné",
    time: "June 22, 2026",
    image: IMG.politics,
    slug: "/article/le-parlement-vote-la-loi-sur-la-protection-des-donnees-personnelles",
  },
  items: [
    { cat: "Politics", title: "AfDB announces $800M financing for Ivorian agri-food SMEs", time: "June 22, 2026", image: IMG.cacao, slug: "/article/la-bad-annonce-un-financement-de-800m-pour-les-pme-ivoiriennes-dans-le-secteur-agroalimentaire" },
    { cat: "Culture", title: "Grand-Bassam UNESCO extension: colonial heritage site officially expanded", time: "June 21, 2026", image: IMG.heritage, slug: "/article/grand-bassam-classee-au-patrimoine-mondial-lunesco-officialise-lextension-du-site-colonial" },
    { cat: "World", title: "United Nations: Security Council holds emergency session on Sahel crisis", time: "June 22, 2026", image: IMG.un, slug: "/article/nations-unies-le-conseil-de-securite-se-reunit-en-urgence-sur-la-situation-au-sahel" },
    { cat: "Health", title: "New meningitis cases in Bouaké: Health Ministry activates regional emergency protocol", time: "June 21, 2026", image: IMG.health, slug: "/article/nouveaux-cas-de-meningite-a-bouake-le-ministere-de-la-sante-active-le-protocole-durgence-regional" },
  ],
};

export const VIDEOS = [
  { cat: "World", title: "Port of Abidjan: how it became West Africa's leading logistics hub", duration: "12:34", views: "Kofi Mensah · June 22, 2026", image: IMG.port, slug: "/article/le-port-dabidjan-comment-il-est-devenu-le-premier-hub-logistique-dafrique-de-louest" },
  { cat: "Politics", title: "Exclusive interview: Prime Minister responds to criticism of education reform", duration: "08:12", views: "Ama Kouassi · June 22, 2026", image: IMG.politics, slug: "/article/interview-exclusive-le-premier-ministre-repond-aux-critiques-sur-la-reforme-de-leducation" },
  { cat: "Culture", title: "Ivorian cinema week: three films selected for Cannes Critics' Week", duration: "05:47", views: "Marie-Jo Bamba · June 21, 2026", image: IMG.heritage, slug: "/article/grand-bassam-classee-au-patrimoine-mondial-lunesco-officialise-lextension-du-site-colonial" },
  { cat: "Investigation", title: "Illegal gold mining in the north: documentary on clandestine supply chains", duration: "21:05", views: "Investigations Desk · June 20, 2026", image: IMG.forest, slug: "/article/orpaillage-illegal-dans-le-nord-le-grand-documentaire-sur-les-filieres-clandestines" },
];

export const OPINIONS = [
  { accent: true, text: "Electoral democracy is no longer enough. What we must build is a democracy of results — where access to water, schools, and healthcare is not a promise but an enforceable right.", title: "Beyond electoral democracy", initials: "PK", avatar: IMG.portrait1, image: IMG.politics, name: "Prof. Paul Konan", role: "Political Scientist, Félix Houphouët-Boigny University" },
  { accent: false, text: "Africa can no longer afford to import its own processed raw materials. True economic independence starts in our factories, not our mines.", title: "Industrial sovereignty first", initials: "FM", avatar: IMG.portrait2, image: IMG.finance, name: "Fatou Mbaye", role: "Economist, World Bank — Africa Bureau" },
  { accent: false, text: "African youth don't need anyone to build their future for them. They're already building it — with their phones, their ideas, and their refusal to wait for institutional permission.", title: "Youth are already building", initials: "YD", avatar: IMG.portrait3, image: IMG.tech, name: "Yaya Diabaté", role: "Entrepreneur & Author, Abidjan" },
];

export const THEMATIC = [
  {
    title: "World",
    href: "/category/world",
    main: { cat: "World", title: "UN adopts historic resolution on developing countries' sovereign debt", image: IMG.un },
    subs: [
      { num: "01", cat: "Diplomacy", title: "Security Council holds emergency session on Sahel crisis" },
      { num: "02", cat: "Africa", title: "AU Summit adopts roadmap for continental food self-sufficiency" },
      { num: "03", cat: "Trade", title: "AfDB announces $800M financing for Ivorian agri-food SMEs" },
    ],
  },
  {
    title: "Culture",
    href: "/category/culture",
    main: { cat: "Heritage", title: "Grand-Bassam UNESCO extension officially expands colonial heritage site", image: IMG.heritage },
    subs: [
      { num: "01", cat: "Cinema", title: "Three Ivorian films selected for Cannes Critics' Week" },
      { num: "02", cat: "Music", title: "Abidjan Jazz Festival draws record crowds for its 15th edition" },
      { num: "03", cat: "Arts", title: "Contemporary African art fair opens new pavilion in Plateau district" },
    ],
  },
];

export const STATS = [
  { num: "2", suffix: "M+", label: "Monthly Readers" },
  { num: "145", suffix: "k", label: "Newsletter Subscribers" },
  { num: "16", suffix: "+", label: "Editorial Sections" },
  { num: "48", suffix: "h", label: "Continuous Coverage" },
];

export const FOOTER_LEGAL_LINKS = [
  { label: "Legal notice", href: "/legal" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
] as const;

export const FOOTER_BOTTOM_LINKS = [
  { label: "Sitemap", href: "/sitemap" },
  { label: "RSS", href: "/rss" },
  { label: "Feed XML", href: "/feed.xml", external: true },
  { label: "Accessibility", href: "/accessibility" },
] as const;

export const FOOTER_COLS = {
  regions: REGION_NAV.map(({ label, href }) => ({ label, href })),
  sections: [ALL_NEWS_LINK, ...PRIMARY_NAV.map(({ label, href }) => ({ label, href }))],
  formats: FOOTER_FORMAT_LINKS.map(({ label, href }) => ({ label, href })),
  about: [
    ...ABOUT_NAV.map(({ label, href }) => ({ label, href })),
    ...FOOTER_SUPPORT_LINKS.map(({ label, href }) => ({ label, href })),
  ],
  legal: FOOTER_LEGAL_LINKS.map(({ label, href }) => ({ label, href })),
};

/** Mobile drawer — mirrors footer structure */
export const MOBILE_NAV = {
  news: NEWS_MENU_NAV.map(({ label, href }) => ({ label, href })),
  sections: PRIMARY_NAV.filter((item) => item.label !== "News").map(({ label, href }) => ({
    label,
    href,
  })),
  regions: FOOTER_COLS.regions,
  formats: FOOTER_COLS.formats,
  about: ABOUT_MENU_NAV.map(({ label, href }) => ({ label, href })),
  support: FOOTER_SUPPORT_LINKS.map(({ label, href }) => ({ label, href })),
  legal: FOOTER_COLS.legal,
} as const;
