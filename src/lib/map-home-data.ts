import type { ArticleListItem } from "@/types";
import type {
  HomeCard,
  HomeEditorsChoice,
  HomeLatest,
  HomeOpinion,
  HomePageViewModel,
  HomeRubriqueBlock,
  HomeThematicCol,
  HomeTopStory,
  HomeUrgent,
  HomeVideo,
  HeroSlide,
} from "@/types/home";
import {
  EDITORS_CHOICE,
  HERO_MINI_CARDS,
  LATEST,
  OPINIONS,
  POPULAR_TAGS,
  THEMATIC,
  TICKER_ITEMS,
  TOP_STORIES,
  VIDEOS,
} from "@/data/site-home";
import { IMG } from "@/lib/images";
import {
  articleBadge,
  authorInitials,
  formatArticleCardMeta,
  formatArticleDisplayDate,
  formatArticleListDate,
  formatReadingTime,
  splitHeroTitle,
} from "@/lib/format-article";
import { filterArticlesByRetiredCategories } from "@/lib/retired-categories";

type HomeDataSource = Awaited<ReturnType<typeof import("@/lib/data").getHomePageData>>;

const RUBRIQUE_SOURCES: {
  slug: string;
  title: string;
  key: keyof HomeDataSource;
}[] = [
  { slug: "africa", title: "Africa", key: "africaNews" },
  { slug: "latin-america", title: "Latin America", key: "latinAmericaNews" },
  { slug: "south-asia", title: "South Asia", key: "southAsiaNews" },
  { slug: "west-asia", title: "West Asia", key: "westAsiaNews" },
  { slug: "news", title: "News", key: "nationalNews" },
  { slug: "politics", title: "Politics", key: "politicsNews" },
  { slug: "culture", title: "Culture", key: "cultureNews" },
  { slug: "investigations", title: "Investigations", key: "investigations" },
  { slug: "special-reports", title: "Special Reports", key: "specialReports" },
  { slug: "multimedia", title: "Multimedia", key: "multimedia" },
];

function articlePath(slug: string): string {
  return `/article/${slug}`;
}

function toHomeCard(a: ArticleListItem): HomeCard {
  const author = a.authors[0];
  return {
    slug: articlePath(a.slug),
    title: a.title,
    cat: a.category.name,
    meta: formatArticleListDate(a.publishedAt),
    image: a.featuredImage,
    author: author?.name ?? "Editorial",
    time: formatArticleListDate(a.publishedAt),
    excerpt: a.excerpt,
    badge: articleBadge(a),
  };
}

function toHeroSlide(a: ArticleListItem): HeroSlide {
  const author = a.authors[0];
  const { main, em } = splitHeroTitle(a.title, undefined);
  return {
    slug: a.slug,
    image: a.featuredImage,
    title: main,
    titleEm: em,
    badge: articleBadge(a),
    category: a.category.name,
    excerpt: a.excerpt,
    author: author?.name ?? "Editorial Desk",
    authorRole: author?.bio?.split("—")[0]?.trim() ?? "Global South Watch",
    authorInitials: author ? authorInitials(author.name) : "GS",
    readingTime: formatReadingTime(a.readingTime),
    timeAgo: formatArticleListDate(a.publishedAt),
    date: formatArticleDisplayDate(a.publishedAt),
    isPremium: !!a.isPremium,
    contentType: a.contentType,
    videoUrl: a.videoUrl,
  };
}

function buildHeroSlides(source: HomeDataSource): HeroSlide[] {
  const seen = new Set<string>();
  const pool: ArticleListItem[] = [];

  for (const a of filterArticlesByRetiredCategories([
    ...source.heroArticles,
    ...source.featuredVideos,
    ...source.topStories,
  ])) {
    if (!seen.has(a._id)) {
      seen.add(a._id);
      pool.push(a);
    }
  }

  if (pool.length === 0) {
    return [
      {
        slug: HERO_MINI_CARDS[0]?.slug.replace("/article/", "") ?? "",
        image: IMG.politics,
        title: "West Africa's major tax reform:",
        titleEm: "who wins and who loses in WAEMU?",
        badge: "Exclusive Investigation",
        category: "Politics",
        excerpt: "",
        author: "Ama Kouassi",
        authorRole: "Economics Correspondent",
        authorInitials: "AK",
        readingTime: "7 min read",
        timeAgo: "2 hours ago",
        date: "",
        isPremium: true,
      },
    ];
  }

  return pool.slice(0, 5).map(toHeroSlide);
}

