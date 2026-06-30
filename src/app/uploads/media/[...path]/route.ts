import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  blobUrlForLocalMedia,
  fallbackImageForLocalMedia,
} from "@/lib/media-url";
import { MEDIA_UPLOAD_DIR } from "@/lib/media-storage";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
};

function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

async function serveFromDisk(filename: string): Promise<NextResponse | null> {
  const filePath = path.join(process.cwd(), MEDIA_UPLOAD_DIR, filename);
  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeFromFilename(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const filename = segments?.join("/") ?? "";
  if (!filename || filename.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const localPath = `/uploads/media/${filename}`;
  const blobUrl = blobUrlForLocalMedia(localPath);
  if (blobUrl) {
    return NextResponse.redirect(blobUrl, 307);
  }

  const fromDisk = await serveFromDisk(filename);
  if (fromDisk) {
    return fromDisk;
  }

  const fallback = fallbackImageForLocalMedia(localPath);
  return NextResponse.redirect(fallback, 307);
}
