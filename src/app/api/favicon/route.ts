import { NextRequest, NextResponse } from "next/server";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { resolveFavicon } from "@/lib/branding";

// Sert toujours le favicon courant configuré dans l'admin (jamais figé au build).
// Les pages statiques référencent une URL constante (/api/favicon) tandis que cette
// route renvoie l'image réellement configurée — les changements sont donc visibles.
export const dynamic = "force-dynamic";

const DEFAULT_FAVICON_PATH = "/images/logo-global-south-watch.png";

function contentTypeFromUrl(url: string, fallback: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".ico")) return "image/x-icon";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  return fallback;
}

export async function GET(request: NextRequest) {
  let target = DEFAULT_FAVICON_PATH;
  try {
    const settings = await getPublicSiteSettings();
    target = resolveFavicon(settings.favicon);
  } catch {
    // Repli sur le favicon par défaut si les réglages sont indisponibles.
  }

  // Chemins relatifs (dev local / image par défaut) : simple redirection.
  if (!/^https?:\/\//i.test(target)) {
    return NextResponse.redirect(new URL(target, request.url), 307);
  }

  // URL absolue (blob) : on relaie les octets frais pour éviter tout cache périmé.
  try {
    const upstream = await fetch(target, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.redirect(new URL(DEFAULT_FAVICON_PATH, request.url), 307);
    }
    const contentType = contentTypeFromUrl(
      target,
      upstream.headers.get("content-type") ?? "image/x-icon",
    );
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Court : le navigateur revalide vite après un changement de favicon.
        "Cache-Control": "public, max-age=300, must-revalidate",
      },
    });
  } catch {
    return NextResponse.redirect(new URL(DEFAULT_FAVICON_PATH, request.url), 307);
  }
}
