"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_FAVICON,
  DEFAULT_SITE_LOGO,
  type BrandingAssetType,
} from "@/lib/branding";
import { uploadBrandingAsset } from "@/lib/admin-upload";
import { ImageIcon } from "@/components/admin/cms/CmsIcons";
import { toast } from "@/lib/toast";

interface CmsBrandingUploadFieldProps {
  type: BrandingAssetType;
  label: string;
  hint: string;
  currentUrl: string;
  canEdit?: boolean;
  onUploaded: (url: string) => void;
}

export function CmsBrandingUploadField({
  type,
  label,
  hint,
  currentUrl,
  canEdit = true,
  onUploaded,
}: CmsBrandingUploadFieldProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const defaultUrl = type === "siteLogo" ? DEFAULT_SITE_LOGO : DEFAULT_FAVICON;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadBrandingAsset(file, type);
      onUploaded(url);
      router.refresh();
      toast.success("Image saved on server.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="cms-branding-field">
      <div className="field">
        <label className="lbl">{label}</label>
        <p className="cms-field-hint">{hint}</p>
      </div>

      <button
        type="button"
        className="cms-cover-drop cms-cover-drop--sm cms-branding-drop"
        disabled={!canEdit || uploading}
        onClick={() => canEdit && inputRef.current?.click()}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt=""
            className={`cms-cover-preview ${type === "favicon" ? "cms-branding-favicon" : ""}`}
          />
        ) : (
          <>
            <div className="cms-cover-icon">
              <ImageIcon size={32} aria-hidden />
            </div>
            <div>{uploading ? "Uploading…" : "Click to upload"}</div>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
        className="cms-hidden-input"
        disabled={!canEdit || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />

      <p className="cms-branding-path">
        <code>{currentUrl}</code>
      </p>

      {canEdit && (
        <div className="cms-branding-actions">
          <button
            type="button"
            className="btn btn-out btn-sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Choose file"}
          </button>
          <a href={currentUrl} download className="btn btn-ghost btn-sm">
            Download
          </a>
          {currentUrl !== defaultUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={uploading}
              onClick={() => {
                onUploaded(defaultUrl);
                router.refresh();
              }}
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
