import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { NewsletterCampaign } from "@/models/NewsletterCampaign";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const { id } = await context.params;
  await connectDB();

  const deleted = await NewsletterCampaign.findByIdAndDelete(id);
  if (!deleted) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
