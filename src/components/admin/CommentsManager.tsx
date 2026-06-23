"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { formatRelativeDate } from "@/lib/utils";

interface CommentRow {
  _id: string;
  content: string;
  isApproved: boolean;
  isReported: boolean;
  createdAt: string;
  user: { name: string; email: string };
  article: { title: string; slug: string };
}

type Filter = "all" | "pending" | "approved";

export function CommentsManager() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((data) => setComments(data.comments ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (commentId: string, action: "approve" | "reject" | "delete") => {
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, action }),
    });
    load();
  };

  const filtered = comments.filter((c) => {
    if (filter === "pending") return !c.isApproved;
    if (filter === "approved") return c.isApproved;
    return true;
  });

  const pendingCount = comments.filter((c) => !c.isApproved).length;

  return (
    <AdminSectionShell
      eyebrow="Community"
      title={
        <>
          Comment <em>moderation</em>
        </>
      }
      description="Approve, hide, or remove reader comments before they appear on published articles."
      pulse="gold"
      stats={[
        { value: comments.length, label: "Total" },
        { value: pendingCount, label: "Pending" },
      ]}
    >
      <div className="adm-toolbar">
        <div className="adm-toolbar-filters">
          {(
            [
              ["all", "All"],
              ["pending", "Pending"],
              ["approved", "Approved"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`adm-filter-pill${filter === value ? " adm-filter-pill--active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="adm-loading">Loading comments…</p>
      ) : filtered.length === 0 ? (
        <p className="adm-empty">No comments in this view.</p>
      ) : (
        <div className="adm-comment-list">
          {filtered.map((c) => (
            <div
              key={c._id}
              className={`adm-comment-card${c.isApproved ? "" : " adm-comment-card--pending"}`}
            >
              <div className="adm-comment-head">
                <div>
                  <p className="adm-comment-author">{c.user?.name}</p>
                  <p className="adm-comment-email">{c.user?.email}</p>
                </div>
                <span className="adm-comment-time">{formatRelativeDate(c.createdAt)}</span>
              </div>
              <p className="adm-comment-body">{c.content}</p>
              {c.isReported && <p className="adm-comment-flag">Reported by readers</p>}
              {c.article?.slug && (
                <Link href={`/article/${c.article.slug}`} className="adm-comment-article" target="_blank">
                  On: {c.article.title}
                </Link>
              )}
              <div className="adm-comment-actions">
                {!c.isApproved && (
                  <button
                    type="button"
                    onClick={() => moderate(c._id, "approve")}
                    className="adm-btn adm-btn--secondary adm-btn--sm"
                  >
                    Approve
                  </button>
                )}
                {c.isApproved && (
                  <button
                    type="button"
                    onClick={() => moderate(c._id, "reject")}
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                  >
                    Hide
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => moderate(c._id, "delete")}
                  className="adm-btn adm-btn--danger adm-btn--sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminSectionShell>
  );
}
