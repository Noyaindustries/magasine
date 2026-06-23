import mongoose from "mongoose";
import { cache } from "react";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { Alert } from "@/models/Alert";
import "@/models/Author";
import type { ArticleListItem } from "@/types";
import {
  getMockArticleBySlug,
  getMockCategoryBySlug,
  getMockHomePageData,
  getMockSearchSuggestions,
  mockAlerts,
  mockCategories,
  searchMockArticles,
} from "@/lib/mock-data";
import { resolveAuthorAvatar, resolveFeaturedImage } from "@/lib/images";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { filterRetiredCategories, filterArticlesByRetiredCategories } from "@/lib/retired-categories";
import { repairBrokenArticleImagesOnce } from "@/lib/repair-article-images";

function mapHomeArticles(
  docs: unknown[],
  limit?: number
): ArticleListItem[] {
  const items = filterArticlesByRetiredCategories(
    docs.map((a) => serializeArticle(a as Record<string, unknown>))
  );
  return limit !== undefined ? items.slice(0, limit) : items;
}

function filterHomeArticleList(items: ArticleListItem[], limit?: number): ArticleListItem[] {
  const filtered = filterArticlesByRetiredCategories(items);
  return limit !== undefined ? filtered.slice(0, limit) : filtered;
}

function serializeArticle(doc: Record<string, unknown>): ArticleListItem {
  const category = doc.category as Record<string, unknown> | null | undefined;
  const authors = (doc.authors as Record<string, unknown>[]) ?? [];

  return {
    _id: String(doc._id),
    title: doc.title as string,
    slug: doc.slug as string,
    excerpt: doc.excerpt as string,
    featuredImage: resolveFeaturedImage(doc.featuredImage as string),
    featuredImageAlt: doc.featuredImageAlt as string | undefined,
    category: category?._id
      ? {
          _id: String(category._id),
          name: category.name as string,
          slug: category.slug as string,
          color: category.color as string | undefined,
        }
      : {
          _id: "unknown",
          name: "News",
          slug: "actualites",
        },
    authors: authors
      .filter((a) => a?._id)
      .map((a) => ({
        _id: String(a._id),
        name: a.name as string,
        slug: a.slug as string,
        avatar: resolveAuthorAvatar(a.avatar as string | undefined, a.slug as string),
      })),
    publishedAt: doc.publishedAt
      ? new Date(doc.publishedAt as string | Date).toISOString()
      : undefined,
    readingTime: Number(doc.readingTime ?? 0),
    isPremium: !!doc.isPremium,
    isEditorsChoice: !!doc.isEditorsChoice,
    isFeatured: !!doc.isFeatured,
    isTopStory: !!doc.isTopStory,
    isUrgent: !!doc.isUrgent,
    views: doc.views != null ? Number(doc.views) : undefined,
    tags: Array.isArray(doc.tags) ? (doc.tags as string[]) : undefined,
    contentType: doc.contentType as ArticleListItem["contentType"],
    videoUrl: typeof doc.videoUrl === "string" ? doc.videoUrl : undefined,
  };
}

const articlePopulate = [
  { path: "category", select: "name slug color" },
  { path: "authors", select: "name slug avatar" },
];

let publishedArticleCountCache: boolean | null = null;

async function hasDbArticles(): Promise<boolean> {
  if (publishedArticleCountCache !== null) {
    return publishedArticleCountCache;
  }
  try {
    await connectDB();
    const count = await Article.countDocuments({ status: "published" });
    publishedArticleCountCache = count > 0;
    return publishedArticleCountCache;
  } catch {
    publishedArticleCountCache = false;
    return false;
  }
}

