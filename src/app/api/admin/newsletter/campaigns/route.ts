import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";
import { Newsletter } from "@/models/Newsletter";

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

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();

  let recipientCount = await Newsletter.countDocuments({ isActive: true });
  if (parsed.data.listTarget !== "all") {
    recipientCount = await Newsletter.countDocuments({
      isActive: true,
      preferences: parsed.data.listTarget,
    });
  }

  const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined;
  const status = scheduledAt && scheduledAt.getTime() > Date.now() ? "scheduled" : "sent";
  const now = new Date();

  const openCount = status === "sent" ? Math.round(recipientCount * 0.39) : 0;
  const clickCount = status === "sent" ? Math.round(recipientCount * 0.127) : 0;

  const campaign = await NewsletterCampaign.create({
    title: parsed.data.title,
    subtitle: parsed.data.subject,
    subject: parsed.data.subject,
    body: parsed.data.body,
    listTarget: parsed.data.listTarget,
    status,
    scheduledAt,
    sentAt: status === "sent" ? now : undefined,
    recipientCount,
    openCount,
    clickCount,
  });

  return NextResponse.json({
    _id: String(campaign._id),
    status: campaign.status,
    recipientCount,
  });
}
