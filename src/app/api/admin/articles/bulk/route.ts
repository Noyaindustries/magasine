import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { connectDB } from "@/lib/mongodb";
import { Article } from "@/models/Article";
import { notifySubscribersOnMultimediaPublish } from "@/lib/newsletter-auto-publish";
import { revalidateContentListings, revalidateSiteLayout } from "@/lib/revalidate-public";

const schema = z.object({
  action: z.enum(["publish", "archive", "restore", "delete"]),
  articleIds: z.array(z.string()).min(1),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("articles");
  if (guard.error) return guard.error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  await connectDB();
  const { action, articleIds } = parsed.data;

  if (action === "delete") {
    await Article.deleteMany({ _id: { $in: articleIds } });
    revalidateContentListings();
    revalidateSiteLayout();
    return NextResponse.json({ success: true, count: articleIds.length });
  }

  const patch: Record<string, unknown> = {};
  if (action === "publish") {
    patch.status = "published";
    patch.publishedAt = new Date();
  } else if (action === "archive") {
    patch.status = "archived";
  } else if (action === "restore") {
    patch.status = "draft";
  }

  const result = await Article.updateMany({ _id: { $in: articleIds } }, { $set: patch });

  if (action === "publish") {
    const published = await Article.find({
      _id: { $in: articleIds },
      status: "published",
    })
      .select("_id")
      .lean();

    for (const article of published) {
      void notifySubscribersOnMultimediaPublish(String(article._id)).catch((error) => {
        console.error("[newsletter] auto publish failed", error);
      });
    }
  }

  revalidateContentListings();
  revalidateSiteLayout();
  return NextResponse.json({ success: true, count: result.modifiedCount });
}