export const getHomePageData = cache(async function getHomePageData() {
  if (!(await hasDbArticles())) {
    return getMockHomePageData();
  }

  await connectDB();
  await repairBrokenArticleImagesOnce();

  const siteSettings = await getPublicSiteSettings();
  const baseQuery = { status: "published" as const };

  const [
    alerts,
    categories,
    heroArticles,
    topStories,
    editorsChoice,
    latestUpdates,
    featuredVideos,
    nationalNews,
    worldNews,
    multimedia,
    opinion,
    investigations,
    specialReports,
    popularTags,
    techNews,
    santeNews,
    localNews,
    politiqueNews,
    cultureNews,
    urgentArticles,
    africaNews,
    latinAmericaNews,
    southAsiaNews,
    westAsiaNews,
  ] = await Promise.all([
    Alert.find({ isActive: true }).sort({ order: 1 }).limit(5).lean(),
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Article.find({ ...baseQuery, isFeatured: true })
      .populate(articlePopulate)
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean(),
    Article.find({ ...baseQuery, isTopStory: true })
      .populate(articlePopulate)
      .sort({ publishedAt: -1 })
      .limit(10)
      .lean(),
    Article.find({ ...baseQuery, isEditorsChoice: true })
      .populate(articlePopulate)
      .sort({ publishedAt: -1 })
      .limit(8)
      .lean(),
    Article.find(baseQuery)
      .populate(articlePopulate)
      .sort({ publishedAt: -1 })
      .limit(14)
      .lean(),
    Article.find({ ...baseQuery, contentType: "video" })
      .populate(articlePopulate)
      .sort({ publishedAt: -1 })
      .limit(4)
      .lean(),
    Article.find(baseQuery)
      .populate({
        path: "category",
        match: { slug: "actualites" },
        select: "name slug color",
      })
      .populate(articlePopulate[1])
      .sort({ publishedAt: -1 })
      .limit(6)
      .lean()
      .then((docs) =>
        docs.filter((d) => (d.category as { slug?: string } | null)?.slug === "actualites")
      ),
    getArticlesByCategorySlug("monde", 4),
    getArticlesByCategorySlug("multimedia", 4),
    getArticlesByCategorySlug("opinion", 3),
    getArticlesByCategorySlug("investigations", 3),
    getArticlesByCategorySlug("reportages-speciaux", 3),
    Article.aggregate([
      { $match: { status: "published" } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]),
    getArticlesByCategorySlug("technologie", 4),
    getArticlesByCategorySlug("sante", 4),
    getArticlesByCategorySlug("local", 4),
    getArticlesByCategorySlug("politique", 4),
    getArticlesByCategorySlug("culture", 4),
    Article.find({
      ...baseQuery,
      $or: [{ isUrgent: true }, { isTopStory: true }],
    })
      .populate(articlePopulate)
      .sort({ publishedAt: -1 })
      .limit(12)
      .lean(),
    getArticlesByCategorySlug("africa", 4),
    getArticlesByCategorySlug("latin-america", 4),
    getArticlesByCategorySlug("south-asia", 4),
    getArticlesByCategorySlug("west-asia", 4),
  ]);

  return {
    breakingAlertsEnabled: siteSettings.breakingAlertEnabled,
    alerts: siteSettings.breakingAlertEnabled
      ? alerts.map((a) => ({
          _id: String(a._id),
          text: a.text,
          link: a.link,
        }))
      : [],
    categories: filterRetiredCategories(
      categories.map((c) => ({
        _id: String(c._id),
        name: c.name,
        slug: c.slug,
        color: c.color,
      }))
    ),
    heroArticles: mapHomeArticles(heroArticles, 6),
    topStories: mapHomeArticles(topStories, 6),
    editorsChoice: mapHomeArticles(editorsChoice, 5),
    latestUpdates: mapHomeArticles(latestUpdates, 6),
    featuredVideos: mapHomeArticles(featuredVideos, 4),
    nationalNews: mapHomeArticles(nationalNews, 6),
    worldNews: filterHomeArticleList(worldNews, 4),
    multimedia: filterHomeArticleList(multimedia, 4),
    opinion: filterHomeArticleList(opinion, 3),
    investigations: filterHomeArticleList(investigations, 3),
    specialReports: filterHomeArticleList(specialReports, 3),
    popularTags: popularTags.map((t: { _id: string; count: number }) => ({
      name: t._id,
      count: t.count,
    })),
    techNews: filterHomeArticleList(techNews, 4),
    santeNews: filterHomeArticleList(santeNews, 4),
    localNews: filterHomeArticleList(localNews, 4),
    politiqueNews: filterHomeArticleList(politiqueNews, 4),
    cultureNews: filterHomeArticleList(cultureNews, 4),
    urgentArticles: mapHomeArticles(urgentArticles, 8),
    africaNews: filterHomeArticleList(africaNews, 4),
    latinAmericaNews: filterHomeArticleList(latinAmericaNews, 4),
    southAsiaNews: filterHomeArticleList(southAsiaNews, 4),
    westAsiaNews: filterHomeArticleList(westAsiaNews, 4),
  };
});

export async function getAllArticleSlugs(): Promise<string[]> {
  if (!(await hasDbArticles())) {
    const { getMockArticles } = await import("@/lib/mock-data");
    return getMockArticles().map((a) => a.slug);
  }

  await connectDB();
  const articles = await Article.find({ status: "published" }).select("slug").lean();
  return articles.map((a) => a.slug);
}

export async function getUrgentArticles(limit = 24) {
  if (!(await hasDbArticles())) {
    const { getMockArticles } = await import("@/lib/mock-data");
    return getMockArticles()
      .filter((a) => a.isUrgent || a.isTopStory)
      .slice(0, limit);
  }

  await connectDB();
  const articles = await Article.find({
    status: "published",
    $or: [{ isUrgent: true }, { isTopStory: true }],
  })
    .populate(articlePopulate)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  const result = articles.map((a) => serializeArticle(a as unknown as Record<string, unknown>));
  if (result.length > 0) return result;

  const { getMockArticles } = await import("@/lib/mock-data");
  return getMockArticles()
    .filter((a) => a.isUrgent || a.isTopStory)
    .slice(0, limit);
}

export async function getUrgentPageData(limit = 36) {
  const articles = await getUrgentArticles(limit);

  let alerts: { text: string; link?: string }[] = mockAlerts.map((a) => ({
    text: a.text,
    link: a.link,
  }));

  try {
    await connectDB();
    const dbAlerts = await Alert.find({ isActive: true }).sort({ order: 1 }).limit(8).lean();
    if (dbAlerts.length > 0) {
      alerts = dbAlerts.map((a) => ({ text: a.text, link: a.link }));
    }
  } catch {
    // keep mock alerts
  }

  return { articles, alerts };
}

export async function getArticlesByCategorySlug(slug: string, limit = 12) {
  const useDb = await hasDbArticles();
  if (!useDb) {
    return getMockCategoryBySlug(slug)?.articles.slice(0, limit) ?? [];
  }

  await connectDB();
  const category = await Category.findOne({ slug }).lean();
  if (!category) return getMockCategoryBySlug(slug)?.articles.slice(0, limit) ?? [];

  const articles = await Article.find({
    status: "published",
    $or: [{ category: category._id }, { secondaryCategories: category._id }],
  })
    .populate(articlePopulate)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  const result = articles.map((a) => serializeArticle(a as unknown as Record<string, unknown>));
  return result.length > 0
    ? result
    : (getMockCategoryBySlug(slug)?.articles.slice(0, limit) ?? []);
}

export async function getArticleBySlug(slug: string) {
  if (!(await hasDbArticles())) {
    return getMockArticleBySlug(slug);
  }

  await connectDB();
  const article = await Article.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { returnDocument: "after" }
  )
    .populate(articlePopulate)
    .populate("secondaryCategories", "name slug color")
    .lean();

  if (!article) return getMockArticleBySlug(slug);

  const related = await Article.find({
    status: "published",
    category: article.category,
    _id: { $ne: article._id },
  })
    .populate(articlePopulate)
    .sort({ publishedAt: -1 })
    .limit(4)
    .lean();

  const categoryDoc = article.category as unknown as {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
  };

  const [prevArticle, nextArticle] = await Promise.all([
    Article.findOne({
      status: "published",
      category: categoryDoc._id,
      publishedAt: { $lt: article.publishedAt },
    })
      .sort({ publishedAt: -1 })
      .select("title slug")
      .lean(),
    Article.findOne({
      status: "published",
      category: categoryDoc._id,
      publishedAt: { $gt: article.publishedAt },
    })
      .sort({ publishedAt: 1 })
      .select("title slug")
      .lean(),
  ]);

  return {
    article: {
      ...serializeArticle(article as unknown as Record<string, unknown>),
      subtitle: article.subtitle,
      content: article.content,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      gallery: article.gallery?.map((item) => ({
        ...item,
        url: resolveFeaturedImage(item.url),
      })),
      shareCount: article.shareCount,
      featuredImageCaption: article.featuredImageCaption,
    },
    related: related.map((a) => serializeArticle(a as unknown as Record<string, unknown>)),
    navigation: {
      prev: prevArticle
        ? { title: prevArticle.title, slug: prevArticle.slug }
        : null,
      next: nextArticle
        ? { title: nextArticle.title, slug: nextArticle.slug }
        : null,
    },
  };
}