function buildMiniCards(source: HomeDataSource, heroSlugs: Set<string>): HomeCard[] {
  const pool = filterArticlesByRetiredCategories(source.latestUpdates).filter(
    (a) => !heroSlugs.has(a.slug)
  );
  if (pool.length >= 4) {
    return pool.slice(0, 6).map(toHomeCard);
  }
  return HERO_MINI_CARDS.map((c) => ({
    slug: c.slug,
    title: c.title,
    cat: c.cat,
    meta: c.meta,
    image: c.image,
    author: "author" in c ? c.author : "Editorial",
  }));
}

function buildTopStories(source: HomeDataSource): HomeTopStory[] {
  const topStories = filterArticlesByRetiredCategories(source.topStories);
  if (topStories.length > 0) {
    return topStories.slice(0, 6).map((a, i) => ({
      num: String(i + 1).padStart(2, "0"),
      slug: articlePath(a.slug),
      cat: a.category.name,
      title: a.title,
      meta: formatArticleCardMeta(a),
      image: a.featuredImage,
    }));
  }
  return TOP_STORIES.map((s) => ({
    num: s.num,
    slug: s.slug,
    cat: s.cat,
    title: s.title,
    meta: s.meta,
    image: s.image,
  }));
}

function buildEditorsChoice(source: HomeDataSource): HomeEditorsChoice {
  const items = filterArticlesByRetiredCategories(source.editorsChoice);
  if (items.length >= 3) {
    const [featured, ...rest] = items;
    const side = rest[rest.length - 1];
    const rows = rest.slice(0, -1).length > 0 ? rest.slice(0, -1) : rest.slice(0, 2);
    return {
      featured: {
        ...toHomeCard(featured),
        tags: ["Report", featured.isPremium ? "★ Premium" : "★ Top Story"],
        excerpt: featured.excerpt,
      },
      rows: rows.map((a) => toHomeCard(a)),
      side: { ...toHomeCard(side), excerpt: side.excerpt },
    };
  }
  return {
    featured: {
      slug: EDITORS_CHOICE.featured.slug,
      title: EDITORS_CHOICE.featured.title,
      cat: EDITORS_CHOICE.featured.tags[0],
      meta: EDITORS_CHOICE.featured.meta,
      image: EDITORS_CHOICE.featured.image,
      author: EDITORS_CHOICE.featured.author,
      tags: EDITORS_CHOICE.featured.tags,
      excerpt: EDITORS_CHOICE.featured.excerpt,
    },
    rows: EDITORS_CHOICE.rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      cat: r.cat,
      meta: `${r.time}`,
      image: r.image,
      author: r.author,
      time: r.time,
    })),
    side: {
      slug: EDITORS_CHOICE.side.slug,
      title: EDITORS_CHOICE.side.title,
      cat: EDITORS_CHOICE.side.cat,
      meta: EDITORS_CHOICE.side.time,
      image: EDITORS_CHOICE.side.image,
      author: EDITORS_CHOICE.side.author,
      excerpt: EDITORS_CHOICE.side.excerpt,
    },
  };
}

function buildLatest(source: HomeDataSource): HomeLatest {
  const updates = filterArticlesByRetiredCategories(source.latestUpdates);
  if (updates.length >= 2) {
    const [featured, ...items] = updates;
    return {
      featured: {
        ...toHomeCard(featured),
        badge: formatArticleDisplayDate(featured.publishedAt).toUpperCase(),
      },
      items: items.slice(0, 5).map(toHomeCard),
    };
  }
  return {
    featured: {
      slug: LATEST.featured.slug,
      title: LATEST.featured.title,
      cat: LATEST.featured.cat,
      meta: LATEST.featured.time,
      image: LATEST.featured.image,
      author: LATEST.featured.author,
      badge: LATEST.featured.badge,
    },
    items: LATEST.items.map((item) => ({
      slug: "slug" in item ? item.slug : undefined,
      title: item.title,
      cat: item.cat,
      meta: item.time,
      image: item.image,
    })) as HomeCard[],
  };
}

function estimateDuration(minutes: number): string {
  const m = Math.max(1, minutes * 2);
  const sec = (m % 1) * 60;
  return `${Math.floor(m)}:${String(Math.round(sec)).padStart(2, "0")}`;
}

function buildVideos(source: HomeDataSource): HomeVideo[] {
  if (source.featuredVideos.length > 0) {
    return source.featuredVideos.slice(0, 4).map((a) => ({
      slug: articlePath(a.slug),
      cat: a.category.name,
      title: a.title,
      duration: estimateDuration(a.readingTime),
      views: formatArticleCardMeta(a),
      image: a.featuredImage,
    }));
  }
  return VIDEOS.map((v) => ({
    slug: v.slug,
    cat: v.cat,
    title: v.title,
    duration: v.duration,
    views: v.views,
    image: v.image,
  }));
}

