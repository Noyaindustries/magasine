import { NextRequest, NextResponse } from "next/server";
import { buildRssXml, fetchRssItems } from "@/lib/rss";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { SITE_NAME } from "@/lib/site";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? undefined;
  const [items, settings] = await Promise.all([
    fetchRssItems({ limit: 40, categorySlug: category }),
    getPublicSiteSettings(),
  ]);
  const channelTitle = category
    ? `${SITE_NAME} — ${category.replace(/-/g, " ")}`
    : SITE_NAME;

  const rss = buildRssXml(items, {
    channelTitle,
    channelDescription: category
      ? `Latest stories in ${category.replace(/-/g, " ")} from ${SITE_NAME}`
      : undefined,
    logoUrl: settings.siteLogo,
  });

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
