import { NextRequest, NextResponse } from "next/server";
import { isNewsletterMailConfigured } from "@/lib/newsletter-mail";
import { processScheduledNewsletterCampaigns } from "@/lib/newsletter-send";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNewsletterMailConfigured()) {
    return NextResponse.json({ processed: 0, mailConfigured: false });
  }

  try {
    const processed = await processScheduledNewsletterCampaigns();
    return NextResponse.json({ processed, mailConfigured: true });
  } catch (error) {
    console.error("[newsletter cron]", error);
    return NextResponse.json({ error: "Cron failed." }, { status: 500 });
  }
}
