import { NextRequest, NextResponse } from "next/server";
import { incrementAdMetric } from "@/lib/ad-zones-storage";

/**
 * Suivi d'impression publicitaire (best-effort, appelé via sendBeacon/fetch).
 * Volontairement permissif : n'authentifie pas (métrique de vanité côté public),
 * mais n'accepte que l'incrément d'impressions. Les clics passent par /api/ads/go.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { key?: unknown; type?: unknown }
      | null;

    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!key || key.length > 128) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await incrementAdMetric(key, "impressions");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
