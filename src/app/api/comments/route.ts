import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Comment } from "@/models/Comment";
import { Article } from "@/models/Article";
// Side-effect : enregistre le modèle User pour populate("user").
import "@/models/User";
import { auth } from "@/lib/auth";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  articleId: z.string().min(1),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

const actionSchema = z.object({
  commentId: z.string().min(1),
  action: z.enum(["like", "report"]),
});

type LeanUser = { name?: string; image?: string } | null;

function mapComment(
  c: {
    _id: unknown;
    content: string;
    user?: unknown;
    authorName?: string;
    authorImage?: string;
    likes?: unknown[];
    createdAt?: Date | string;
    parent?: unknown;
  },
  viewerId?: string
) {
  const populated = c.user as LeanUser;
  const name =
    (typeof populated === "object" && populated?.name?.trim()) ||
    c.authorName?.trim() ||
    "Reader";
  const image =
    (typeof populated === "object" && populated?.image) || c.authorImage || undefined;
  const likeIds = (c.likes ?? []).map((id) => String(id));
  return {
    _id: String(c._id),
    content: c.content,
    user: { name, image },
    likeCount: likeIds.length,
    likedByMe: viewerId ? likeIds.includes(viewerId) : false,
    createdAt:
      c.createdAt instanceof Date
        ? c.createdAt.toISOString()
        : new Date(c.createdAt ?? Date.now()).toISOString(),
    parentId: c.parent ? String(c.parent) : null,
  };
}

export async function GET(request: NextRequest) {
  const articleId = request.nextUrl.searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json({ error: "articleId required" }, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return NextResponse.json({ error: "Invalid articleId" }, { status: 400 });
  }

  try {
    const settings = await getPublicSiteSettings();
    if (!settings.commentsEnabled) {
      return NextResponse.json({ comments: [], total: 0 });
    }

    const session = await auth();
    const viewerId = session?.user?.id;

    await connectDB();
    const rows = await Comment.find({
      article: articleId,
      isApproved: true,
      isRejected: false,
    })
      .populate("user", "name image")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = rows.map((c) => mapComment(c, viewerId));
    const roots = mapped.filter((c) => !c.parentId);
    const repliesByParent = new Map<string, typeof mapped>();
    for (const c of mapped) {
      if (!c.parentId) continue;
      const list = repliesByParent.get(c.parentId) ?? [];
      list.push(c);
      repliesByParent.set(c.parentId, list);
    }

    const comments = roots.map((root) => ({
      ...root,
      replies: (repliesByParent.get(root._id) ?? []).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      ),
    }));

    return NextResponse.json({
      comments,
      total: mapped.length,
    });
  } catch (error) {
    console.error("[GET /api/comments]", error);
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

    if (!mongoose.Types.ObjectId.isValid(parsed.data.articleId)) {
      return NextResponse.json({ error: "Invalid articleId" }, { status: 400 });
    }
    if (parsed.data.parentId && !mongoose.Types.ObjectId.isValid(parsed.data.parentId)) {
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
    }

    await connectDB();
    const article = await Article.findById(parsed.data.articleId).select("_id commentsDisabled").lean();
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (article.commentsDisabled) {
      return NextResponse.json({ error: "Comments are closed on this article" }, { status: 403 });
    }

    if (parsed.data.parentId) {
      const parent = await Comment.findOne({
        _id: parsed.data.parentId,
        article: parsed.data.articleId,
        isApproved: true,
        isRejected: false,
      }).select("_id").lean();
      if (!parent) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    const content = parsed.data.content.replace(/<[^>]*>/g, "").trim();
    if (!content) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const comment = await Comment.create({
      article: parsed.data.articleId,
      user: session.user.id,
      content,
      parent: parsed.data.parentId || undefined,
      authorName: session.user.name?.trim() || "Reader",
      authorImage: session.user.image || undefined,
      likes: [],
      isApproved: false,
      isRejected: false,
    });

    return NextResponse.json(
      { _id: String(comment._id), pendingApproval: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/comments]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const limited = enforceRateLimit(request, {
    prefix: "comments-action",
    max: 60,
    windowMs: 3600_000,
  });
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(parsed.data.commentId)) {
      return NextResponse.json({ error: "Invalid commentId" }, { status: 400 });
    }

    await connectDB();
    const comment = await Comment.findById(parsed.data.commentId);
    if (!comment || !comment.isApproved || comment.isRejected) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);

    if (parsed.data.action === "report") {
      comment.isReported = true;
      await comment.save();
      return NextResponse.json({ success: true, reported: true });
    }

    // like toggle
    const likes = comment.likes ?? [];
    const idx = likes.findIndex((id) => String(id) === String(userId));
    if (idx >= 0) {
      likes.splice(idx, 1);
    } else {
      likes.push(userId);
    }
    comment.likes = likes;
    await comment.save();

    return NextResponse.json({
      success: true,
      likeCount: likes.length,
      likedByMe: idx < 0,
    });
  } catch (error) {
    console.error("[PATCH /api/comments]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
