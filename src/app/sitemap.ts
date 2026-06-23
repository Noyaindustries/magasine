import { MetadataRoute } from "next";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { Category } from "@/models/Category";
import { Author } from "@/models/Author";
import { SEED_AUTHORS } from "@/lib/seed-data";
import { mockCategories } from "@/lib/mock-data";
import { filterRetiredCategories } from "@/lib/retired-categories";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${baseUrl}/urgent`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${baseUrl}/newsletter`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/donate`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/search`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/rss`, changeFrequency: "monthly", priority: 0.55 },
    { url: `${baseUrl}/feed.xml`, changeFrequency: "hourly", priority: 0.55 },
    { url: `${baseUrl}/sitemap`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/team`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/editorial-charter`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/careers`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/press`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/advertising`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/accessibility`, changeFrequency: "yearly", priority: 0.45 },
    { url: `${baseUrl}/cookies`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/videos`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/podcasts`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/infographics`, changeFrequency: "weekly", priority: 0.55 },
    { url: `${baseUrl}/photo-galleries`, changeFrequency: "weekly", priority: 0.55 },
    { url: `${baseUrl}/right-to-erasure`, changeFrequency: "yearly", priority: 0.35 },
    { url: `${baseUrl}/profile`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/login`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/register`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    await connectDB();
    const [articles, categories, authors] = await Promise.all([
      Article.find({ status: "published" })
        .select("slug updatedAt publishedAt isUrgent")
        .sort({ publishedAt: -1 })
        .lean(),
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
      Author.find().select("slug updatedAt").lean(),
    ]);

    const articlePages = articles.map((a) => ({
      url: `${baseUrl}/article/${a.slug}`,
      lastModified: a.updatedAt ?? a.publishedAt ?? now,
      changeFrequency: a.isUrgent ? ("hourly" as const) : ("weekly" as const),
      priority: a.isUrgent ? 0.92 : 0.9,
    }));

    const categoryList = filterRetiredCategories(
      (categories.length > 0 ? categories : mockCategories).map((c) => ({
        slug: c.slug,
        updatedAt: "updatedAt" in c ? c.updatedAt : undefined,
      }))
    );
    const categoryPages = categoryList.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified:
        "updatedAt" in c && c.updatedAt instanceof Date
          ? c.updatedAt
          : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    const authorSlugs = authors.length > 0 ? authors : SEED_AUTHORS;
    const authorPages = authorSlugs.map((a) => ({
      url: `${baseUrl}/author/${a.slug}`,
      lastModified:
        "updatedAt" in a && a.updatedAt instanceof Date
          ? a.updatedAt
          : now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...articlePages, ...categoryPages, ...authorPages];
  } catch {
    return staticPages;
  }
}
