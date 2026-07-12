"use client";

import { useEffect, useRef, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsBrandingUploadField } from "@/components/admin/cms/CmsBrandingUploadField";
import { CmsStatusIcon, ImageIcon } from "@/components/admin/cms/CmsIcons";
import { computeSeoScore } from "@/lib/cms-seo-score";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { DEFAULT_FAVICON, DEFAULT_SITE_LOGO } from "@/lib/branding";
import { toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import { getTypographyPreset, type TypographyPresetId } from "@/lib/site-fonts";
import { CmsTypographyPicker } from "@/components/admin/cms/CmsTypographyPicker";
import { getSiteUrl, SITE_NAME } from "@/lib/site";

interface SeoSettingsForm {
  siteName: string;
  tagline: string;
  contactEmail: string;
  siteLogo: string;
  favicon: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterEmailHeaderTitle: string;
  newsletterDefaultSubject: string;
  mailchimpConnected: boolean;
  brevoConnected: boolean;
  typographyPreset: TypographyPresetId;
}

interface CmsSeoSettingsViewProps {
  canManageBranding?: boolean;
}

export function CmsSeoSettingsView({ canManageBranding = false }: CmsSeoSettingsViewProps) {
  const [form, setForm] = useState<SeoSettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (!r.ok) {
          toast.error("Unable to load SEO settings.");
          return;
        }
        const data = await r.json();
        setForm({
          siteName: data.siteName ?? SITE_NAME,
          tagline: data.tagline ?? "",
          contactEmail: data.contactEmail ?? "",
          siteLogo: data.siteLogo ?? DEFAULT_SITE_LOGO,
          favicon: data.favicon ?? DEFAULT_FAVICON,
          seoTitle: data.seoTitle ?? data.siteName ?? "",
          seoDescription: data.seoDescription ?? data.tagline ?? "",
          ogImage: data.ogImage ?? "",
          canonicalUrl: data.canonicalUrl ?? getSiteUrl(),
          newsletterTitle: data.newsletterTitle ?? "",
          newsletterDescription: data.newsletterDescription ?? "",
          newsletterEmailHeaderTitle: data.newsletterEmailHeaderTitle ?? "",
          newsletterDefaultSubject:
            data.newsletterDefaultSubject ?? "Today's essentials — {siteName}",
          mailchimpConnected: data.mailchimpConnected ?? false,
          brevoConnected: data.brevoConnected ?? false,
          typographyPreset: getTypographyPreset(data.typographyPreset).id,
        });
      })
      .catch(() => toastNetworkError());
  }, []);

  const seo = form
    ? computeSeoScore({
        title: form.siteName,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        content: form.tagline,
        featuredImage: form.ogImage || "/logo.png",
      })
    : { score: 0, checks: [] };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("SEO settings saved.");
      else toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const uploadOg = async (file: File) => {
    try {
      const { url } = await uploadAdminMedia(file, "Image Open Graph");
      setForm((prev) => (prev ? { ...prev, ogImage: url } : prev));
      toast.success("Image saved locally.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const updateBranding = (type: "siteLogo" | "favicon", url: string) => {
    setForm((prev) => (prev ? { ...prev, [type]: url } : prev));
  };

  if (!form) {
    return (
      <CmsPage>
        <p className="cms-empty">Loading SEO settings…</p>
      </CmsPage>
    );
  }

  return (
    <CmsPage>
      <div className="vhead">
        <div>
          <div className="vh1">SEO settings</div>
          <div className="vh2">Global SEO, site metadata, and social tags</div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-red" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save →"}
          </button>
        </div>
      </div>

      <div className="g21 ga">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Identity &amp; SEO</span>
            <div className={`seo-orb ${seo.score >= 70 ? "orb-ok" : "orb-warn"}`}>{seo.score}</div>
          </div>
          <div className="card-body cms-seo-body">
            <div className="field">
              <label className="lbl" htmlFor="seo-site-name">
                Site name
              </label>
              <input
                id="seo-site-name"
                className="input lg"
                value={form.siteName}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="seo-title">
                Global SEO title
              </label>
              <input
                id="seo-title"
                className="input"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="seo-desc">
                Meta description
              </label>
              <textarea
                id="seo-desc"
                className="input"
                rows={3}
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="seo-tagline">
                Tagline / institutional lede
              </label>
              <textarea
                id="seo-tagline"
                className="input"
                rows={2}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </div>
            <div className="seochips">
              {seo.checks.map((check) => (
                <span
                  key={check.id}
                  className={`seoc seo-${check.level === "ok" ? "ok" : check.level === "warn" ? "w" : "e"}`}
                >
                  <CmsStatusIcon
                    level={check.level === "ok" ? "ok" : check.level === "warn" ? "warn" : "error"}
                  />{" "}
                  {check.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="cms-editor-side">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Logo &amp; favicon</span>
            </div>
            <div className="card-body cms-stack">
              <p className="cms-field-hint">
                Files stored locally in <code>public/uploads/branding/</code>.
                {!canManageBranding && " Administrators only."}
              </p>
              <CmsBrandingUploadField
                type="siteLogo"
                label="Site logo (homepage)"
                hint="PNG, JPG, WebP or SVG — max 2 MB. Header and footer."
                currentUrl={form.siteLogo}
                canEdit={canManageBranding}
                onUploaded={(url) => updateBranding("siteLogo", url)}
              />
              <CmsBrandingUploadField
                type="favicon"
                label="Tab icon (favicon)"
                hint="ICO, PNG or SVG — max 512 KB. Browser tab."
                currentUrl={form.favicon}
                canEdit={canManageBranding}
                onUploaded={(url) => updateBranding("favicon", url)}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Site typography</span>
            </div>
            <div className="card-body cms-stack">
              <p className="cms-field-hint">
                Choose the editorial and UI font pairing for the public site. Changes apply
                after save and a page refresh.
                {!canManageBranding && " Administrators only."}
              </p>
              <CmsTypographyPicker
                value={form.typographyPreset}
                onChange={(typographyPreset) => setForm({ ...form, typographyPreset })}
                disabled={!canManageBranding || saving}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Newsletter &amp; contact</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl" htmlFor="seo-email">
                  Contact email
                </label>
                <input
                  id="seo-email"
                  className="input"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="seo-nl-title">
                  Newsletter block title
                </label>
                <input
                  id="seo-nl-title"
                  className="input"
                  value={form.newsletterTitle}
                  onChange={(e) => setForm({ ...form, newsletterTitle: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="seo-nl-desc">
                  Newsletter description
                </label>
                <textarea
                  id="seo-nl-desc"
                  className="input"
                  rows={3}
                  value={form.newsletterDescription}
                  onChange={(e) => setForm({ ...form, newsletterDescription: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="seo-nl-email-header">
                  Email header title
                </label>
                <input
                  id="seo-nl-email-header"
                  className="input"
                  value={form.newsletterEmailHeaderTitle}
                  onChange={(e) =>
                    setForm({ ...form, newsletterEmailHeaderTitle: e.target.value })
                  }
                  placeholder={form.siteName || "Site name"}
                />
                <p className="cms-field-hint">
                  Title below the logo in emails. Leave empty to use the site name. The logo is the one
                  set in « Logo &amp; favicon ».
                </p>
              </div>
              <div className="field">
                <label className="lbl" htmlFor="seo-nl-default-subject">
                  Default email subject
                </label>
                <input
                  id="seo-nl-default-subject"
                  className="input"
                  value={form.newsletterDefaultSubject}
                  onChange={(e) =>
                    setForm({ ...form, newsletterDefaultSubject: e.target.value })
                  }
                  placeholder="Today's essentials — {siteName}"
                />
                <p className="cms-field-hint">
                  Pre-filled subject when composing a campaign. Use <code>{"{siteName}"}</code> to
                  insert the site name.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Open Graph &amp; Twitter</span>
            </div>
            <div className="card-body cms-stack">
              <div className="field">
                <label className="lbl">Default social image</label>
                <button
                  type="button"
                  className="cms-cover-drop cms-cover-drop--sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {form.ogImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.ogImage} alt="" className="cms-cover-preview" />
                  ) : (
                    <>
                      <div className="cms-cover-icon">
                        <ImageIcon size={32} aria-hidden />
                      </div>
                      <div>1200 × 630 px recommended — local storage</div>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="cms-hidden-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadOg(file);
                  }}
                />
              </div>
              <div className="field">
                <label className="lbl" htmlFor="seo-canonical">
                  Canonical URL
                </label>
                <input
                  id="seo-canonical"
                  className="input"
                  value={form.canonicalUrl}
                  onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CmsPage>
  );
}
