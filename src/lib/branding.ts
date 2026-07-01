export const DEFAULT_SITE_LOGO = "/images/logo-global-south-watch.png";
export const DEFAULT_FAVICON = "/images/logo-global-south-watch.png";

export const BRANDING_UPLOAD_DIR = "public/uploads/branding";

export const BRANDING_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;

export const BRANDING_MAX_BYTES = {
  siteLogo: 2 * 1024 * 1024,
  favicon: 512 * 1024,
} as const;

export type BrandingAssetType = "siteLogo" | "favicon";

export function resolveSiteLogo(url?: string | null): string {
  const trimmed = url?.trim();
  return trimmed || DEFAULT_SITE_LOGO;
}

export function resolveFavicon(url?: string | null): string {
  const trimmed = url?.trim();
  return trimmed || DEFAULT_FAVICON;
}

export function brandingFileBaseName(type: BrandingAssetType): string {
  return type === "siteLogo" ? "site-logo" : "favicon";
}

export function extensionFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/svg+xml":
      return ".svg";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return ".ico";
    default:
      return ".png";
  }
}
