"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { categorySlugFromName, normalizeCategorySlug } from "@/lib/category-admin";
import { isRetiredCategorySlug } from "@/lib/retired-categories";
import { toast } from "@/lib/toast";

interface CategoryRow {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  order: number;
  isActive: boolean;
}

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  color: string;
  order: number;
  isActive: boolean;
};

const emptyForm = (): CategoryForm => ({
  name: "",
  slug: "",
  description: "",
  color: "#1A3896",
  order: 0,
  isActive: true,
});

function fetchCategories() {
  return fetch("/api/admin/categories")
    .then((r) => r.json())
    .then((data) => (data.categories ?? []) as CategoryRow[]);
}

function CategoryModal({
  open,
  editing,
  form,
  loading,
  slugTouched,
  onClose,
  onChange,
  onSlugChange,
  onSave,
}: {
  open: boolean;
  editing: CategoryRow | null;
  form: CategoryForm;
  loading: boolean;
  slugTouched: boolean;
  onClose: () => void;
  onChange: (patch: Partial<CategoryForm>) => void;
  onSlugChange: (slug: string) => void;
  onSave: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  const previewSlug =
    form.slug.trim() ||
    (form.name.trim() ? normalizeCategorySlug(form.name) : "");

  return createPortal(
    <div className="admin-modal-backdrop cms-category-modal" onClick={onClose} role="presentation">
      <div
        className="admin-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="cms-category-modal-title"
      >
        <div className="admin-modal-header">
          <h2 id="cms-category-modal-title">
            {editing ? "Edit category" : "Create category"}
          </h2>
        </div>
        <div className="admin-modal-body admin-form-grid">
          <div className="admin-field">
            <label htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                onChange({ name });
                if (!editing && !slugTouched && name.trim()) {
                  onSlugChange(normalizeCategorySlug(name));
                }
              }}
              required
              autoFocus
            />
          </div>
          <div className="admin-field">
            <label htmlFor="cat-slug">Slug URL</label>
            <input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => onSlugChange(e.target.value)}
              placeholder="Auto-generated if empty"
            />
            {previewSlug && (
              <p className="text-xs text-[var(--t3)] mt-1">/category/{previewSlug}</p>
            )}
          </div>
          <div className="admin-field">
            <label htmlFor="cat-desc">Description</label>
            <textarea
              id="cat-desc"
              rows={2}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="cat-color">Color</label>
            <input
              id="cat-color"
              type="color"
              value={form.color}
              onChange={(e) => onChange({ color: e.target.value })}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="cat-order">Display order</label>
            <input
              id="cat-order"
              type="number"
              value={form.order}
              onChange={(e) => onChange({ order: Number(e.target.value) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => onChange({ isActive: e.target.checked })}
            />
            Active category
          </label>
        </div>
        <div className="admin-modal-footer">
          <button type="button" className="btn btn-out" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={loading || !form.name.trim()}
            onClick={onSave}
          >
            {loading ? "Saving…" : editing ? "Save" : "Create category"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CmsCategoriesView({ initial }: { initial: CategoryRow[] }) {
  const [categories, setCategories] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    void fetchCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (initial.length === 0) reload();
  }, [initial.length, reload]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setSlugTouched(false);
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      color: cat.color,
      order: cat.order,
      isActive: cat.isActive,
    });
    setSlugTouched(true);
    setModalOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Name is required.");
      return;
    }

    const slug = categorySlugFromName(name, form.slug);
    if (!slug) {
      toast.error("Unable to generate a valid slug for this category.");
      return;
    }

    setSaving(true);
    try {
      const url = editing ? `/api/admin/categories/${editing._id}` : "/api/admin/categories";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description: form.description,
          color: form.color,
          order: form.order,
          isActive: form.isActive,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Failed to save");
        return;
      }
      toast.success(editing ? "Category updated" : "Category created");
      setModalOpen(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!globalThis.confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "Delete failed");
      return;
    }
    toast.success("Category deleted");
    reload();
  };

  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">Categories</div>
          <div className="vh2">
            {categories.length} section{categories.length === 1 ? "" : "s"} · {activeCount} active
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-red cms-btn-icon" onClick={openCreate}>
            <Plus className="w-4 h-4" aria-hidden />
            Create category
          </button>
        </div>
      </div>

      {loading && categories.length === 0 ? (
        <p className="text-sm text-[var(--t3)]">Loading…</p>
      ) : categories.length === 0 ? (
        <div className="cms-empty-panel">
          <p>No categories yet.</p>
          <button type="button" className="btn btn-red" onClick={openCreate}>
            Create the first category
          </button>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl tbl-compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full shrink-0"
                        style={{ background: cat.color }}
                        aria-hidden
                      />
                      <span className="font-semibold text-[var(--t1)]">{cat.name}</span>
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="text-[var(--blue)] hover:underline"
                      target="_blank"
                    >
                      /{cat.slug}
                    </Link>
                  </td>
                  <td>{cat.order}</td>
                  <td>
                    <span className={cat.isActive ? "cms-pill cms-pill--green" : "cms-pill"}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                    {isRetiredCategorySlug(cat.slug) && (
                      <span className="cms-pill cms-pill--amber ml-1">Hidden</span>
                    )}
                  </td>
                  <td>
                    <div className="tbl-actions">
                      <button
                        type="button"
                        className="btn btn-out btn-sm"
                        onClick={() => openEdit(cat)}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn btn-out btn-sm"
                        onClick={() => void remove(cat._id)}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        editing={editing}
        form={form}
        loading={saving}
        slugTouched={slugTouched}
        onClose={() => setModalOpen(false)}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onSlugChange={(slug) => {
          setSlugTouched(true);
          setForm((prev) => ({ ...prev, slug }));
        }}
        onSave={() => void save()}
      />
    </CmsPage>
  );
}
