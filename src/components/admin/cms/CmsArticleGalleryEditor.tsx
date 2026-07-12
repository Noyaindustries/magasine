"use client";

import { useRef, useState } from "react";
import { ImageIcon, Trash2 } from "@/components/admin/cms/CmsIcons";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";

export interface GalleryFormItem {
  url: string;
  caption: string;
  credit: string;
}

interface CmsArticleGalleryEditorProps {
  items: GalleryFormItem[];
  onChange: (items: GalleryFormItem[]) => void;
  uploadTitle?: string;
  onInsertIntoBody?: (item: GalleryFormItem) => void;
}

export function CmsArticleGalleryEditor({
  items,
  onChange,
  uploadTitle,
  onInsertIntoBody,
}: CmsArticleGalleryEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const patchItem = (index: number, patch: Partial<GalleryFormItem>) => {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const copy = [...items];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadAdminMedia(file, uploadTitle || file.name);
      onChange([...items, { url, caption: "", credit: "" }]);
      toast.success("Image added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="cms-gallery-editor">
      {items.map((item, index) => (
        <div key={`${item.url}-${index}`} className="cms-gallery-item">
          <div className="cms-gallery-item-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" />
          </div>
          <div className="cms-gallery-item-fields">
            <input
              className="input"
              type="text"
              value={item.caption}
              onChange={(e) => patchItem(index, { caption: e.target.value })}
              placeholder="Caption"
            />
            <input
              className="input"
              type="text"
              value={item.credit}
              onChange={(e) => patchItem(index, { credit: e.target.value })}
              placeholder="Credit / source"
            />
            <p className="cms-branding-path">
              <code>{item.url}</code>
            </p>
            {onInsertIntoBody && (
              <button
                type="button"
                className="btn btn-ghost btn-xs cms-gallery-insert-body"
                onClick={() => onInsertIntoBody(item)}
                title="Insérer dans le corps de l'article à la position du curseur"
              >
                Insérer dans le corps
              </button>
            )}
          </div>
          <div className="cms-gallery-item-actions">
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              disabled={index === 0}
              onClick={() => moveItem(index, -1)}
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              disabled={index === items.length - 1}
              onClick={() => moveItem(index, 1)}
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs cms-delete-btn"
              onClick={() => removeItem(index)}
              aria-label="Remove image"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        </div>
      ))}

      <label className="cms-cover-drop cms-cover-drop--sm">
        <div className="cms-cover-icon">
          <ImageIcon size={24} aria-hidden />
        </div>
        <div>{uploading ? "Uploading…" : "Add image"}</div>
        <div className="cms-cover-hint">JPG · PNG · WebP — max 15 MB</div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="cms-cover-input"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadImage(file);
          }}
        />
      </label>
    </div>
  );
}
