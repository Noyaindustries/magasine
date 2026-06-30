"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { BrandingUploadField } from "@/components/admin/BrandingUploadField";
import { DEFAULT_FAVICON, DEFAULT_SITE_LOGO } from "@/lib/branding";
import { toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";

interface SettingsData {
  siteName: string;
  tagline: string;
  contactEmail: string;
  siteLogo: string;
  favicon: string;
  breakingAlertEnabled: boolean;
  commentsEnabled: boolean;
  newsletterEnabled: boolean;
  maintenanceMode: boolean;
  updatedAt?: string;
}

interface SettingsAdminProps {
  siteUrl: string;
  feedUrl: string;
  isSuperAdmin: boolean;
}

export function SettingsAdmin({ siteUrl, feedUrl, isSuperAdmin }: SettingsAdminProps) {
  const [form, setForm] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (!r.ok) {
          toast.error("Unable to load settings.");
          return;
        }
        setForm(await r.json());
      })
      .catch(() => toastNetworkError())
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch?: Partial<SettingsData>) => {
    if (!form) return;
    const payload = { ...form, ...patch };
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(data);
        toast.success("Settings saved");
      } else {
        toast.error("Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = async (type: "siteLogo" | "favicon", url: string) => {
    if (!form) return;
    const next = { ...form, [type]: url };
    setForm(next);
    await save({ [type]: url });
  };

  const enabledFeatures = form
    ? [form.breakingAlertEnabled, form.commentsEnabled, form.newsletterEnabled].filter(Boolean).length
    : 0;

  return (
    <AdminSectionShell
      eyebrow="Configuration"
      title={
        <>
          Site <em>settings</em>
        </>
      }
      description="Global site configuration, feature flags, and operational shortcuts for the editorial suite."
      pulse="green"
      stats={
        form
          ? [
              { value: enabledFeatures, label: "Features on" },
              { value: form.maintenanceMode ? "On" : "Off", label: "Maintenance" },
            ]
          : undefined
      }
    >
      {loading || !form ? (
        <p className="adm-loading">Loading settings…</p>
      ) : (
        <>
          <div className="adm-settings-grid">
            <div className="adm-form-panel admin-form-grid">
              <h2>General</h2>
              <div className="admin-field">
                <label>Site name</label>
                <input value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Tagline</label>
                <textarea rows={2} value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </div>
              <div className="admin-field">
                <label>Contact email</label>
                <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
              </div>
              <div>
                <p className="adm-entity-meta" style={{ marginBottom: 10 }}>
                  Feature flags
                </p>
                <div className="adm-toggle-grid">
                  {(
                    [
                      ["breakingAlertEnabled", "Breaking news ticker"],
                      ["commentsEnabled", "Reader comments"],
                      ["newsletterEnabled", "Newsletter sign-ups"],
                      ["maintenanceMode", "Maintenance mode"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="adm-toggle-item">
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <button type="button" className="adm-btn adm-btn--primary" disabled={saving} onClick={() => save()}>
                  {saving ? "Saving…" : "Save settings"}
                </button>
              </div>
            </div>

            <div className="adm-form-panel">
              <h2>Environment</h2>
              <dl className="adm-env-list">
                <div className="adm-env-row">
                  <dt>Public URL</dt>
                  <dd>{siteUrl}</dd>
                </div>
                <div className="adm-env-row">
                  <dt>RSS feed</dt>
                  <dd>
                    <Link href={feedUrl} className="text-accent hover:underline">
                      {feedUrl}
                    </Link>
                  </dd>
                </div>
                {form.updatedAt && (
                  <div className="adm-env-row">
                    <dt>Last updated</dt>
                    <dd>{new Date(form.updatedAt).toLocaleString("en-US")}</dd>
                  </div>
                )}
              </dl>
              <nav className="adm-link-list" aria-label="Quick links">
                <Link href="/admin/homepage">Homepage editor →</Link>
                <Link href="/feed.xml">Check RSS feed →</Link>
                <Link href="/sitemap.xml">XML sitemap →</Link>
                {isSuperAdmin && <Link href="/api/seed?force=true">Re-run data seed (super admin) →</Link>}
              </nav>
            </div>
          </div>

          <div className="adm-form-panel adm-branding-panel admin-form-grid">
            <h2>Branding</h2>
            <p className="adm-entity-meta">
              Site header logo and browser tab icon. Files are stored locally in{" "}
              <code>public/uploads/branding/</code>.
            </p>
            <div className="adm-branding-grid">
              <BrandingUploadField
                type="siteLogo"
                label="Site logo"
                hint="PNG, JPG, WebP or SVG — max 2 MB. Shown in the header and footer."
                currentUrl={form.siteLogo}
                defaultUrl={DEFAULT_SITE_LOGO}
                onUploaded={(url) => void updateBranding("siteLogo", url)}
              />
              <BrandingUploadField
                type="favicon"
                label="Tab icon (favicon)"
                hint="ICO, PNG or SVG — max 512 KB. Shown in the browser tab."
                currentUrl={form.favicon}
                defaultUrl={DEFAULT_FAVICON}
                onUploaded={(url) => void updateBranding("favicon", url)}
              />
            </div>
          </div>
        </>
      )}
    </AdminSectionShell>
  );
}
