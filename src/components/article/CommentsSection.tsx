"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { readApiError, toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import { formatRelativeDate } from "@/lib/utils";

interface Comment {
  _id: string;
  content: string;
  user: { name: string; image?: string };
  createdAt: string;
  replies?: Comment[];
}

export function CommentsSection({
  articleId,
  variant = "default",
}: {
  articleId: string;
  variant?: "default" | "premium";
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      if (!res.ok) {
        toast.error(await readApiError(res, "Unable to load comments"));
        return;
      }
      const data = await res.json();
      setComments(data.comments ?? []);
      setLoaded(true);
    } catch {
      toastNetworkError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!session?.user) {
      toast.warning("Sign in to leave a comment.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, content }),
      });
      if (res.ok) {
        setContent("");
        toast.success("Comment submitted for review.", {
          description: "It will appear after approval by our editorial team.",
        });
      } else {
        toast.error(await readApiError(res, "Unable to publish comment"));
      }
    } catch {
      toastNetworkError();
    } finally {
      setLoading(false);
    }
  };

  const isPremium = variant === "premium";
  const rootClass = isPremium ? "art-comments" : "mt-12 pt-8 border-t border-border";
  const titleClass = isPremium
    ? undefined
    : "font-serif text-2xl font-bold text-charcoal mb-6";

  if (!loaded) {
    return (
      <div className={isPremium ? "art-comments" : undefined}>
        <button
          type="button"
          onClick={loadComments}
          className={isPremium ? "art-comments-load" : "text-sm text-accent hover:text-accent-hover font-medium"}
        >
          Show comments
        </button>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <h3 className={titleClass}>
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8">
        {!session?.user && (
          <p className="text-sm text-muted mb-3">
            <Link href="/login" className="text-accent hover:underline">Sign in</Link>
            {" "}to leave a comment.
          </p>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="w-full p-4 bg-muted-bg border border-border rounded-sm text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
        />
        <button
          type="submit"
          disabled={loading || !session?.user}
          className="mt-3 px-6 py-2.5 bg-charcoal text-white text-sm rounded-sm hover:bg-charcoal/90 transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit comment"}
        </button>
      </form>

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment._id} className="p-4 bg-surface border border-border rounded-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gold-light flex items-center justify-center text-xs font-bold text-gold-dark">
                {comment.user.name.charAt(0)}
              </div>
              <div>
                <span className="text-sm font-medium text-charcoal">{comment.user.name}</span>
                <span className="text-xs text-muted ml-2">
                  {formatRelativeDate(comment.createdAt)}
                </span>
              </div>
            </div>
            <p className="text-sm text-charcoal/80 leading-relaxed">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted text-center py-8">
            Be the first to comment on this article.
          </p>
        )}
      </div>
    </div>
  );
}
