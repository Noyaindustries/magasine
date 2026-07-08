import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { resolveFavicon } from "@/lib/branding";

// Toujours résoudre le favicon courant (jamais figé au build) : les pages statiques
// référencent une URL constante (/api/favicon) tandis que cette route redirige vers
// l'image réellement configurée dans l'admin, ce qui reflète les changements aussitôt.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let target = "/images/logo-global-south-watch.png";
  try {
    const settings = await getPublicSiteSettings();
    target = resolveFavicon(settings.favicon);
  } catch {
    // Repli sur le favicon par défaut si les réglages sont indisponibles.
  }

  const location = new URL(target, request.url);
  const response = NextResponse.redirect(location, 307);
  // Revalidation courte côté navigateur/CDN pour propager vite un nouveau favicon.
  response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  return response;
}
