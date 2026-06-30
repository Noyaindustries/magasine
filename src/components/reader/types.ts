export interface ReaderArticleItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  publishedAt?: string;
  readingTime: number;
}

export interface ReaderProfileData {
  user: { name: string; email: string; isPremium: boolean; role: string };
  savedArticles: ReaderArticleItem[];
  readingHistory: ReaderArticleItem[];
}

export interface ReaderNewsletterStatus {
  subscribed: boolean;
  preferences?: string[];
}

export type ReaderTab = "overview" | "saved" | "history" | "newsletter";
