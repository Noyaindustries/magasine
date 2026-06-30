import { connectDB } from "@/lib/mongodb";
import {
  getNewsletterFromName,
  isNewsletterMailConfigured,
  sendNewsletterMail,
} from "@/lib/newsletter-mail";
import { createNewsletterUnsubscribeUrl } from "@/lib/newsletter-unsubscribe";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { Newsletter } from "@/models/Newsletter";
import { NewsletterCampaign, type INewsletterCampaign } from "@/models/NewsletterCampaign";

const SEND_BATCH_SIZE = 10;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtmlParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function buildNewsletterEmailContent(options: {
  subject: string;
  body: string;
  siteName: string;
  unsubscribeUrl: string;
}): { text: string; html: string } {
  const footer = `\n\n— ${options.siteName}\nUnsubscribe: ${options.unsubscribeUrl}`;
  const text = `${options.body}${footer}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e1d8;">
            <tr>
              <td style="padding:28px 32px 12px;border-bottom:3px solid #c41e3a;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#c41e3a;font-weight:700;">
                ${escapeHtml(options.siteName)}
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;font-size:24px;line-height:1.25;font-weight:700;">
                ${escapeHtml(options.subject)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;font-size:16px;">
                ${textToHtmlParagraphs(options.body)}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #ece7de;font-size:12px;line-height:1.6;color:#666;">
                You are receiving this because you subscribed to ${escapeHtml(options.siteName)}.
                <br />
                <a href="${options.unsubscribeUrl}" style="color:#c41e3a;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text, html };
}

export async function getSubscriberEmailsForList(listTarget: string): Promise<string[]> {
  await connectDB();

  const query =
    listTarget === "all"
      ? { isActive: true }
      : {
          isActive: true,
          preferences: listTarget,
        };

  const subscribers = await Newsletter.find(query).select("email").lean();
  return subscribers.map((row) => row.email.toLowerCase().trim());
}

async function sendToRecipient(options: {
  email: string;
  subject: string;
  body: string;
  siteName: string;
}): Promise<boolean> {
  const unsubscribeUrl = createNewsletterUnsubscribeUrl(options.email);
  const content = buildNewsletterEmailContent({
    subject: options.subject,
    body: options.body,
    siteName: options.siteName,
    unsubscribeUrl,
  });

  try {
    await sendNewsletterMail({
      to: options.email,
      subject: options.subject,
      text: content.text,
      html: content.html,
    });
    return true;
  } catch (error) {
    console.error("[newsletter] send failed", options.email, error);
    return false;
  }
}

export async function sendWelcomeNewsletterEmail(email: string): Promise<void> {
  if (!isNewsletterMailConfigured()) return;

  const settings = await getPublicSiteSettings();
  const subject = `Welcome to ${settings.siteName}`;
  const body = `Thank you for subscribing.\n\nYou'll receive our editorial selections directly in your inbox.`;

  await sendToRecipient({
    email,
    subject,
    body,
    siteName: settings.siteName,
  });
}

export interface NewsletterSendResult {
  attempted: number;
  delivered: number;
  failed: number;
}

export async function deliverNewsletterCampaign(
  campaign: Pick<INewsletterCampaign, "_id" | "subject" | "body" | "listTarget">
): Promise<NewsletterSendResult> {
  if (!isNewsletterMailConfigured()) {
    throw new Error("Newsletter SMTP is not configured.");
  }

  const settings = await getPublicSiteSettings();
  const recipients = await getSubscriberEmailsForList(campaign.listTarget);
  let delivered = 0;
  let failed = 0;

  for (let index = 0; index < recipients.length; index += SEND_BATCH_SIZE) {
    const batch = recipients.slice(index, index + SEND_BATCH_SIZE);
    const results = await Promise.all(
      batch.map((email) =>
        sendToRecipient({
          email,
          subject: campaign.subject,
          body: campaign.body,
          siteName: settings.siteName,
        })
      )
    );

    for (const ok of results) {
      if (ok) delivered += 1;
      else failed += 1;
    }
  }

  return {
    attempted: recipients.length,
    delivered,
    failed,
  };
}

export async function sendNewsletterCampaignById(campaignId: string): Promise<NewsletterSendResult> {
  await connectDB();

  const campaign = await NewsletterCampaign.findOneAndUpdate(
    { _id: campaignId, status: { $in: ["draft", "scheduled"] } },
    { $set: { status: "sending" } },
    { new: true }
  );

  if (!campaign) {
    const existing = await NewsletterCampaign.findById(campaignId).lean();
    if (!existing) {
      throw new Error("Campaign not found.");
    }
    if (existing.status === "sent") {
      return {
        attempted: existing.recipientCount,
        delivered: existing.recipientCount,
        failed: 0,
      };
    }
    throw new Error("Campaign is already being sent.");
  }

  try {
    const result = await deliverNewsletterCampaign(campaign);
    const now = new Date();

    campaign.status = "sent";
    campaign.sentAt = now;
    campaign.recipientCount = result.delivered;
    campaign.openCount = 0;
    campaign.clickCount = 0;
    await campaign.save();

    if (result.failed > 0) {
      console.warn(
        `[newsletter] campaign ${campaignId}: ${result.delivered}/${result.attempted} delivered, ${result.failed} failed`
      );
    }

    return result;
  } catch (error) {
    campaign.status = "draft";
    await campaign.save();
    throw error;
  }
}

export async function processScheduledNewsletterCampaigns(): Promise<number> {
  await connectDB();
  const now = new Date();

  const dueCampaigns = await NewsletterCampaign.find({
    status: "scheduled",
    scheduledAt: { $lte: now },
  })
    .sort({ scheduledAt: 1 })
    .limit(5)
    .select("_id")
    .lean();

  let processed = 0;
  for (const campaign of dueCampaigns) {
    await sendNewsletterCampaignById(String(campaign._id));
    processed += 1;
  }

  return processed;
}
