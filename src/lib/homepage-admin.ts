import { connectDB } from "@/lib/mongodb";
import { filterRetiredCategories } from "@/lib/retired-categories";
import { Article } from "@/models/Article";
import { Alert } from "@/models/Alert";
import { Category } from "@/models/Category";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { HOME_SECTIONS, type HomeSectionId } from "@/lib/homepage-sections";

export interface HomepageSlotArticle {
  _id: string;
  title: string;
  slug: string;
  status: string;
  category?: string;
}

export interface HomepageSectionStatus {
  id: HomeSectionId;
  label: string;
  description: string;
  enabled: boolean;
  count: number;
  articles: HomepageSlotArticle[];
  articlesHref?: string;
  articleFlag?: string;
}

export async function getHomepageAdminOverview(): Promise<{
  settings: Awaited<ReturnType<typeof getPublicSiteSettings>>;
  sections: HomepageSectionStatus[];
  alertCount: number;
  categoryCount: number;
}> {
  const settings = await getPublicSiteSettings();

  await connectDB();

  const published = { status: "published" as const };

  const [
    urgent,
    featured,
    topStories,
    editorsChoice,
    latest,
    videos,
    opinion,
    tech,
    culture,
    alerts,
    categories,
    rubriqueSamples,
  ] = await Promise.all([
    Article.find({ ...published, isUrgent: true }).select("title slug status category").populate("category", "name").sort({ publishedAt: -1 }).limit(6).lean(),
    Article.find({ ...published, isFeatured: true }).select("title slug status category").populate("category", "name").sort({ publishedAt: -1 }).limit(6).lean(),
    Article.find({ ...published, isTopStory: true }).select("title slug status category").populate("category", "name").sort({ publishedAt: -1 }).limit(6).lean(),
    Article.find({ ...published, isEditorsChoice: true }).select("title slug status category").populate("category", "name").sort({ publishedAt: -1 }).limit(5).lean(),
    Article.find(published).select("title slug status category").populate("category", "name").sort({ publishedAt: -1 }).limit(5).lean(),
    Article.find({ ...published, contentType: "video" }).select("title slug status category").populate("category", "name").sort({ publishedAt: -1 }).limit(4).lean(),
    Article.find(published).select("title slug status category").populate({ path: "category", match: { slug: "opinion" }, select: "name slug" }).sort({ publishedAt: -1 }).limit(3).lean(),
    Article.find(published).select("title slug status category").populate({ path: "category", match: { slug: "technologie" }, select: "name slug" }).sort({ publishedAt: -1 }).limit(4).lean(),
    Article.find(published).select("title slug status category").populate({ path: "category", match: { slug: "culture" }, select: "name slug" }).sort({ publishedAt: -1 }).limit(4).lean(),
    Alert.countDocuments({ isActive: true }),
    Category.find({ isActive: true }).select("slug").lean(),
    Article.find(published).select("title slug status category").populate("category", "name slug").sort({ publishedAt: -1 }).limit(12).lean(),
  ]);

  const toArticles = (docs: Array<{
    _id: unknown;
    title: string;
    slug: string;
    status: string;
    category?: unknown;
  }>): HomepageSlotArticle[] =>
    docs.map((a) => ({
      _id: String(a._id),
      title: a.title,
      slug: a.slug,
      status: a.status,
      category: (a.category as { name?: string } | null | undefined)?.name,
    }));

  const heroPool = [...featured, ...videos, ...topStories].slice(0, 6);
  const insightsPool = [
    ...opinion.filter((a) => (a.category as { slug?: string } | null)?.slug === "opinion"),
    ...tech.filter((a) => (a.category as { slug?: string } | null)?.slug === "technologie"),
    ...culture.filter((a) => (a.category as { slug?: string } | null)?.slug === "culture"),
  ];

  const sectionArticles: Record<HomeSectionId, HomepageSlotArticle[]> = {
    intro: [],
    urgent: toArticles(urgent),
    hero: toArticles(heroPool),
    megaAd: [],
    editorial: toArticles(editorsChoice),
    live: toArticles(latest),
    media: toArticles(videos),
    insights: toArticles(insightsPool),
    rubriques: toArticles(rubriqueSamples),
    closing: [],
  };

  const sections: HomepageSectionStatus[] = HOME_SECTIONS.map((meta) => ({
    id: meta.id,
    label: meta.label,
    description: meta.description,
    enabled: settings.homeSections[meta.id],
    count:
      meta.id === "intro"
        ? settings.pulseStats.length + settings.trustPartners.filter((p) => p.isActive !== false).length
        : sectionArticles[meta.id].length,
    articles: sectionArticles[meta.id],
    articlesHref: meta.articlesHref,
    articleFlag: meta.articleFlag,
  }));

  return {
    settings,
    sections,
    alertCount: alerts,
    categoryCount: filterRetiredCategories(
      categories.map((c) => ({ slug: c.slug as string }))
    ).length,
  };
}
