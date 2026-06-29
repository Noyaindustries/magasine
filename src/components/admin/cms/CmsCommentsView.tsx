"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { authorAvatarGradient, authorInitials, formatRelativeEn } from "@/components/admin/cms/cms-ui";
import { toast } from "@/lib/toast";

interface CommentRow {
  _id: string;
  content: string;
  isApproved: boolean;
  isReported: boolean;
  isRejected: boolean;
  createdAt: string;
  user: { name: string; email: string };
  article: { title: string; slug: string };
}

type Filter = "all" | "pending" | "flagged" | "approved" | "rejected";

function fetchAdminComments() {
  return fetch("/api/admin/comments")
    .then((r) => r.json())
    .then((data) => (data.comments ?? []) as CommentRow[]);
}

export function CmsCommentsView() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    void fetchAdminComments()
      .then(setComments)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminComments()
      .then((rows) => {
        if (!cancelled) setComments(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const moderate = async (
    commentId: string,
    action: "approve" | "reject" | "delete" | "ignore_report" | "ban_user" | "reply",
    replyContent?: string
  ) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action, replyContent }),
      });
      if (!res.ok) {
        toast.error("Could not perform this action on the comment");
        return;
      }
      const labels: Record<string, string> = {
        approve: "Comment approved",
        reject: "Comment rejected",
        delete: "Comment deleted",
        ignore_report: "Report ignored",
        ban_user: "User banned",
        reply: "Reply published",
      };
      toast.success(labels[action] ?? "Action completed");
      load();
    } finally {
      setBusy(false);
    }
  };

  const pending = comments.filter((c) => !c.isApproved && !c.isRejected);
  const flagged = comments.filter((c) => c.isReported && !c.isApproved);
  const approved = comments.filter((c) => c.isApproved);
  const rejected = comments.filter((c) => c.isRejected);

  const filtered = comments.filter((c) => {
    if (filter === "pending") return !c.isApproved && !c.isRejected;
    if (filter === "flagged") return c.isReported && !c.isApproved;
    if (filter === "approved") return c.isApproved;
    if (filter === "rejected") return c.isRejected;
    return true;
  });

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: comments.length },
    { id: "pending", label: "Pending", count: pending.length },
    { id: "flagged", label: "Flagged", count: flagged.length },
    { id: "approved", label: "Approved", count: approved.length },
    { id: "rejected", label: "Rejected", count: rejected.length },
  ];

  const bulkApprove = async () => {
    setBusy(true);
    try {
      await Promise.all(pending.map((c) => moderate(c._id, "approve")));
      load();
    } finally {
      setBusy(false);
    }
  };

  const bulkReject = async () => {
    if (!confirm("Reject all pending comments?")) return;
    setBusy(true);
    try {
      await Promise.all(pending.map((c) => moderate(c._id, "reject")));
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <CmsPage className="cms-comments-page">
      <div className="vhead">
        <div>
          <div className="vh1">Comments</div>
          <div className="vh2">
            {comments.length} comments · {flagged.length} flagged · {pending.length} pending
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" disabled={busy || pending.length === 0} onClick={() => void bulkApprove()}>
            Approve all
          </button>
          <button type="button" className="btn btn-ghost cms-delete-btn" disabled={busy || pending.length === 0} onClick={() => void bulkReject()}>
            Reject all
          </button>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={filter === tab.id ? "tab on" : "tab"}
            onClick={() => setFilter(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading && <p className="cms-empty">Loading comments…</p>}

      {!loading && filtered.length === 0 && (
        <p className="cms-empty">No comments in this view.</p>
      )}

      {filtered.map((c) => (
        <div key={c._id} className={`ccard${c.isReported ? " flagged" : ""}`}>
          <div className="cchead">
            <div className="av cc-av" style={{ background: authorAvatarGradient(c.user?.name ?? "?") }}>
              {authorInitials(c.user?.name ?? "?")}
            </div>
            <div>
              <div className="ccname">
                {c.user?.name ?? "Anonymous"}
                {c.isReported && <span className="cc-flag"> ⚑ Flagged as spam</span>}
              </div>
              <div className="ccinfo">
                {c.user?.email ?? "—"} · {formatRelativeEn(c.createdAt)}
              </div>
            </div>
            {c.article?.slug && (
              <Link href={`/article/${c.article.slug}`} className="ccarticle" target="_blank">
                {c.article.title} →
              </Link>
            )}
          </div>
          <div className={`ccbody${c.isReported ? " ccbody--flagged" : ""}`}>{c.content}</div>
          <div className="ccacts">
            {!c.isApproved && !c.isRejected && (
              <button type="button" className="btn btn-red btn-sm" disabled={busy} onClick={() => void moderate(c._id, "approve")}>
                Approve
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => {
                const reply = window.prompt("Your reply (published on behalf of the team):");
                if (reply?.trim()) void moderate(c._id, "reply", reply.trim());
              }}
            >
              Reply
            </button>
            {c.isReported ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm cms-delete-btn" disabled={busy} onClick={() => void moderate(c._id, "delete")}>
                  Delete
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void moderate(c._id, "ignore_report")}>
                  Ignore report
                </button>
                <button type="button" className="btn btn-ghost btn-sm cms-delete-btn" disabled={busy} onClick={() => void moderate(c._id, "ban_user")}>
                  Ban user
                </button>
              </>
            ) : !c.isRejected ? (
              <button type="button" className="btn btn-ghost btn-sm cms-delete-btn" disabled={busy} onClick={() => void moderate(c._id, "reject")}>
                Reject
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </CmsPage>
  );
}
