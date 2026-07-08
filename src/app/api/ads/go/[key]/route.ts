import { NextRequest, NextResponse } from "next/server";
import { incrementAdMetric, loadAdZones } from "@/lib/ad-zones-storage";

function safeExternalUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Enregistre un clic publicitaire puis redirige vers le lien de la zone.
 * Valide le lien (http/https uniquement) pour éviter les redirections ouvertes
 * dangereuses (javascript:, data:, etc.).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const homeUrl = new URL("/", request.url);

  try {
    const zones = await loadAdZones();
    const zone = zones.find((z) => z.key === key);
    const target = safeExternalUrl(zone?.linkUrl);

    if (!zone || !target) {
      return NextResponse.redirect(homeUrl);
    }

    await incrementAdMetric(key, "clicks");
    return NextResponse.redirect(target);
  } catch {
    return NextResponse.redirect(homeUrl);
  }
}
