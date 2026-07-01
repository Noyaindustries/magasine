import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Comment } from "@/models/Comment";
import { Article } from "@/models/Article";
import { auth } from "@/lib/auth";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  articleId: z.string(),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }

  try {
    const settings = await getPublicSiteSettings();
    if (!settings.commentsEnabled) {
      return NextResponse.json({ comments: [] });
    }

    await connectDB();
    const comments = await Comment.find({
      article: articleId,
      isApproved: true,
      isRejected: false,
      parent: null,
    })
      .populate("user", "name image")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      comments: comments.map((c) => {
        const user = c.user as unknown as { name: string; image?: string };
        return {
          _id: String(c._id),
          content: c.content,
          user: { name: user.name, image: user.image },
          createdAt: c.createdAt.toISOString(),
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { prefix: "comments", max: 30, windowMs: 3600_000 });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const settings = await getPublicSiteSettings();
    if (!settings.commentsEnabled) {
      return NextResponse.json({ error: "Comments are currently disabled" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectDB();
    const article = await Article.findById(parsed.data.articleId);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const comment = await Comment.create({
      article: parsed.data.articleId,
      user: session.user.id,
      content: parsed.data.content.replace(/<[^>]*>/g, "").trim(),
      parent: parsed.data.parentId,
      isApproved: false,
      isRejected: false,
    });

    return NextResponse.json(
      { _id: String(comment._id), pendingApproval: true },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
