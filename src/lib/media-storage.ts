import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { deleteBlobFile, isBlobStorageEnabled, isBlobUrl, uploadBlobFile } from "@/lib/blob-storage";

export const MEDIA_UPLOAD_DIR = "public/uploads/media";

export const MEDIA_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "application/pdf",
] as const;

export const MEDIA_MAX_BYTES = 15 * 1024 * 1024;

export type MediaFileKind = "image" | "video" | "podcast" | "document";

export function mediaKindFromMime(mime: string): MediaFileKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "podcast";
  return "document";
}

export function extensionFromMediaMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    case "video/mp4":
      return ".mp4";
    case "audio/mpeg":
    case "audio/mp3":
      return ".mp3";
    case "application/pdf":
      return ".pdf";
    default:
      return ".bin";
  }
}

function uniqueMediaFilename(mime: string): string {
  const ext = extensionFromMediaMime(mime);
  return `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
}

async function saveMediaFileToDiskInternal(file: File): Promise<string> {
  const filename = uniqueMediaFilename(file.type);
  const dir = path.join(process.cwd(), MEDIA_UPLOAD_DIR);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/media/${filename}`;
}

async function saveMediaFileToBlobInternal(file: File): Promise<string> {
  const filename = uniqueMediaFilename(file.type);
  return uploadBlobFile(`media/${filename}`, file, file.type);
}

export async function saveMediaFile(file: File): Promise<string> {
  if (process.env.NODE_ENV === "production" && !isBlobStorageEnabled()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required for media uploads in production. Add it in your hosting environment variables."
    );
  }
  if (isBlobStorageEnabled()) {
    return saveMediaFileToBlobInternal(file);
  }
  return saveMediaFileToDiskInternal(file);
}

/** @deprecated Use `saveMediaFile` */
export const saveMediaFileToDisk = saveMediaFile;

async function deleteMediaFileFromDiskInternal(url: string): Promise<void> {
  if (!url.startsWith("/uploads/media/")) return;

  const filename = path.basename(url);
  if (!filename || filename.includes("..")) return;

  const filePath = path.join(process.cwd(), MEDIA_UPLOAD_DIR, filename);
  try {
    await unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export async function deleteMediaFile(url: string): Promise<void> {
  if (isBlobUrl(url)) {
    await deleteBlobFile(url);
    return;
  }
  await deleteMediaFileFromDiskInternal(url);
}

/** @deprecated Use `deleteMediaFile` */
export const deleteMediaFileFromDisk = deleteMediaFile;
