import slugify from "slugify";
import type { ArticleDetail, ArticleListItem } from "@/types";
import {
  SEED_ALERTS,
  SEED_ARTICLES,
  SEED_AUTHORS,
  SEED_CATEGORIES,
} from "@/lib/seed-data";
import { filterRetiredCategories, filterArticlesByRetiredCategories } from "@/lib/retired-categories";
import { resolveArticleContent } from "@/lib/article-content";
import { getAuthorAvatarUrl, resolveFeaturedImage } from "@/lib/images";
import { resolveCategorySlug } from "@/lib/category-slugs";

const categories = SEED_CATEGORIES.map((c, i) => ({
  _id: `mock-cat-${i}`,
  name: c.name,
  slug: c.slug,
  color: c.color,
  description: c.description,
  order: c.order,
  isActive: true,
}));

const authors = SEED_AUTHORS.map((a, i) => ({
  _id: `mock-author-${i}`,
  name: a.name,
  slug: a.slug,
  bio: a.bio,
  avatar: getAuthorAvatarUrl(a.slug),
}));

const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
const now = Date.now();

const articles: ArticleDetail[] = SEED_ARTICLES.map((article, i) => {
  const slug = article.slug ?? slugify(article.title, { lower: true, strict: true });
  const words = article.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const authorIndex = article.authorIndex ?? i % authors.length;
  const category = catBySlug[article.category];

  return {
    _id: `mock-article-${i}`,
    title: article.title,
    subtitle: article.subtitle,
    slug,
    excerpt: article.excerpt,
    content: resolveArticleContent(article.title, article.excerpt, article.content, slug),
    featuredImage: resolveFeaturedImage(article.image),
    featuredImageAlt: article.title,
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      color: category.color,
    },
    authors: [
      {
        _id: authors[authorIndex]._id,
        name: authors[authorIndex].name,
        slug: authors[authorIndex].slug,
        avatar: authors[authorIndex].avatar,
      },
    ],
    publishedAt: new Date(now - i * 3600000 * 4).toISOString(),
    readingTime: Math.max(1, Math.ceil(words / 200)),
    isFeatured: article.isFeatured ?? false,
    isTopStory: article.isTopStory ?? false,
    isUrgent: article.isUrgent ?? false,
    isEditorsChoice: article.isEditorsChoice ?? false,
    isPremium: article.isPremium ?? false,
    contentType: article.contentType ?? "article",
    videoUrl: article.videoUrl,
    views: Math.floor(Math.random() * 8000) + 200,
    tags: article.tags,
    shareCount: 0,
  };
});

const articlesBySlug = Object.fromEntries(articles.map((a) => [a.slug, a]));

export const mockAlerts = SEED_ALERTS.map((a, i) => ({
  _id: `mock-alert-${i}`,
  text: a.text,
  link: a.link,
}));

export const mockCategories = filterRetiredCategories(
  categories.map((c) => ({
    name: c.name,
    slug: c.slug,
  }))
);

export function getMockArticles(): ArticleListItem[] {
  return articles;
}

export function getMockArticleBySlug(slug: string) {
  const article = articlesBySlug[slug];
  if (!article) return null;

  const sameCategory = articles.filter(
    (a) => a.category.slug === article.category.slug && a._id !== article._id
  );
  const sorted = articles
    .filter((a) => a.category.slug === article.category.slug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime()
    );
  const pos = sorted.findIndex((a) => a.slug === slug);
  const prev = pos < sorted.length - 1 ? sorted[pos + 1] : null;
  const next = pos > 0 ? sorted[pos - 1] : null;

  return {
    article,
    related: sameCategory.slice(0, 4),
    navigation: {
      prev: prev ? { title: prev.title, slug: prev.slug } : null,
      next: next ? { title: next.title, slug: next.slug } : null,
    },
  };
}

export function getMockCategoryBySlug(slug: string) {
  const resolvedSlug = resolveCategorySlug(slug);
  const category = categories.find((c) => c.slug === resolvedSlug);
  if (!category) return null;

  const categoryArticles = articles
    .filter((a) => a.category.slug === resolvedSlug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() -
        new Date(a.publishedAt ?? 0).getTime()
    );

  return {
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
    },
    articles: categoryArticles,
  };
}

export function searchMockArticles(query: string) {
  const q = query.toLowerCase();
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.category.name.toLowerCase().includes(q) ||
      a.authors.some((author) => author.name.toLowerCase().includes(q)) ||
      a.tags?.some((t) => t.toLowerCase().includes(q))
  );
}

export function getMockSearchSuggestions(query: string) {
  if (!query || query.length < 2) return [];
  return searchMockArticles(query)
    .slice(0, 6)
    .map((a) => ({ title: a.title, slug: a.slug }));
}

export function getMockHomePageData() {
  const by = (fn: (a: ArticleDetail) => boolean) =>
    filterArticlesByRetiredCategories(articles.filter(fn)).slice(0, 6);

  const tagCounts = new Map<string, number>();
  for (const a of articles) {
    for (const tag of a.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const published = filterArticlesByRetiredCategories(articles);

  return {
    breakingAlertsEnabled: true,
    alerts: mockAlerts,
    categories: filterRetiredCategories(
      categories.map((c) => ({
        _id: c._id,
        name: c.name,
        slug: c.slug,
        color: c.color,
      }))
    ),
    heroArticles: by((a) => !!a.isFeatured),
    topStories: by((a) => !!a.isTopStory),
    editorsChoice: by((a) => !!a.isEditorsChoice).slice(0, 3),
    latestUpdates: published.slice(0, 6),
    featuredVideos: published.filter((a) => a.contentType === "video").slice(0, 4),
    featuredPodcasts: published.filter((a) => a.contentType === "podcast").slice(0, 4),
    featuredGalleries: published.filter((a) => a.contentType === "gallery").slice(0, 4),
    nationalNews: published.filter((a) => a.category.slug === "news").slice(0, 6),
    featureNews: published.filter((a) => a.category.slug === "feature").slice(0, 4),
    opinion: published.filter((a) => a.category.slug === "opinion").slice(0, 3),
    investigations: published.filter((a) => a.category.slug === "investigations").slice(0, 3),
    specialReports: published
      .filter((a) => a.category.slug === "special-reports")
      .slice(0, 3),
    popularTags: [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count })),

    healthNews: published.filter((a) => a.category.slug === "health").slice(0, 4),
    localNews: published.filter((a) => a.category.slug === "local").slice(0, 4),
    politicsNews: published.filter((a) => a.category.slug === "politics").slice(0, 4),
    cultureNews: published.filter((a) => a.category.slug === "culture").slice(0, 4),
    urgentArticles: published.filter((a) => a.isUrgent || a.isTopStory).slice(0, 8),
    africaNews: published.filter((a) => a.category.slug === "africa").slice(0, 4),
    latinAmericaNews: published.filter((a) => a.category.slug === "latin-america").slice(0, 4),
    southAsiaNews: published.filter((a) => a.category.slug === "south-asia").slice(0, 4),
    westAsiaNews: published.filter((a) => a.category.slug === "west-asia").slice(0, 4),
  };
}

/** Useful slugs for linking static homepage fallbacks */
export const MOCK_SLUGS = {
  hero: articles[0]?.slug ?? "",
  mini: articles.slice(1, 5).map((a) => a.slug),
} as const;
