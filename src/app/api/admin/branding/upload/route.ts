import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  BRANDING_MAX_BYTES,
  BRANDING_MIME_TYPES,
  type BrandingAssetType,
} from "@/lib/branding";
import { saveBrandingFile } from "@/lib/branding-storage";
import { getPublicSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { deleteBlobFile, isBlobUrl } from "@/lib/blob-storage";

const typeSchema = z.enum(["siteLogo", "favicon"]);

function isAllowedMime(mime: string): boolean {
  return (BRANDING_MIME_TYPES as readonly string[]).includes(mime);
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("users");
  if (guard.error) return guard.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const typeRaw = formData.get("type");

  const typeParsed = typeSchema.safeParse(typeRaw);
  if (!typeParsed.success) {
    return NextResponse.json({ error: "Invalid asset type." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const type: BrandingAssetType = typeParsed.data;

  if (!isAllowedMime(file.type)) {
    return NextResponse.json(
      { error: "Unsupported format. Use PNG, JPG, WebP, or ICO." },
      { status: 400 }
    );
  }

  const maxBytes = BRANDING_MAX_BYTES[type];
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${Math.round(maxBytes / 1024)} KB.` },
      { status: 400 }
    );
  }

  try {
    const previous = await getPublicSiteSettings();
    const previousUrl = type === "favicon" ? previous.favicon : previous.siteLogo;

    const url = await saveBrandingFile(type, file);
    const settings = await updateSiteSettings({ [type]: url });

    // Nettoyage best-effort de l'ancien fichier blob (nom désormais unique).
    if (previousUrl && previousUrl !== url && isBlobUrl(previousUrl)) {
      void deleteBlobFile(previousUrl).catch(() => {});
    }

    return NextResponse.json({ url, settings });
  } catch {
    return NextResponse.json({ error: "Could not save file on server." }, { status: 500 });
  }
}

export async function GET() {
  const guard = await requireAdminApi("editorial");
  if (guard.error) return guard.error;

  const settings = await getPublicSiteSettings();
  return NextResponse.json({
    siteLogo: settings.siteLogo,
    favicon: settings.favicon,
  });
}
