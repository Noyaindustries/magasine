import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { blobUrlForLocalMedia, fallbackImageForLocalMedia } from "@/lib/media-url";
import { BRANDING_UPLOAD_DIR } from "@/lib/branding";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const filename = segments?.join("/") ?? "";
  if (!filename || filename.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const localPath = `/uploads/branding/${filename}`;
  const blobUrl = blobUrlForLocalMedia(localPath);
  if (blobUrl) {
    return NextResponse.redirect(blobUrl, 307);
  }

  const filePath = path.join(process.cwd(), BRANDING_UPLOAD_DIR, filename);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.redirect(fallbackImageForLocalMedia(localPath), 307);
  }
}
