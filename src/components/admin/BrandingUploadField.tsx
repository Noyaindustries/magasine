"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BrandingAssetType } from "@/lib/branding";
import { uploadBrandingAsset } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";

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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadBrandingAsset(file, type);
      onUploaded(url);
      router.refresh();
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
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
    </div>
  );
}
