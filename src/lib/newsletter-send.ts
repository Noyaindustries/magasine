import { connectDB } from "@/lib/mongodb";
import {
  isNewsletterMailConfigured,
  NewsletterSmtpAuthError,
  sendNewsletterMail,
  verifyNewsletterMailConnection,
} from "@/lib/newsletter-mail";
import {
  resolveNewsletterEmailHeaderTitle,
  resolveNewsletterEmailLogoUrl,
} from "@/lib/newsletter-email-branding";
import {
  isNewsletterBodyHtml,
  newsletterBodyHtmlToEmailFragment,
  newsletterBodyToPlainText,
} from "@/lib/newsletter-body-html";
import { createNewsletterUnsubscribeUrl } from "@/lib/newsletter-unsubscribe";
import { escapeMongoRegex } from "@/lib/mongo-regex";
import {
  MAX_SELECTED_NEWSLETTER_RECIPIENTS,
  SELECTED_LIST_TARGET,
  uniqueNewsletterEmails,
} from "@/lib/newsletter-recipients";
import { getSiteUrl } from "@/lib/site";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { Newsletter } from "@/models/Newsletter";
import { NewsletterCampaign, type INewsletterCampaign } from "@/models/NewsletterCampaign";

const SEND_BATCH_SIZE = resolveSendBatchSize();

/** Recipients processed per SMTP wave (default 500 for large campaigns). */
export function getNewsletterSendBatchSize(): number {
  return SEND_BATCH_SIZE;
}

/** Parallel SMTP sends per wave. Default 500; override with NEWSLETTER_SEND_BATCH_SIZE. */
function resolveSendBatchSize(): number {
  const raw = Number(process.env.NEWSLETTER_SEND_BATCH_SIZE ?? "500");
  if (!Number.isFinite(raw)) return 500;
  return Math.min(500, Math.max(1, Math.floor(raw)));
}

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

function buildNewsletterBodyHtml(body: string): string {
  if (isNewsletterBodyHtml(body)) {
    return newsletterBodyHtmlToEmailFragment(body);
  }
  return textToHtmlParagraphs(body);
}

export function buildNewsletterEmailContent(options: {
  subject: string;
  body: string;
  siteName: string;
  headerTitle: string;
  logoUrl: string;
  unsubscribeUrl: string;
}): { text: string; html: string } {
  const bodyText = isNewsletterBodyHtml(options.body)
    ? newsletterBodyToPlainText(options.body)
    : options.body;
  const footer = `\n\n— ${options.headerTitle}\nUnsubscribe: ${options.unsubscribeUrl}`;
  const text = `${bodyText}${footer}`;

  const siteUrl = getSiteUrl();
  const headerHtml = `
            <tr>
              <td style="padding:28px 32px 16px;border-bottom:3px solid #c41e3a;text-align:center;">
                <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;">
                  <img
                    src="${escapeHtml(options.logoUrl)}"
                    alt="${escapeHtml(options.siteName)}"
                    width="200"
                    style="display:block;max-width:200px;width:100%;height:auto;margin:0 auto 14px;border:0;"
                  />
                </a>
                <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#c41e3a;font-weight:700;">
                  ${escapeHtml(options.headerTitle)}
                </div>
              </td>
            </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5e1d8;">
            ${headerHtml}
            <tr>
              <td style="padding:28px 32px 8px;font-size:24px;line-height:1.25;font-weight:700;">
                ${escapeHtml(options.subject)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;font-size:16px;">
                ${buildNewsletterBodyHtml(options.body)}
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

export async function resolveSelectedRecipientEmails(
  emails: string[]
): Promise<{ emails: string[] } | { error: string }> {
  const unique = uniqueNewsletterEmails(emails);
  if (unique.length === 0) {
    return { error: "Select at least one subscriber." };
  }
  if (unique.length > MAX_SELECTED_NEWSLETTER_RECIPIENTS) {
    return {
      error: `Select at most ${MAX_SELECTED_NEWSLETTER_RECIPIENTS} subscribers.`,
    };
  }

  await connectDB();
  const found = await Newsletter.find({
    isActive: true,
    $or: unique.map((email) => ({
      email: new RegExp(`^${escapeMongoRegex(email)}$`, "i"),
    })),
  })
    .select("email")
    .lean();
  const foundSet = new Set(found.map((row) => row.email.toLowerCase().trim()));
  const missing = unique.filter((email) => !foundSet.has(email));
  if (missing.length > 0) {
    return {
      error: `Not an active subscriber: ${missing.slice(0, 3).join(", ")}${
        missing.length > 3 ? "…" : ""
      }`,
    };
  }

  return { emails: unique };
}

export async function getCampaignRecipientEmails(
  campaign: Pick<INewsletterCampaign, "listTarget" | "recipientEmails">
): Promise<string[]> {
  if (
    campaign.listTarget === SELECTED_LIST_TARGET ||
    (campaign.recipientEmails?.length ?? 0) > 0
  ) {
    return uniqueNewsletterEmails(campaign.recipientEmails ?? []);
  }
  return getSubscriberEmailsForList(campaign.listTarget);
}

async function sendToRecipient(options: {
  email: string;
  subject: string;
  body: string;
  siteName: string;
  headerTitle: string;
  logoUrl: string;
}): Promise<boolean> {
  const unsubscribeUrl = createNewsletterUnsubscribeUrl(options.email);
  const content = buildNewsletterEmailContent({
    subject: options.subject,
    body: options.body,
    siteName: options.siteName,
    headerTitle: options.headerTitle,
    logoUrl: options.logoUrl,
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
    if (error instanceof NewsletterSmtpAuthError) {
      throw error;
    }
    console.error("[newsletter] send failed", options.email, error);
    return false;
  }
}

export async function sendWelcomeNewsletterEmail(email: string): Promise<void> {
  if (!isNewsletterMailConfigured()) return;

  const settings = await getPublicSiteSettings();
  const headerTitle = resolveNewsletterEmailHeaderTitle(settings);
  const logoUrl = resolveNewsletterEmailLogoUrl(settings);
  const subject = `Welcome to ${settings.siteName}`;
  const body = `Thank you for subscribing.\n\nYou'll receive our editorial selections directly in your inbox.`;

  await sendToRecipient({
    email,
    subject,
    body,
    siteName: settings.siteName,
    headerTitle,
    logoUrl,
  });
}

