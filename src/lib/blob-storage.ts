import { del, put } from "@vercel/blob";

const BLOB_HOST_PATTERN = /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//;

export function isBlobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isBlobUrl(url: string): boolean {
  return BLOB_HOST_PATTERN.test(url);
}

export interface UploadBlobOptions {
  /** Ajoute un suffixe aléatoire au nom (URL unique = busting du cache CDN/navigateur). */
  addRandomSuffix?: boolean;
  /** Durée de cache CDN en secondes (par défaut long ; à réduire pour le branding). */
  cacheControlMaxAge?: number;
}

export async function uploadBlobFile(
  pathname: string,
  file: File,
  contentType: string,
  options: UploadBlobOptions = {}
): Promise<string> {
  const result = await put(pathname, file, {
    access: "public",
    contentType,
    addRandomSuffix: options.addRandomSuffix ?? false,
    ...(options.cacheControlMaxAge !== undefined
      ? { cacheControlMaxAge: options.cacheControlMaxAge }
      : {}),
  });
  return result.url;
}

export async function deleteBlobFile(url: string): Promise<void> {
  if (!isBlobUrl(url)) return;
  await del(url);
}
