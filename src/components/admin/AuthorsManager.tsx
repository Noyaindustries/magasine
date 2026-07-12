"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { AvatarUploadField } from "@/components/admin/AvatarUploadField";
import { authorInitials } from "@/lib/format-article";
import { toast } from "@/lib/toast";

interface AuthorRow {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  email: string;
  avatar: string;
  twitter: string;
  linkedin: string;
  articleCount: number;
}

const emptyForm = {
  name: "",
  bio: "",
  email: "",
  avatar: "",
  twitter: "",
  linkedin: "",
};

export function AuthorsManager({ initial }: { initial: AuthorRow[] }) {
  const [authors, setAuthors] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuthorRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const reload = useCallback(() => {
    fetch("/api/admin/authors")
      .then((r) => r.json())
      .then((data) => setAuthors(data.authors ?? []));
  }, []);

  useEffect(() => {
    if (initial.length === 0) reload();
  }, [initial.length, reload]);

  const syncAccounts = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/authors/backfill", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Sync failed");
        return;
      }
      const created = data.created ?? 0;
      const linked = data.linked ?? 0;
      toast.success(
        created || linked
          ? `${created} profile(s) created, ${linked} link(s) added`
          : "All editorial accounts already have an author profile"
      );
      reload();
    } finally {
      setSyncing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (author: AuthorRow) => {
    setEditing(author);
    setForm({
      name: author.name,
      bio: author.bio,
      email: author.email,
      avatar: author.avatar,
      twitter: author.twitter,
      linkedin: author.linkedin,
    });
    setModalOpen(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      const url = editing ? `/api/admin/authors/${editing._id}` : "/api/admin/authors";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      toast.success(editing ? "Author updated" : "Author created");
      setModalOpen(false);
      reload();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (author: AuthorRow) => {
    const articleHint =
      author.articleCount > 0
        ? `\n\n${author.articleCount} linked article(s). Deletion will fail if an article has only this author.`
        : "";

    if (!globalThis.confirm(`Delete ${author.name}? This action cannot be undone.${articleHint}`)) {
      return;
    }

    const res = await fetch(`/api/admin/authors/${author._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Delete failed");
      return;
    }
    const data = await res.json();
    if (data.detachedFromArticles > 0) {
      toast.success(`Author deleted (${data.detachedFromArticles} article(s) updated)`);
    } else {
      toast.success("Author deleted");
    }
    reload();
  };

  return (
    <AdminSectionShell
      eyebrow="Editorial team"
      title={
        <>
          Authors & <em>bylines</em>
        </>
      }
      description="Manage contributor profiles, bios, and public author pages linked from every article."
      pulse="blue"
      stats={[
        { value: authors.length, label: "Profiles" },
        {
          value: authors.reduce((sum, a) => sum + (a.articleCount ?? 0), 0),
          label: "Articles",
        },
      ]}
      actions={
        <>
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            onClick={syncAccounts}
            disabled={syncing}
            title="Create missing author profiles for editorial accounts"
          >
            <RefreshCw className="w-4 h-4" aria-hidden />
            {syncing ? "Syncing…" : "Sync accounts"}
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={openCreate}>
            <Plus className="w-4 h-4" aria-hidden />
            Add author
          </button>
        </>
      }
    >
      {authors.length === 0 ? (
        <p className="adm-empty">No authors yet. Add your first editorial byline.</p>
      ) : (
        <div className="adm-author-grid">
          {authors.map((author) => (
            <div key={author._id} className="adm-author-card">
              <div className="adm-author-top">
                {author.avatar ? (
                  <Image
                    src={author.avatar}
                    alt=""
                    width={52}
                    height={52}
                    className="adm-author-avatar"
                  />
                ) : (
                  <span className="adm-author-avatar adm-author-avatar--fallback" aria-hidden>
                    {authorInitials(author.name)}
                  </span>
                )}
                <div className="adm-author-info">
                  <h3 className="adm-entity-title">{author.name}</h3>
                  <p className="adm-entity-meta">/{author.slug}</p>
                  {author.email && (
                    <p className="adm-entity-meta adm-entity-meta--plain">{author.email}</p>
                  )}
                  <p className="adm-entity-meta">
                    {author.articleCount} {author.articleCount === 1 ? "article" : "articles"}
                  </p>
                </div>
              </div>
              {author.bio && <p className="adm-entity-desc line-clamp-3">{author.bio}</p>}
              <div className="adm-entity-actions">
                <button
                  type="button"
                  className="adm-btn adm-btn--ghost adm-btn--sm"
                  onClick={() => openEdit(author)}
                >
                  <Pencil className="adm-btn-icon" aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--danger adm-btn--sm"
                  onClick={() => remove(author)}
                >
                  <Trash2 className="adm-btn-icon" aria-hidden />
                  Delete
                </button>
                <Link
                  href={`/author/${author.slug}`}
                  className="adm-btn adm-btn--ghost adm-btn--sm"
                  target="_blank"
                >
                  <ExternalLink className="adm-btn-icon" aria-hidden />
                  View page
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="admin-modal-header">
              <h2>{editing ? "Edit author" : "New author"}</h2>
            </div>
            <div className="admin-modal-body admin-form-grid">
              <div className="admin-field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="admin-field">
                <label>Bio</label>
                <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <AvatarUploadField
                label="Photo"
                value={form.avatar}
                onChange={(url) => setForm({ ...form, avatar: url })}
              />
              <div className="admin-field">
                <label>Twitter</label>
                <input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>LinkedIn</label>
                <input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
              </div>
            </div>
            <div className="admin-modal-footer adm-modal-footer--split">
              {editing ? (
                <button
                  type="button"
                  className="adm-btn adm-btn--danger adm-btn--sm"
                  disabled={loading}
                  onClick={() => void remove(editing)}
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="adm-modal-footer-actions">
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="adm-btn adm-btn--primary"
                  disabled={loading || !form.name}
                  onClick={save}
                >
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminSectionShell>
  );
}
