import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid campaign id." }, { status: 400 });
  }

  await connectDB();
  const campaign = await NewsletterCampaign.findById(id).lean();
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json({
    campaign: {
      _id: String(campaign._id),
      title: campaign.title,
      subtitle: campaign.subtitle ?? "",
      subject: campaign.subject,
      body: campaign.body,
      listTarget: campaign.listTarget ?? "all",
      recipientEmails: campaign.recipientEmails ?? [],
      status: campaign.status,
      scheduledAt: campaign.scheduledAt?.toISOString(),
      sentAt: campaign.sentAt?.toISOString(),
      recipientCount: campaign.recipientCount,
      openCount: campaign.openCount,
      clickCount: campaign.clickCount,
    },
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid campaign id." }, { status: 400 });
  }

  await connectDB();

  const deleted = await NewsletterCampaign.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