export async function searchArticles(
  query: string,
  filters?: { category?: string; author?: string; contentType?: string }
) {
  if (!(await hasDbArticles())) {
    let results = searchMockArticles(query);
    if (filters?.category) {
      results = results.filter((a) => a.category.slug === filters.category);
    }
    if (filters?.contentType) {
      results = results.filter((a) => a.contentType === filters.contentType);
    }
    return results.slice(0, 20);
  }

  await connectDB();

  const filter: Record<string, unknown> = {
    status: "published",
    $text: { $search: query },
  };

  if (filters?.category) {
    const cat = await Category.findOne({ slug: filters.category });
    if (cat) filter.category = cat._id;
  }

  if (filters?.contentType) {
    filter.contentType = filters.contentType;
  }

  const articles = await Article.find(filter, { score: { $meta: "textScore" } })
    .populate(articlePopulate)
    .sort({ score: { $meta: "textScore" }, publishedAt: -1 })
    .limit(20)
    .lean();

  const result = articles.map((a) => serializeArticle(a as unknown as Record<string, unknown>));
  return result.length > 0 ? result : searchMockArticles(query).slice(0, 20);
}

export async function getCategoryBySlug(slug: string) {
  if (!(await hasDbArticles())) {
    return getMockCategoryBySlug(slug);
  }

  await connectDB();
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return getMockCategoryBySlug(slug);

  const articles = await getArticlesByCategorySlug(slug, 36);

  return {
    category: {
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
    },
    articles,
  };
}