function buildOpinions(source: HomeDataSource): HomeOpinion[] {
  if (source.opinion.length > 0) {
    return source.opinion.slice(0, 6).map((a, i) => {
      const author = a.authors[0];
      return {
        accent: i === 0,
        text: a.excerpt,
        title: a.title,
        name: author?.name ?? "Contributor",
        role: author?.bio ?? a.category.name,
        avatar: author?.avatar ?? IMG.portrait1,
        image: a.featuredImage,
        slug: articlePath(a.slug),
      };
    });
  }
  return OPINIONS.map((o, i) => ({
    accent: o.accent,
    text: o.text,
    title: o.title,
    name: o.name,
    role: o.role,
    avatar: o.avatar,
    image: o.image,
    slug: `static-opinion-${i}`,
  }));
}

function buildThematicCol(
  title: string,
  slug: string,
  articles: ArticleListItem[]
): HomeThematicCol | null {
  if (articles.length === 0) return null;
  const [main, ...subs] = articles;
  return {
    title,
    href: `/category/${slug}`,
    main: {
      cat: main.category.name,
      title: main.title,
      image: main.featuredImage,
      slug: articlePath(main.slug),
    },
    subs: subs.slice(0, 3).map((a, i) => ({
      num: String(i + 1).padStart(2, "0"),
      cat: a.tags?.[0] ?? a.category.name,
      title: a.title,
      slug: articlePath(a.slug),
    })),
  };
}

function buildThematic(source: HomeDataSource & { cultureNews?: ArticleListItem[]; investigations?: ArticleListItem[] }): HomeThematicCol[] {
  const culture = buildThematicCol("Culture", "culture", source.cultureNews ?? []);
  const investigations = buildThematicCol("Investigations", "investigations", source.investigations ?? []);

  if (culture && investigations) return [culture, investigations];

  return THEMATIC.map((col) => ({
    title: col.title,
    href: col.href,
    main: { ...col.main, slug: undefined },
    subs: col.subs,
  }));
}

function buildTags(source: HomeDataSource): string[] {
  if (source.popularTags.length > 0) {
    return source.popularTags.slice(0, 9).map((t) => `#${t.name.replace(/^#/, "")}`);
  }
  return POPULAR_TAGS;
}

function buildUrgent(source: HomeDataSource): HomeUrgent {
  const alerts =
    source.alerts.length > 0
      ? source.alerts.map((a) => ({ text: a.text, link: a.link }))
      : source.breakingAlertsEnabled !== false
        ? TICKER_ITEMS.map((text) => ({ text }))
        : [];

  if (source.urgentArticles.length > 0) {
    return {
      alerts,
      articles: source.urgentArticles.slice(0, 6).map((a, i) => ({
        num: String(i + 1).padStart(2, "0"),
        slug: articlePath(a.slug),
        cat: a.category.name,
        title: a.title,
        meta: formatArticleCardMeta(a),
        image: a.featuredImage,
      })),
    };
  }

  return {
    alerts,
    articles: TOP_STORIES.slice(0, 6).map((s) => ({
      num: s.num,
      slug: s.slug,
      cat: s.cat,
      title: s.title,
      meta: s.meta,
      image: s.image,
    })),
  };
}

function buildRubriques(source: HomeDataSource): HomeRubriqueBlock[] {
  return RUBRIQUE_SOURCES.flatMap(({ slug, title, key }) => {
    const items = filterArticlesByRetiredCategories(
      (source[key] as ArticleListItem[] | undefined) ?? []
    );
    if (!items.length) return [];

    return [
      {
        slug,
        title,
        href: `/category/${slug}`,
        articles: items.slice(0, 4).map(toHomeCard),
      },
    ];
  });
}

export function mapHomePageData(source: HomeDataSource): HomePageViewModel {
  const heroSlides = buildHeroSlides(source);
  const heroSlugs = new Set(heroSlides.map((s) => s.slug));

  return {
    heroSlides,
    miniCards: buildMiniCards(source, heroSlugs),
    topStories: buildTopStories(source),
    popularTags: buildTags(source),
    editorsChoice: buildEditorsChoice(source),
    latest: buildLatest(source),
    videos: buildVideos(source),
    opinions: buildOpinions(source),
    thematic: buildThematic(source),
    urgent: buildUrgent(source),
    rubriques: buildRubriques(source),
  };
}
