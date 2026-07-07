import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { isNewsletterMailConfigured } from "@/lib/newsletter-mail";
import { processScheduledNewsletterCampaigns } from "@/lib/newsletter-send";

/** Comparaison à temps constant pour éviter les attaques temporelles. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization")?.trim();
  if (authHeader && safeEqual(authHeader, `Bearer ${secret}`)) return true;

  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  return Boolean(headerSecret && safeEqual(headerSecret, secret));
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