export async function getSearchSuggestions(query: string) {
  if (!query || query.length < 2) return [];
  if (!(await hasDbArticles())) {
    return getMockSearchSuggestions(query);
  }

  await connectDB();

  const articles = await Article.find({
    status: "published",
    title: { $regex: query, $options: "i" },
  })
    .select("title slug")
    .limit(6)
    .lean();

  const result = articles.map((a) => ({ title: a.title, slug: a.slug }));
  return result.length > 0 ? result : getMockSearchSuggestions(query);
}

export async function getAuthorBySlug(slug: string) {
  const { Author } = await import("@/models/Author");
  const { SEED_AUTHORS } = await import("@/lib/seed-data");

  const mockAuthor = SEED_AUTHORS.find((a) => a.slug === slug);
  let mockArticles = searchMockArticles("").filter((a) =>
    a.authors.some((auth) => auth.slug === slug)
  );

  if (!(await hasDbArticles())) {
    if (!mockAuthor) return null;
    return {
      author: {
        _id: `mock-author-${slug}`,
        name: mockAuthor.name,
        slug: mockAuthor.slug,
        bio: mockAuthor.bio,
        avatar: undefined,
      },
      articles: mockArticles.slice(0, 24),
    };
  }

  await connectDB();
  const author = await Author.findOne({ slug }).lean();
  if (!author) {
    if (!mockAuthor) return null;
    return {
      author: {
        _id: `mock-author-${slug}`,
        name: mockAuthor.name,
        slug: mockAuthor.slug,
        bio: mockAuthor.bio,
        avatar: undefined,
      },
      articles: mockArticles.slice(0, 24),
    };
  }

  const articles = await Article.find({ status: "published", authors: author._id })
    .populate(articlePopulate)
    .sort({ publishedAt: -1 })
    .limit(24)
    .lean();

  const serialized = articles.map((a) => serializeArticle(a as unknown as Record<string, unknown>));
  if (serialized.length === 0) {
    mockArticles = searchMockArticles("").filter((a) =>
      a.authors.some((auth) => auth.slug === slug)
    );
  }

  return {
    author: {
      _id: String(author._id),
      name: author.name,
      slug: author.slug,
      bio: author.bio,
      avatar: author.avatar,
    },
    articles: serialized.length > 0 ? serialized : mockArticles.slice(0, 24),
  };
}

