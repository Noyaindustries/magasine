"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Flag, Heart, MessageCircle, Reply } from "lucide-react";
import { readApiError, toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import { RelativeTime } from "@/components/admin/cms/RelativeTime";

interface CommentUser {
  name: string;
  image?: string;
}

interface CommentItem {
  _id: string;
  content: string;
  user: CommentUser;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  parentId?: string | null;
  replies?: CommentItem[];
}

type SortMode = "newest" | "oldest" | "top";

const MAX_LENGTH = 2000;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

function Composer({
  value,
  onChange,
  onSubmit,
  loading,
  disabled,
  placeholder,
  submitLabel,
  autoFocus,
  onCancel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const remaining = MAX_LENGTH - value.length;
  return (
    <form
      className="art-comments-composer"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_LENGTH))}
        placeholder={placeholder}
        rows={3}
        disabled={disabled || loading}
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
      <div className="art-comments-composer-bar">
        <span
          className={`art-comments-counter${remaining < 80 ? " is-warn" : ""}`}
          aria-live="polite"
        >
          {remaining}
        </span>
        <div className="art-comments-composer-actions">
          {onCancel ? (
            <button type="button" className="art-comments-ghost" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            className="art-comments-submit"
            disabled={disabled || loading || !value.trim()}
          >
            {loading ? "Sending…" : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentCard({
  comment,
  depth,
  onReply,
  onLike,
  onReport,
  replyOpen,
  replyValue,
  onReplyChange,
  onReplySubmit,
  onReplyCancel,
  replyLoading,
  canInteract,
}: {
  comment: CommentItem;
  depth: number;
  onReply: (id: string) => void;
  onLike: (id: string) => void;
  onReport: (id: string) => void;
  replyOpen: boolean;
  replyValue: string;
  onReplyChange: (value: string) => void;
  onReplySubmit: () => void;
  onReplyCancel: () => void;
  replyLoading: boolean;
  canInteract: boolean;
}) {
  const name = comment.user?.name || "Reader";
  return (
    <article className={`art-comments-item${depth > 0 ? " is-reply" : ""}`}>
      <div className="art-comments-item-meta">
        <div className="art-comments-avatar" aria-hidden>
          {comment.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comment.user.image} alt="" />
          ) : (
            initials(name)
          )}
        </div>
        <div className="art-comments-item-who">
          <span className="art-comments-item-name">{name}</span>
          <span className="art-comments-item-time">
            <RelativeTime iso={comment.createdAt} />
          </span>
        </div>
      </div>
      <p className="art-comments-item-body">{comment.content}</p>
      <div className="art-comments-item-actions">
        <button
          type="button"
          className={`art-comments-action${comment.likedByMe ? " is-active" : ""}`}
          onClick={() => onLike(comment._id)}
          aria-pressed={comment.likedByMe}
        >
          <Heart size={14} aria-hidden fill={comment.likedByMe ? "currentColor" : "none"} />
          <span>{comment.likeCount > 0 ? comment.likeCount : "Like"}</span>
        </button>
        {depth === 0 ? (
          <button
            type="button"
            className="art-comments-action"
            onClick={() => onReply(comment._id)}
          >
            <Reply size={14} aria-hidden />
            <span>Reply</span>
          </button>
        ) : null}
        <button
          type="button"
          className="art-comments-action art-comments-action--muted"
          onClick={() => onReport(comment._id)}
        >
          <Flag size={14} aria-hidden />
          <span>Report</span>
        </button>
      </div>

      {replyOpen ? (
        <div className="art-comments-reply-box">
          {!canInteract ? (
            <p className="art-comments-signin-hint">
              <Link href="/login">Sign in</Link> to reply.
            </p>
          ) : (
            <Composer
              value={replyValue}
              onChange={onReplyChange}
              onSubmit={onReplySubmit}
              loading={replyLoading}
              disabled={!canInteract}
              placeholder={`Reply to ${name}…`}
              submitLabel="Post reply"
              autoFocus
              onCancel={onReplyCancel}
            />
          )}
        </div>
      ) : null}

      {comment.replies && comment.replies.length > 0 ? (
        <div className="art-comments-replies">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onLike={onLike}
              onReport={onReport}
              replyOpen={false}
              replyValue=""
              onReplyChange={() => undefined}
              onReplySubmit={() => undefined}
              onReplyCancel={() => undefined}
              replyLoading={false}
              canInteract={canInteract}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function CommentsSection({
  articleId,
  variant = "default",
}: {
  articleId: string;
  variant?: "default" | "premium";
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("newest");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const canInteract = Boolean(session?.user);
  const isPremium = variant === "premium";

  const loadComments = useCallback(async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/comments?articleId=${articleId}`);
      if (!res.ok) {
        setFetchError(await readApiError(res, "Unable to load comments"));
        return;
      }
      const data = (await res.json()) as {
        comments?: CommentItem[];
        total?: number;
      };
      setComments(data.comments ?? []);
      setTotal(data.total ?? data.comments?.length ?? 0);
    } catch {
      setFetchError("Network error. Please try again.");
    } finally {
      setFetching(false);
    }
  }, [articleId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const sortedComments = useMemo(() => {
    const copy = [...comments];
    if (sort === "oldest") {
      copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else if (sort === "top") {
      copy.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    } else {
      copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return copy;
  }, [comments, sort]);

  const postComment = async (text: string, parentId?: string) => {
    if (!text.trim()) return false;
    if (!session?.user) {
      toast.warning("Sign in to join the conversation.");
      return false;
    }
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, content: text, parentId }),
    });
    if (!res.ok) {
      toast.error(await readApiError(res, "Unable to publish comment"));
      return false;
    }
    toast.success("Thanks — your comment is awaiting moderation.", {
      description: "It will appear once our editors approve it.",
    });
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const ok = await postComment(content);
      if (ok) setContent("");
    } catch {
      toastNetworkError();
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyTo) return;
    setReplyLoading(true);
    try {
      const ok = await postComment(replyContent, replyTo);
      if (ok) {
        setReplyContent("");
        setReplyTo(null);
      }
    } catch {
      toastNetworkError();
    } finally {
      setReplyLoading(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!session?.user) {
      toast.warning("Sign in to like comments.");
      return;
    }
    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c._id === commentId) {
          const likedByMe = !c.likedByMe;
          return {
            ...c,
            likedByMe,
            likeCount: Math.max(0, c.likeCount + (likedByMe ? 1 : -1)),
          };
        }
        return {
          ...c,
          replies: c.replies?.map((r) =>
            r._id === commentId
              ? {
                  ...r,
                  likedByMe: !r.likedByMe,
                  likeCount: Math.max(0, r.likeCount + (r.likedByMe ? -1 : 1)),
                }
              : r
          ),
        };
      })
    );
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "like" }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res, "Could not update like"));
        await loadComments();
        return;
      }
      const data = (await res.json()) as { likeCount?: number; likedByMe?: boolean };
      setComments((prev) =>
        prev.map((c) => {
          if (c._id === commentId) {
            return {
              ...c,
              likeCount: data.likeCount ?? c.likeCount,
              likedByMe: data.likedByMe ?? c.likedByMe,
            };
          }
          return {
            ...c,
            replies: c.replies?.map((r) =>
              r._id === commentId
                ? {
                    ...r,
                    likeCount: data.likeCount ?? r.likeCount,
                    likedByMe: data.likedByMe ?? r.likedByMe,
                  }
                : r
            ),
          };
        })
      );
    } catch {
      toastNetworkError();
      await loadComments();
    }
  };

  const handleReport = async (commentId: string) => {
    if (!session?.user) {
      toast.warning("Sign in to report a comment.");
      return;
    }
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "report" }),
      });
      if (!res.ok) {
        toast.error(await readApiError(res, "Could not report comment"));
        return;
      }
      toast.success("Thanks — our editors will review this comment.");
    } catch {
      toastNetworkError();
    }
  };

  const rootClass = isPremium ? "art-comments" : "art-comments art-comments--plain";

  return (
    <section className={rootClass} aria-labelledby="art-comments-heading">
      <header className="art-comments-head">
        <div>
          <p className="art-comments-kicker">
            <MessageCircle size={14} aria-hidden />
            Reader conversation
          </p>
          <h3 id="art-comments-heading">
            Comments
            <span className="art-comments-count">{total}</span>
          </h3>
          <p className="art-comments-lead">
            Share your perspective. Thoughtful replies help our newsroom understand what matters
            to you.
          </p>
        </div>
        <div className="art-comments-sort" role="group" aria-label="Sort comments">
          {(
            [
              ["newest", "Newest"],
              ["oldest", "Oldest"],
              ["top", "Top"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={sort === value ? "is-active" : undefined}
              onClick={() => setSort(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="art-comments-compose-card">
        {sessionStatus === "loading" ? (
          <p className="art-comments-signin-hint">Checking your session…</p>
        ) : canInteract ? (
          <>
            <div className="art-comments-compose-identity">
              <div className="art-comments-avatar" aria-hidden>
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" />
                ) : (
                  initials(session?.user?.name || "You")
                )}
              </div>
              <div>
                <strong>{session?.user?.name || "Reader"}</strong>
                <span>Join the discussion</span>
              </div>
            </div>
            <Composer
              value={content}
              onChange={setContent}
              onSubmit={() => void handleSubmit()}
              loading={loading}
              disabled={!canInteract}
              placeholder="What did this story make you think?"
              submitLabel="Post comment"
            />
          </>
        ) : (
          <div className="art-comments-gate">
            <p>
              Comments are open.{" "}
              <Link href="/login">Sign in</Link> or <Link href="/register">create an account</Link>{" "}
              to share your view with other readers.
            </p>
            <Link href="/login" className="art-comments-submit art-comments-submit--link">
              Sign in to comment
            </Link>
          </div>
        )}
      </div>

      {fetching ? (
        <div className="art-comments-loading" role="status">
          Loading comments…
        </div>
      ) : fetchError ? (
        <div className="art-comments-error" role="alert">
          <p>{fetchError}</p>
          <button type="button" className="art-comments-ghost" onClick={() => void loadComments()}>
            Try again
          </button>
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="art-comments-empty">
          <MessageCircle size={22} aria-hidden />
          <p>No public comments yet. Be the first to start the conversation.</p>
        </div>
      ) : (
        <div className="art-comments-list">
          {sortedComments.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              depth={0}
              onReply={(id) => {
                setReplyTo((current) => (current === id ? null : id));
                setReplyContent("");
              }}
              onLike={(id) => void handleLike(id)}
              onReport={(id) => void handleReport(id)}
              replyOpen={replyTo === comment._id}
              replyValue={replyContent}
              onReplyChange={setReplyContent}
              onReplySubmit={() => void handleReplySubmit()}
              onReplyCancel={() => {
                setReplyTo(null);
                setReplyContent("");
              }}
              replyLoading={replyLoading}
              canInteract={canInteract}
            />
          ))}
        </div>
      )}
    </section>
  );
}
