/** Editorial image helpers — IMG lives in ./img to avoid circular imports with media-url. */
import { IMG } from "@/lib/img";
import {
  fallbackImageForLocalMedia,
  isLocalMediaUrl,
  resolveMediaUrl,
} from "@/lib/media-url";

export { IMG };

export { DEFAULT_SITE_LOGO as SITE_LOGO } from "@/lib/branding";

/** Removed Unsplash photos — replaced by ID (independent of query params). */
const REMOVED_UNSPLASH_PHOTO_IDS: Record<string, string> = {
  "photo-1574943325722-55f388851e73": IMG.agriculture,
  "photo-1611162617474-5b21e939e113": IMG.tech,
  "photo-1509316785289-025f5b846b8e": IMG.sahel,
  "photo-1524492412937-280c33fd95dd": IMG.southAsia,
};

export function resolveFeaturedImage(url: string | undefined | null): string {
  if (!url) return IMG.finance;

  const trimmed = url.trim();
  for (const [photoId, replacement] of Object.entries(REMOVED_UNSPLASH_PHOTO_IDS)) {
    if (trimmed.includes(photoId)) {
      return replacement;
    }
  }

  if (isLocalMediaUrl(trimmed)) {
    return resolveMediaUrl(trimmed);
  }

  return trimmed;
}

/** Pick a stable fallback when replacing broken local upload URLs in the database. */
export function replacementForBrokenLocalMedia(url: string): string {
  return fallbackImageForLocalMedia(url);
}

export function getAuthorAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
}

export function resolveAuthorAvatar(avatar: string | undefined | null, seed: string): string {
  if (!avatar || avatar.includes("/svg?")) {
    return getAuthorAvatarUrl(seed);
  }
  return avatar;
}
