import { del, put } from "@vercel/blob";

const BLOB_HOST_PATTERN = /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//;

export function isBlobStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function isBlobUrl(url: string): boolean {
  return BLOB_HOST_PATTERN.test(url);
}

export async function uploadBlobFile(
  pathname: string,
  file: File,
  contentType: string
): Promise<string> {
  const result = await put(pathname, file, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return result.url;
}

export async function deleteBlobFile(url: string): Promise<void> {
  if (!isBlobUrl(url)) return;
  await del(url);
}
