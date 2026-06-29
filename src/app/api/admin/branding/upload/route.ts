import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  BRANDING_MAX_BYTES,
  BRANDING_MIME_TYPES,
  type BrandingAssetType,
} from "@/lib/branding";
import { saveBrandingFileToDisk } from "@/lib/branding-storage";
import { getPublicSiteSettings, updateSiteSettings } from "@/lib/site-settings";

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
      { error: "Unsupported format. Use PNG, JPG, WebP, SVG, or ICO." },
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
    const url = await saveBrandingFileToDisk(type, file);
    const settings = await updateSiteSettings({ [type]: url });
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
