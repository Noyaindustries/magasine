import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyNewsletterUnsubscribeToken } from "@/lib/newsletter-unsubscribe";
import { Newsletter } from "@/models/Newsletter";
import { escapeHtml } from "@/lib/sanitize-html";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, { prefix: "unsubscribe", max: 20, windowMs: 3600_000 });
  if (limited) return limited;

  const email = request.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!email || !token || !verifyNewsletterUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 });
  }

  try {
    await connectDB();
    const subscriber = await Newsletter.findOne({ email });
    if (subscriber) {
      subscriber.isActive = false;
      await subscriber.save();
    }

    const html = `<!DOCTYPE html>
<html lang="en">
  <body style="font-family:Georgia,serif;padding:40px;max-width:520px;margin:0 auto;">
    <h1 style="font-size:24px;">You have been unsubscribed</h1>
    <p style="line-height:1.6;color:#444;">${escapeHtml(email)} will no longer receive newsletter emails from us.</p>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
