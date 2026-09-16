import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { requireAdminApi } from "@/lib/admin-api";
import { isNewsletterMailConfigured } from "@/lib/newsletter-mail";
import { connectDB } from "@/lib/mongodb";
import { isNewsletterBodyHtml, sanitizeNewsletterBodyHtml } from "@/lib/newsletter-body-html";
import {
  getSubscriberEmailsForList,
  resolveSelectedRecipientEmails,
  sendNewsletterCampaignById,
} from "@/lib/newsletter-send";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";
import {
  MAX_SELECTED_NEWSLETTER_RECIPIENTS,
  SELECTED_LIST_TARGET,
  clampNewsletterSendLimit,
} from "@/lib/newsletter-recipients";

/** Allow long campaign sends on Vercel (Pro: up to 300s). Hobby may still time out on huge lists. */
export const maxDuration = 300;

function sanitizeBody(raw: string): string {
  const trimmed = raw.trim();
  return isNewsletterBodyHtml(trimmed)
    ? sanitizeNewsletterBodyHtml(trimmed) || trimmed
    : trimmed;
}

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  await connectDB();
  const campaigns = await NewsletterCampaign.find()
    .sort({ createdAt: -1 })
    .limit(40)
    .lean();

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      _id: String(c._id),
      title: c.title,
      subtitle: c.subtitle ?? "",
      subject: c.subject,
      status: c.status,
      listTarget: c.listTarget ?? "all",
      scheduledAt: c.scheduledAt?.toISOString(),
      sentAt: c.sentAt?.toISOString(),
      recipientCount: c.recipientCount,
      openCount: c.openCount,
      clickCount: c.clickCount,
    })),
    mailConfigured: isNewsletterMailConfigured(),
  });
}

const createSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  listTarget: z.string().default("all"),
  recipientEmails: z.array(z.string().email()).max(MAX_SELECTED_NEWSLETTER_RECIPIENTS).optional(),
  /** How many people to send to (from the chosen list / selection). */
  recipientLimit: z.number().int().min(1).max(MAX_SELECTED_NEWSLETTER_RECIPIENTS).optional(),
  scheduledAt: z.string().optional(),
  /** Persist without sending (can be updated later). */
  saveAsDraft: z.boolean().optional(),
  /** When set with saveAsDraft, update this existing draft instead of creating a new one. */
  draftId: z.string().optional(),
});

async function resolveRecipients(args: {
  listTarget: string;
  recipientEmails?: string[];
  recipientLimit?: number;
  allowEmpty: boolean;
}): Promise<
  | { listTarget: string; recipientEmails: string[]; recipientCount: number }
  | { error: string; status: number }
