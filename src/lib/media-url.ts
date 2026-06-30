import { IMG } from "@/lib/img";

export const LOCAL_MEDIA_PREFIX = "/uploads/media/";
export const LOCAL_BRANDING_PREFIX = "/uploads/branding/";

export function isLocalMediaUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith(LOCAL_MEDIA_PREFIX) || trimmed.startsWith(LOCAL_BRANDING_PREFIX);
}

export function localMediaFilename(url: string): string | null {
  const trimmed = url.trim();
  if (!isLocalMediaUrl(trimmed)) return null;
  const filename = trimmed.split("/").pop();
  if (!filename || filename.includes("..")) return null;
  return filename;
}

/** Public blob store host, e.g. https://abc123.public.blob.vercel-storage.com */
export function getBlobMediaBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_BLOB_MEDIA_BASE_URL?.trim() ||
    process.env.BLOB_MEDIA_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function blobUrlForLocalMedia(url: string): string | null {
  const base = getBlobMediaBaseUrl();
  const filename = localMediaFilename(url);
  if (!base || !filename) return null;

  const folder = url.trim().startsWith(LOCAL_BRANDING_PREFIX) ? "branding" : "media";
  return `${base}/${folder}/${filename}`;
}

const FALLBACK_POOL = [
  IMG.finance,
  IMG.africa,
  IMG.politics,
  IMG.tech,
  IMG.health,
  IMG.economy,
  IMG.investigation,
] as const;

export function fallbackImageForLocalMedia(url: string): string {
  const filename = localMediaFilename(url) ?? url;
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_POOL[hash % FALLBACK_POOL.length] ?? IMG.finance;
}

/**
 * Resolves site-relative upload paths for production.
 * Local disk uploads are not deployed — use blob base URL or editorial fallback.
 */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return IMG.finance;

  const trimmed = url.trim();
  if (!isLocalMediaUrl(trimmed)) {
    return trimmed;
  }

  const blobUrl = blobUrlForLocalMedia(trimmed);
  if (blobUrl) {
    return blobUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return trimmed;
  }

  return fallbackImageForLocalMedia(trimmed);
}
