import { connectDB } from "@/lib/mongodb";
import { isNewsletterMailConfigured } from "@/lib/newsletter-mail";
import { sendNewsletterCampaignById } from "@/lib/newsletter-send";
import { getSiteUrl } from "@/lib/site";
import { Article } from "@/models/Article";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";
import { isRetiredCategorySlug } from "@/lib/retired-categories";

const MULTIMEDIA_TYPES = new Set(["video", "podcast", "gallery"]);

function formatLabel(contentType: string): string {
  if (contentType === "video") return "Video";
  if (contentType === "podcast") return "Podcast";
  if (contentType === "gallery") return "Photo gallery";
  return "Story";
}

export function isMultimediaArticle(article: {
  contentType: string;
  category?: { slug?: string } | null;
}): boolean {
  if (MULTIMEDIA_TYPES.has(article.contentType)) return true;
  const slug = article.category?.slug?.toLowerCase();
  return slug === "multimedia" || isRetiredCategorySlug(slug);
}

export async function notifySubscribersOnMultimediaPublish(articleId: string): Promise<void> {
  if (!isNewsletterMailConfigured()) return;

  await connectDB();

  const article = await Article.findById(articleId)
    .populate<{ category: { name: string; slug: string } | null }>("category", "name slug")
    .lean();

  if (!article || article.status !== "published") return;
  if (!isMultimediaArticle(article)) return;

  const label = formatLabel(article.contentType);
  const articleUrl = `${getSiteUrl()}/article/${article.slug}`;
  const subject = `New ${label.toLowerCase()}: ${article.title}`;
  const body = `${article.excerpt}\n\n${label}: ${article.title}\n${articleUrl}`;

  const campaign = await NewsletterCampaign.create({
    title: subject,
    subtitle: label,
    subject,
    body,
    listTarget: "all",
    status: "draft",
    recipientCount: 0,
    openCount: 0,
    clickCount: 0,
  });

  try {
    await sendNewsletterCampaignById(String(campaign._id));
  } catch (error) {
    await NewsletterCampaign.findByIdAndDelete(campaign._id);
    throw error;
  }
}
