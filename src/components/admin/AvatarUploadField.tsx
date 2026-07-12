"use client";

import { useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";

interface AvatarUploadFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  hint?: string;
}

export function AvatarUploadField({
  label = "Photo",
  value,
  onChange,
  disabled,
  hint = "JPG, PNG or WebP — square preferred.",
}: AvatarUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadAdminMedia(file);
      onChange(url);
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="avatar-upload">
        <span className="avatar-upload-preview" aria-hidden>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="avatar-upload-img" />
          ) : (
            <ImageIcon size={22} />
          )}
        </span>
        <div className="avatar-upload-actions">
          <button
            type="button"
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            <Upload className="w-3.5 h-3.5" aria-hidden />
            {uploading ? "Uploading…" : value ? "Change" : "Upload photo"}
          </button>
          {value && (
            <button
              type="button"
              className="adm-btn adm-btn--ghost adm-btn--sm"
              onClick={() => onChange("")}
              disabled={disabled || uploading}
            >
              <X className="w-3.5 h-3.5" aria-hidden />
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="avatar-upload-input"
          aria-label="Upload photo"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
      <input
        className="avatar-upload-url"
        type="text"
        value={value}
        placeholder="…or paste an image URL"
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || uploading}
        aria-label={`${label} URL`}
      />
      {hint && <p className="cms-field-hint">{hint}</p>}
    </div>
  );
}
