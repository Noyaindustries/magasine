"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";

interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  order: number;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  description: "",
  color: "#1A3896",
  order: 0,
  isActive: true,
};

export function CategoriesManager({ initial }: { initial: CategoryRow[] }) {
  const [categories, setCategories] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories ?? []));
  }, []);

  useEffect(() => {
    if (initial.length === 0) reload();
  }, [initial.length, reload]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description,
      color: cat.color,
      order: cat.order,
      isActive: cat.isActive,
    });
    setError("");
    setModalOpen(true);
  };

  const save = async () => {
    setLoading(true);
    setError("");
    try {
      const url = editing ? `/api/admin/categories/${editing._id}` : "/api/admin/categories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setModalOpen(false);
      reload();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!globalThis.confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Delete failed");
      return;
    }
    reload();
  };

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <AdminSectionShell
      eyebrow="Editorial structure"
      title={
        <>
          Categories & <em>sections</em>
        </>
      }
      description="Manage editorial rubrics, navigation labels, and accent colors across the public site."
      pulse="green"
      stats={[
        { value: categories.length, label: "Total" },
        { value: activeCount, label: "Active" },
      ]}
      actions={
        <button type="button" className="adm-btn adm-btn--primary" onClick={openCreate}>
          <Plus className="w-4 h-4" aria-hidden />
          Add category
        </button>
      }
    >
      {categories.length === 0 ? (
        <p className="adm-empty">No categories yet. Create your first editorial section.</p>
      ) : (
        <div className="adm-card-grid">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="adm-entity-card"
              style={{ "--adm-accent": cat.color } as CSSProperties}
            >
              <div className="adm-entity-head">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="adm-color-swatch" style={{ background: cat.color }} aria-hidden />
                  <div className="min-w-0">
                    <h3 className="adm-entity-title">{cat.name}</h3>
                    <p className="adm-entity-meta">/{cat.slug} · Order {cat.order}</p>
                  </div>
                </div>
                <span className={`adm-status ${cat.isActive ? "adm-status--active" : "adm-status--inactive"}`}>
                  {cat.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {cat.description && <p className="adm-entity-desc line-clamp-2">{cat.description}</p>}
              <div className="adm-entity-actions">
                <Link href={`/category/${cat.slug}`} className="adm-btn adm-btn--ghost adm-btn--sm" target="_blank">
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden />
                  View
                </Link>
                <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEdit(cat)}>
                  <Pencil className="w-3.5 h-3.5" aria-hidden />
                  Edit
                </button>
                <button type="button" className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => remove(cat._id)}>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="admin-modal-header">
              <h2>{editing ? "Edit category" : "New category"}</h2>
            </div>
            <div className="admin-modal-body admin-form-grid">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="admin-field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="admin-field">
                <label>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Color</label>
                <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Order</label>
                <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="adm-btn adm-btn--primary" disabled={loading || !form.name} onClick={save}>
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminSectionShell>
  );
}
