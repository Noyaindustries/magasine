"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { authorAvatarGradient, authorInitials, formatRelativeFr } from "@/components/admin/cms/cms-ui";
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
        toast.error("Action impossible sur ce commentaire");
        return;
      }
      const labels: Record<string, string> = {
        approve: "Commentaire approuvé",
        reject: "Commentaire rejeté",
        delete: "Commentaire supprimé",
        ignore_report: "Signalement ignoré",
        ban_user: "Utilisateur banni",
        reply: "Réponse publiée",
      };
      toast.success(labels[action] ?? "Action effectuée");
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
    { id: "all", label: "Tous", count: comments.length },
    { id: "pending", label: "En attente", count: pending.length },
    { id: "flagged", label: "Signalés", count: flagged.length },
    { id: "approved", label: "Approuvés", count: approved.length },
    { id: "rejected", label: "Rejetés", count: rejected.length },
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
    if (!confirm("Rejeter tous les commentaires en attente ?")) return;
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
          <div className="vh1">Commentaires</div>
          <div className="vh2">
            {comments.length} commentaires · {flagged.length} signalés · {pending.length} en attente
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" disabled={busy || pending.length === 0} onClick={() => void bulkApprove()}>
            Tout approuver
          </button>
          <button type="button" className="btn btn-ghost cms-delete-btn" disabled={busy || pending.length === 0} onClick={() => void bulkReject()}>
            Tout rejeter
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

      {loading && <p className="cms-empty">Chargement des commentaires…</p>}

      {!loading && filtered.length === 0 && (
        <p className="cms-empty">Aucun commentaire dans cette vue.</p>
      )}

      {filtered.map((c) => (
        <div key={c._id} className={`ccard${c.isReported ? " flagged" : ""}`}>
          <div className="cchead">
            <div className="av cc-av" style={{ background: authorAvatarGradient(c.user?.name ?? "?") }}>
              {authorInitials(c.user?.name ?? "?")}
            </div>
            <div>
              <div className="ccname">
                {c.user?.name ?? "Anonyme"}
                {c.isReported && <span className="cc-flag"> ⚑ Signalé comme spam</span>}
              </div>
              <div className="ccinfo">
                {c.user?.email ?? "—"} · {formatRelativeFr(c.createdAt)}
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
                Approuver
              </button>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy}
              onClick={() => {
                const reply = window.prompt("Votre réponse (publiée au nom de l'équipe) :");
                if (reply?.trim()) void moderate(c._id, "reply", reply.trim());
              }}
            >
              Répondre
            </button>
            {c.isReported ? (
              <>
                <button type="button" className="btn btn-ghost btn-sm cms-delete-btn" disabled={busy} onClick={() => void moderate(c._id, "delete")}>
                  Supprimer
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => void moderate(c._id, "ignore_report")}>
                  Ignorer le signalement
                </button>
                <button type="button" className="btn btn-ghost btn-sm cms-delete-btn" disabled={busy} onClick={() => void moderate(c._id, "ban_user")}>
                  Bannir l&apos;utilisateur
                </button>
              </>
            ) : !c.isRejected ? (
              <button type="button" className="btn btn-ghost btn-sm cms-delete-btn" disabled={busy} onClick={() => void moderate(c._id, "reject")}>
                Rejeter
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </CmsPage>
  );
}
