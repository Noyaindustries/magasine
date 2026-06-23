"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { BrandingAssetType } from "@/lib/branding";

interface BrandingUploadFieldProps {
  type: BrandingAssetType;
  label: string;
  hint: string;
  currentUrl: string;
  defaultUrl: string;
  onUploaded: (url: string) => void;
}

export function BrandingUploadField({
  type,
  label,
  hint,
  currentUrl,
  defaultUrl,
  onUploaded,
}: BrandingUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("type", type);

      const res = await fetch("/api/admin/branding/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { error?: string; url?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Upload failed.");
        return;
      }

      onUploaded(data.url);
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="adm-branding-field">
      <div className="adm-branding-field-head">
        <label>{label}</label>
        <p className="adm-entity-meta">{hint}</p>
      </div>

      <div className="adm-branding-preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={currentUrl} alt="" className="adm-branding-preview-img" />
      </div>

      <p className="adm-branding-path">
        <code>{currentUrl}</code>
      </p>

      <div className="adm-branding-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
          className="adm-branding-file"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          className="adm-btn adm-btn--secondary"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Upload from computer"}
        </button>
        <a href={currentUrl} download className="adm-btn adm-btn--ghost">
          Download
        </a>
        {currentUrl !== defaultUrl && (
          <button
            type="button"
            className="adm-btn adm-btn--ghost"
            disabled={uploading}
            onClick={() => onUploaded(defaultUrl)}
          >
            Reset to default
          </button>
        )}
      </div>

      {error && (
        <p className="adm-toast adm-toast--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