export interface NewsletterSendResult {
  attempted: number;
  delivered: number;
  failed: number;
}

export async function deliverNewsletterCampaign(
  campaign: Pick<INewsletterCampaign, "_id" | "subject" | "body" | "listTarget" | "recipientEmails">
): Promise<NewsletterSendResult> {
  if (!isNewsletterMailConfigured()) {
    throw new Error("Newsletter SMTP is not configured.");
  }

  // Fail fast on bad credentials instead of retrying auth for every subscriber.
  await verifyNewsletterMailConnection();

  const settings = await getPublicSiteSettings();
  const headerTitle = resolveNewsletterEmailHeaderTitle(settings);
  const logoUrl = resolveNewsletterEmailLogoUrl(settings);
  const recipients = await getCampaignRecipientEmails(campaign);
  let delivered = 0;
  let failed = 0;
  const waveSize = SEND_BATCH_SIZE;
  const totalWaves = Math.ceil(recipients.length / waveSize) || 0;

  console.log(
    `[newsletter] starting delivery: ${recipients.length} recipient(s), ${totalWaves} wave(s) of up to ${waveSize}`
  );

  for (let index = 0; index < recipients.length; index += waveSize) {
    const batch = recipients.slice(index, index + waveSize);
    const waveNumber = Math.floor(index / waveSize) + 1;
    console.log(
      `[newsletter] wave ${waveNumber}/${totalWaves}: sending ${batch.length} email(s)`
    );
    try {
      const results = await Promise.all(
        batch.map((email) =>
          sendToRecipient({
            email,
            subject: campaign.subject,
            body: campaign.body,
            siteName: settings.siteName,
            headerTitle,
            logoUrl,
          })
        )
      );

      let waveDelivered = 0;
      let waveFailed = 0;
      for (const ok of results) {
        if (ok) {
          delivered += 1;
          waveDelivered += 1;
        } else {
          failed += 1;
          waveFailed += 1;
        }
      }
      console.log(
        `[newsletter] wave ${waveNumber}/${totalWaves} done: ${waveDelivered} ok, ${waveFailed} failed (total ${delivered}/${recipients.length})`
      );
    } catch (error) {
      if (error instanceof NewsletterSmtpAuthError) {
        throw error;
      }
      throw error;
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

    if (result.delivered === 0) {
      campaign.status = "draft";
      await campaign.save();
      throw new Error(
        result.attempted === 0
          ? "No active subscribers to send to."
          : `All ${result.attempted} delivery attempt(s) failed. Check SMTP_HOST / SMTP_USER / SMTP_PASS and server logs ([newsletter] send failed).`
      );
    }

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
