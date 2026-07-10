export type ArticleStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "published"
  | "archived";

export type UserRole =
  | "super_admin"
  | "admin"
  | "editor"
  | "author"
  | "contributor"
  | "reader";

export interface AuthorInfo {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  slug: string;
}

export interface CategoryInfo {
  _id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

export interface ArticleListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  featuredImageAlt?: string;
  category: CategoryInfo;
  authors: AuthorInfo[];
  publishedAt?: string;
  readingTime: number;
  isPremium?: boolean;
  isEditorsChoice?: boolean;
  isFeatured?: boolean;
  isTopStory?: boolean;
  isUrgent?: boolean;
  views?: number;
  tags?: string[];
  regions?: CategoryInfo[];
  contentType?: "article" | "video" | "podcast" | "gallery";
  videoUrl?: string;
}

export interface ArticleDetail extends ArticleListItem {
  subtitle?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  gallery?: { url: string; caption?: string; credit?: string }[];
  shareCount?: number;
  featuredImageCaption?: string;
}
