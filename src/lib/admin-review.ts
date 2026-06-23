import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";

export interface ReviewQueueItem {
  _id: string;
  title: string;
  subtitle?: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: {
    name: string;
    slug: string;
    color?: string;
  };
  authors: { name: string }[];
  readingTime: number;
  updatedAt: string;
  createdAt: string;
  isUrgent: boolean;
  isPremium: boolean;
  isFeatured: boolean;
  isEditorsChoice: boolean;
  contentType: "article" | "video" | "podcast" | "gallery";
}

export async function getReviewQueueItems(): Promise<ReviewQueueItem[]> {
  await connectDB();

  const articles = await Article.find({ status: "review" })
    .populate("category", "name slug color")
    .populate("authors", "name")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  return articles.map((article) => {
    const category = article.category as unknown as {
      name: string;
      slug: string;
      color?: string;
    };
    const authors = article.authors as unknown as { name: string }[];

    return {
      _id: String(article._id),
      title: article.title,
      subtitle: article.subtitle ?? undefined,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featuredImage: article.featuredImage,
      category: {
        name: category.name,
        slug: category.slug,
        color: category.color,
      },
      authors: authors.map((a) => ({ name: a.name })),
      readingTime: article.readingTime,
      updatedAt: article.updatedAt.toISOString(),
      createdAt: article.createdAt.toISOString(),
      isUrgent: article.isUrgent,
      isPremium: article.isPremium,
      isFeatured: article.isFeatured,
      isEditorsChoice: article.isEditorsChoice,
      contentType: article.contentType,
    };
  });
}

export async function getReviewQueueCount(): Promise<number> {
  await connectDB();
  return Article.countDocuments({ status: "review" });
}
