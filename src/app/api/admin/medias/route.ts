import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Media } from "@/models/Media";
import {
  MEDIA_MAX_BYTES,
  MEDIA_MIME_TYPES,
  mediaKindFromMime,
  saveMediaFileToDisk,
} from "@/lib/media-storage";

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi("articles");
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const kind = searchParams.get("kind");
  const sort = searchParams.get("sort") ?? "recent";

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (kind && kind !== "all") filter.kind = kind;
  if (q) filter.title = { $regex: q, $options: "i" };

  const sortSpec: Record<string, 1 | -1> =
    sort === "oldest" ? { createdAt: 1 } : sort === "largest" ? { sizeBytes: -1 } : { createdAt: -1 };

  const [items, totalCount, totalBytes] = await Promise.all([
    Media.find(filter).sort(sortSpec).limit(64).lean(),
    Media.countDocuments(filter),
    Media.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$sizeBytes" } } }]),
  ]);

  const usedBytes = totalBytes[0]?.total ?? 0;
  const quotaBytes = 20 * 1024 * 1024 * 1024;

  const breakdown = await Media.aggregate<{ _id: string; total: number }>([
    { $group: { _id: "$kind", total: { $sum: "$sizeBytes" } } },
  ]);

  return NextResponse.json({
    items: items.map((m) => ({
      _id: String(m._id),
      title: m.title,
      url: m.url,
      kind: m.kind,
      mimeType: m.mimeType,
      sizeBytes: m.sizeBytes,
      createdAt: m.createdAt.toISOString(),
    })),
    stats: {
      totalCount,
      usedBytes,
      quotaBytes,
      breakdown: breakdown.map((row) => ({
        kind: row._id,
        bytes: row.total,
      })),
    },
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("articles");
  if (guard.error) return guard.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const titleRaw = formData.get("title");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!(MEDIA_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "Unsupported format." }, { status: 400 });
  }

  if (file.size > MEDIA_MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 15 MB)." }, { status: 400 });
  }

  try {
    const url = await saveMediaFileToDisk(file);
    await connectDB();
    const doc = await Media.create({
      title: typeof titleRaw === "string" && titleRaw.trim() ? titleRaw.trim() : file.name,
      url,
      mimeType: file.type,
      kind: mediaKindFromMime(file.type),
      sizeBytes: file.size,
      uploadedBy: guard.session!.user.id,
    });

    return NextResponse.json({
      _id: String(doc._id),
      title: doc.title,
      url: doc.url,
      kind: doc.kind,
      sizeBytes: doc.sizeBytes,
    });
  } catch {
    return NextResponse.json({ error: "Could not save file on server." }, { status: 500 });
  }
}
