import { format, formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import type { ArticleListItem } from "@/types";
import { toSafeVideoEmbedUrl, isSafeVideoFileUrl } from "@/lib/video-url";

export function authorInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

export function formatTimeAgo(iso?: string): string {
  if (!iso) return "Recently";
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: enUS });
}

/** Calendar date for public article UI — e.g. "June 22, 2026". */
export function formatArticleDisplayDate(iso?: string): string {
  if (!iso) return "";
  return format(new Date(iso), "MMMM d, yyyy", { locale: enUS });
}

/** Public article cards/lists — date only. */
export function formatArticleListDate(iso?: string): string {
  const formatted = formatArticleDisplayDate(iso);
  return formatted || "Recently";
}

export function formatArticleAuthorName(
  article: Pick<ArticleListItem, "authors">
): string {
  return article.authors[0]?.name ?? "Editorial";
}

export function formatAuthorAndDate(author: string | undefined, iso?: string): string {
  return `${author?.trim() || "Editorial"} · ${formatArticleListDate(iso)}`;
}

/** Author + calendar date for article cards and list rows. */
export function formatArticleCardMeta(
  article: Pick<ArticleListItem, "publishedAt" | "authors">
): string {
  return formatAuthorAndDate(formatArticleAuthorName(article), article.publishedAt);
}

export function formatHomeCardMeta(card: { author?: string; meta?: string }): string {
  const author = card.author?.trim() || "Editorial";
  const date = card.meta?.trim();
  if (date) return `${author} · ${date}`;
  return author;
}

export function formatPublishedDate(iso?: string): string {
  if (!iso) return "";
  return format(new Date(iso), "MMMM d, yyyy, h:mm a", { locale: enUS });
}

export function formatViews(views?: number): string {
  if (!views) return "New";
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k views`;
  return `${views} views`;
}

export function splitHeroTitle(title: string, subtitle?: string): { main: string; em: string } {
  if (subtitle?.trim()) {
    return { main: title, em: subtitle };
  }
  const idx = title.indexOf(":");
  if (idx > 0 && idx < title.length - 2) {
    return {
      main: title.slice(0, idx + 1),
      em: title.slice(idx + 1).trim(),
    };
  }
  return { main: title, em: "" };
}

export function articleBadge(article: ArticleListItem): string {
  if (article.isUrgent) return "🔥 Breaking";
  if (article.contentType === "video") return "Video Report";
  if (article.isPremium) return "Exclusive Investigation";
  if (article.isEditorsChoice) return "Editor's Pick";
  if (article.isTopStory) return "Top Story";
  return "News";
}

export function toVideoEmbedUrl(url: string): string | null {
  return toSafeVideoEmbedUrl(url);
}

export function isVideoFile(url: string): boolean {
  return isSafeVideoFileUrl(url);
}

export { toSafeVideoEmbedUrl, isSafeVideoFileUrl } from "@/lib/video-url";
