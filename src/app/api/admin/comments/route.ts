import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Comment } from "@/models/Comment";
import { User } from "@/models/User";
import { canManageArticles } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canManageArticles(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectDB();
    const comments = await Comment.find()
      .populate("user", "name email")
      .populate("article", "title slug")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      comments: comments.map((c) => {
        const user = c.user as unknown as { name: string; email: string };
        const article = c.article as unknown as { title: string; slug: string };
        return {
          _id: String(c._id),
          content: c.content,
          isApproved: c.isApproved,
          isReported: c.isReported,
          isRejected: c.isRejected ?? false,
          createdAt: c.createdAt.toISOString(),
          user: { name: user?.name, email: user?.email },
          article: { title: article?.title, slug: article?.slug },
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canManageArticles(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { commentId, action, replyContent } = await request.json();
    const allowed = [
      "approve",
      "reject",
      "delete",
      "ignore_report",
      "ban_user",
      "reply",
    ];
    if (!commentId || !allowed.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (action === "delete") {
      await Comment.findByIdAndDelete(commentId);
      return NextResponse.json({ success: true });
    }

    if (action === "approve") {
      comment.isApproved = true;
      comment.isRejected = false;
      comment.isReported = false;
      await comment.save();
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      comment.isApproved = false;
      comment.isRejected = true;
      await comment.save();
      return NextResponse.json({ success: true });
    }

    if (action === "ignore_report") {
      comment.isReported = false;
      await comment.save();
      return NextResponse.json({ success: true });
    }

    if (action === "ban_user") {
      await User.findByIdAndUpdate(comment.user, { isBanned: true });
      comment.isRejected = true;
      comment.isApproved = false;
      await comment.save();
      return NextResponse.json({ success: true });
    }

    if (action === "reply") {
      if (!replyContent?.trim()) {
        return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
      }
      await Comment.create({
        article: comment.article,
        user: session.user.id,
        parent: comment._id,
        content: replyContent.trim(),
        isApproved: true,
        isReported: false,
        isRejected: false,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
