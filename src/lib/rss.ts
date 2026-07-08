import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { searchMockArticles } from "@/lib/mock-data";
import {
  getFeedUrl,
  getSiteUrl,
  PUBLISHER_NAME,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/site";

export interface RssItem {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt?: string;
  updatedAt?: string;
  categoryName?: string;
  authorName?: string;
  imageUrl?: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toAbsoluteUrl(baseUrl: string, path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function fetchRssItems(options?: {
  limit?: number;
  categorySlug?: string;
}): Promise<RssItem[]> {
  const limit = options?.limit ?? 40;

  try {
    await connectDB();
    const query: Record<string, unknown> = { status: "published" };
    if (options?.categorySlug) {
      const { Category } = await import("@/models/Category");
      const category = await Category.findOne({ slug: options.categorySlug })
        .select("_id")
        .lean();
      if (category) {
        query.category = category._id;
      }
    }

    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate("category", "name slug")
      .populate("authors", "name")
      .select("title slug excerpt publishedAt updatedAt featuredImage authors category")
      .lean();

    if (articles.length > 0) {
      return articles.map((article) => {
        const category = article.category as { name?: string } | null;
        const authors = article.authors as { name?: string }[];
        return {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          publishedAt: article.publishedAt?.toISOString(),
          updatedAt: article.updatedAt?.toISOString(),
          categoryName: category?.name,
          authorName: authors.map((a) => a.name).filter(Boolean).join(", "),
          imageUrl: article.featuredImage,
        };
      });
    }
  } catch {
    // fall through to mock data (démo uniquement)
  }

  // Contenu de démo activé par défaut ; mettre ENABLE_DEMO_CONTENT=false pour un flux vide.
  if (process.env.ENABLE_DEMO_CONTENT === "false") return [];

  return searchMockArticles("").slice(0, Math.min(limit, 20)).map((article) => ({
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt,
    categoryName: article.category?.name,
    authorName: article.authors?.[0]?.name,
    imageUrl: article.featuredImage,
  }));
}

export function buildRssXml(
  items: RssItem[],
  options?: { channelTitle?: string; channelDescription?: string; logoUrl?: string }
): string {
  const baseUrl = getSiteUrl();
  const feedUrl = getFeedUrl();
  const logoUrl = toAbsoluteUrl(
    baseUrl,
    options?.logoUrl ?? "/images/logo-global-south-watch.png"
  );
  const lastBuildDate = items[0]?.publishedAt
    ? new Date(items[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const channelTitle = options?.channelTitle ?? SITE_NAME;
  const channelDescription = options?.channelDescription ?? SITE_TAGLINE;

  const itemXml = items
    .map((item) => {
      const link = `${baseUrl}/article/${item.slug}`;
      const pubDate = item.publishedAt
        ? new Date(item.publishedAt).toUTCString()
        : "";
      const imageTag = item.imageUrl
        ? `
      <enclosure url="${escapeXml(toAbsoluteUrl(baseUrl, item.imageUrl))}" type="image/jpeg" />`
        : "";

      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(item.excerpt)}</description>
      <content:encoded><![CDATA[${item.excerpt}]]></content:encoded>${imageTag}
      ${item.categoryName ? `<category>${escapeXml(item.categoryName)}</category>` : ""}
      ${item.authorName ? `<author>${escapeXml(item.authorName)}</author>` : ""}
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(PUBLISHER_NAME)}</copyright>
    <managingEditor>editorial@globalsouthwatch.com (${escapeXml(SITE_NAME)})</managingEditor>
    <webMaster>tech@globalsouthwatch.com (${escapeXml(PUBLISHER_NAME)})</webMaster>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Global South Watch RSS</generator>
    <image>
      <url>${escapeXml(logoUrl)}</url>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${baseUrl}</link>
    </image>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${itemXml}
  </channel>
</rss>`;
}