> {
  const wantsSelected =
    args.listTarget === SELECTED_LIST_TARGET || (args.recipientEmails?.length ?? 0) > 0;

  if (wantsSelected) {
    const emails = args.recipientEmails ?? [];
    if (emails.length === 0) {
      if (args.allowEmpty) {
        return { listTarget: SELECTED_LIST_TARGET, recipientEmails: [], recipientCount: 0 };
      }
      return { error: "Select at least one subscriber.", status: 400 };
    }
    const resolved = await resolveSelectedRecipientEmails(emails);
    if ("error" in resolved) {
      return { error: resolved.error, status: 400 };
    }
    const limit = clampNewsletterSendLimit(
      args.recipientLimit ?? resolved.emails.length,
      Math.max(1, resolved.emails.length)
    );
    const recipientEmails = resolved.emails.slice(0, limit);
    return {
      listTarget: SELECTED_LIST_TARGET,
      recipientEmails,
      recipientCount: recipientEmails.length,
    };
  }

  const listEmails = await getSubscriberEmailsForList(args.listTarget);
  if (args.allowEmpty) {
    // Drafts keep listTarget only; recipients are resolved at send time.
    return { listTarget: args.listTarget, recipientEmails: [], recipientCount: listEmails.length };
  }
  if (listEmails.length === 0) {
    return { error: "No active subscribers match this list.", status: 400 };
  }
  const limit = clampNewsletterSendLimit(args.recipientLimit, listEmails.length);
  const recipientEmails = listEmails.slice(0, limit);
  return {
    listTarget: args.listTarget,
    recipientEmails,
    recipientCount: recipientEmails.length,
  };
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const saveAsDraft = parsed.data.saveAsDraft === true;

  if (!saveAsDraft && !isNewsletterMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMTP is not configured. Set SMTP_HOST and SMTP_FROM in your environment to send newsletters.",
      },
      { status: 503 }
    );
  }

  await connectDB();

  const campaignBody = sanitizeBody(parsed.data.body);
  const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined;
  const isScheduled = Boolean(!saveAsDraft && scheduledAt && scheduledAt.getTime() > Date.now());

  const resolved = await resolveRecipients({
    listTarget: parsed.data.listTarget,
    recipientEmails: parsed.data.recipientEmails,
    recipientLimit: parsed.data.recipientLimit,
    allowEmpty: saveAsDraft,
  });
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  if (saveAsDraft) {
    const draftId = parsed.data.draftId?.trim();
    if (draftId) {
      if (!mongoose.Types.ObjectId.isValid(draftId)) {
        return NextResponse.json({ error: "Invalid draft id." }, { status: 400 });
      }
      const existing = await NewsletterCampaign.findById(draftId);
      if (!existing) {
        return NextResponse.json({ error: "Draft not found." }, { status: 404 });
      }
      if (existing.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft campaigns can be updated this way." },
          { status: 400 }
        );
      }
      existing.title = parsed.data.title;
      existing.subtitle = parsed.data.subject;
      existing.subject = parsed.data.subject;
      existing.body = campaignBody;
      existing.listTarget = resolved.listTarget;
      existing.recipientEmails = resolved.recipientEmails;
      existing.scheduledAt = undefined;
      await existing.save();
      return NextResponse.json({
        _id: String(existing._id),
        status: "draft",
        recipientCount: resolved.recipientCount,
        message: "Draft updated.",
      });
    }

    const draft = await NewsletterCampaign.create({
      title: parsed.data.title,
      subtitle: parsed.data.subject,
      subject: parsed.data.subject,
      body: campaignBody,
      listTarget: resolved.listTarget,
      recipientEmails: resolved.recipientEmails,
      status: "draft",
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
    });

    return NextResponse.json({
      _id: String(draft._id),
      status: "draft",
      recipientCount: resolved.recipientCount,
      message: "Draft saved. You can reopen and send it later.",
    });
  }

  if (resolved.recipientCount === 0) {
    return NextResponse.json(
      {
        error:
          resolved.listTarget === SELECTED_LIST_TARGET
            ? "Select at least one subscriber."
            : "No active subscribers match this list.",
      },
      { status: 400 }
    );
  }

  const existingDraftId = parsed.data.draftId?.trim();
  let campaign =
    existingDraftId && mongoose.Types.ObjectId.isValid(existingDraftId)
      ? await NewsletterCampaign.findById(existingDraftId)
      : null;

  if (existingDraftId && !campaign) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }
  if (campaign && campaign.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft campaigns can be sent from the editor this way." },
      { status: 400 }
    );
  }

  if (campaign) {
    campaign.title = parsed.data.title;
    campaign.subtitle = parsed.data.subject;
    campaign.subject = parsed.data.subject;
    campaign.body = campaignBody;
    campaign.listTarget = resolved.listTarget;
    campaign.recipientEmails = resolved.recipientEmails;
    campaign.status = isScheduled ? "scheduled" : "draft";
    campaign.scheduledAt = isScheduled ? scheduledAt : undefined;
    campaign.recipientCount = 0;
    await campaign.save();
  } else {
    campaign = await NewsletterCampaign.create({
      title: parsed.data.title,
      subtitle: parsed.data.subject,
      subject: parsed.data.subject,
      body: campaignBody,
      listTarget: resolved.listTarget,
      recipientEmails: resolved.recipientEmails,
      status: isScheduled ? "scheduled" : "draft",
      scheduledAt: isScheduled ? scheduledAt : undefined,
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
    });
  }

  if (isScheduled) {
    return NextResponse.json({
      _id: String(campaign._id),
      status: campaign.status,
      recipientCount: resolved.recipientCount,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      message: `Campaign scheduled for ${resolved.recipientCount} subscriber(s).`,
    });
  }

  try {
    const result = await sendNewsletterCampaignById(String(campaign._id));
    return NextResponse.json({
      _id: String(campaign._id),
      status: "sent",
      recipientCount: result.delivered,
      attempted: result.attempted,
      failed: result.failed,
      message: `Newsletter sent to ${result.delivered} subscriber(s).`,
    });
  } catch (error) {
    // Keep as draft so the content is not lost on SMTP failure.
    campaign.status = "draft";
    await campaign.save();
    console.error("[newsletter] campaign send failed", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to send newsletter.";
    return NextResponse.json(
      {
        error: message,
        _id: String(campaign._id),
        status: "draft",
        message: "Send failed — campaign kept as draft so you can retry.",
      },
      { status: 500 }
    );
  }
}
