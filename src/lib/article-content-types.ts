import { toSafeVideoEmbedUrl } from "@/lib/video-url";

export const ARTICLE_CONTENT_TYPES = [
  { id: "article", label: "Article" },
  { id: "video", label: "Video" },
  { id: "podcast", label: "Podcast" },
  { id: "gallery", label: "Photo gallery" },
] as const;

export type ArticleContentType = (typeof ARTICLE_CONTENT_TYPES)[number]["id"];

export function isArticleContentType(value: string): value is ArticleContentType {
  return ARTICLE_CONTENT_TYPES.some((item) => item.id === value);
}

/** Autorise uniquement YouTube, Vimeo, fichiers vidéo locaux ou uploads internes. */
export function isValidVideoSourceUrl(url: string): boolean {
  return toSafeVideoEmbedUrl(url.trim()) !== null;
}