export async function getArticlesByContentType(
  contentType: "video" | "podcast" | "gallery",
  limit = 24
) {
  if (!(await hasDbArticles())) {
    return searchMockArticles("").filter((a) => a.contentType === contentType).slice(0, limit);
  }

  await connectDB();
  const articles = await Article.find({ status: "published", contentType })
    .populate(articlePopulate)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  const result = articles.map((a) => serializeArticle(a as unknown as Record<string, unknown>));
  if (result.length > 0) return result;

  return searchMockArticles("").filter((a) => a.contentType === contentType).slice(0, limit);
}

export async function getArticlesByTag(tag: string, limit = 36) {
  const tagLower = tag.toLowerCase();

  if (!(await hasDbArticles())) {
    return searchMockArticles("")
      .filter((a) => a.tags?.some((t) => t.toLowerCase().includes(tagLower)))
      .slice(0, limit);
  }

  await connectDB();
  const articles = await Article.find({
    status: "published",
    tags: { $regex: tag, $options: "i" },
  })
    .populate(articlePopulate)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  const result = articles.map((a) => serializeArticle(a as unknown as Record<string, unknown>));
  if (result.length > 0) return result;

  return searchMockArticles("")
    .filter((a) => a.tags?.some((t) => t.toLowerCase().includes(tagLower)))
    .slice(0, limit);
}

export async function getAllAuthors() {
  const { Author } = await import("@/models/Author");
  const { SEED_AUTHORS } = await import("@/lib/seed-data");
  const { IMG, resolveAuthorAvatar } = await import("@/lib/images");

  const portraits = [IMG.portrait1, IMG.portrait2, IMG.portrait3];

  try {
    await connectDB();
    const authors = await Author.find().sort({ name: 1 }).lean();
    if (authors.length > 0) {
      return authors.map((a, i) => ({
        _id: String(a._id),
        name: a.name,
        slug: a.slug,
        bio: a.bio,
        avatar: resolveAuthorAvatar(a.avatar as string | undefined, a.slug as string),
      }));
    }
  } catch {
    // fallback below
  }

  return SEED_AUTHORS.map((a, i) => ({
    _id: `mock-${a.slug}`,
    name: a.name,
    slug: a.slug,
    bio: a.bio,
    avatar: portraits[i % portraits.length],
  }));
}

export const getLayoutNavData = cache(async function getLayoutNavData() {
  try {
    const siteSettings = await getPublicSiteSettings();
    await connectDB();
    const [categories, alerts, articleCount] = await Promise.all([
      Category.find({ isActive: true }).sort({ order: 1 }).lean(),
      siteSettings.breakingAlertEnabled
        ? Alert.find({ isActive: true }).sort({ order: 1 }).limit(5).lean()
        : Promise.resolve([]),
      Article.countDocuments({ status: "published" }),
    ]);

    if (articleCount === 0) {
      return {
        categories: filterRetiredCategories(mockCategories),
        alerts: siteSettings.breakingAlertEnabled
          ? mockAlerts.map((a) => ({ text: a.text, link: a.link }))
          : [],
        siteSettings,
      };
    }

    return {
      categories: filterRetiredCategories(
        categories.map((c) => ({ name: c.name, slug: c.slug }))
      ),
      alerts: alerts.map((a) => ({ text: a.text, link: a.link })),
      siteSettings,
    };
  } catch {
    const siteSettings = await getPublicSiteSettings();
    return {
      categories: filterRetiredCategories(mockCategories),
      alerts: siteSettings.breakingAlertEnabled
        ? mockAlerts.map((a) => ({ text: a.text, link: a.link }))
        : [],
      siteSettings,
    };
  }
});
