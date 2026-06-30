import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { isNewsletterMailConfigured } from "@/lib/newsletter-mail";
import { connectDB } from "@/lib/mongodb";
import { getSubscriberEmailsForList, sendNewsletterCampaignById } from "@/lib/newsletter-send";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  await connectDB();
  const campaigns = await NewsletterCampaign.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      _id: String(c._id),
      title: c.title,
      subtitle: c.subtitle ?? "",
      subject: c.subject,
      status: c.status,
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
  scheduledAt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  if (!isNewsletterMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "SMTP is not configured. Set SMTP_HOST and SMTP_FROM in your environment to send newsletters.",
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();

  const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined;
  const isScheduled = Boolean(scheduledAt && scheduledAt.getTime() > Date.now());
  const recipientCount = (await getSubscriberEmailsForList(parsed.data.listTarget)).length;

  if (recipientCount === 0) {
    return NextResponse.json({ error: "No active subscribers match this list." }, { status: 400 });
  }

  const campaign = await NewsletterCampaign.create({
    title: parsed.data.title,
    subtitle: parsed.data.subject,
    subject: parsed.data.subject,
    body: parsed.data.body,
    listTarget: parsed.data.listTarget,
    status: isScheduled ? "scheduled" : "draft",
    scheduledAt: isScheduled ? scheduledAt : undefined,
    recipientCount: 0,
    openCount: 0,
    clickCount: 0,
  });

  if (isScheduled) {
    return NextResponse.json({
      _id: String(campaign._id),
      status: campaign.status,
      recipientCount,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      message: `Campaign scheduled for ${recipientCount} subscriber(s).`,
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
    await NewsletterCampaign.findByIdAndDelete(campaign._id);
    console.error("[newsletter] campaign send failed", error);
    return NextResponse.json({ error: "Unable to send newsletter." }, { status: 500 });
  }
}
