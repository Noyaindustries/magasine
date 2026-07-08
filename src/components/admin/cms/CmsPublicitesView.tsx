"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { X } from "lucide-react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons } from "@/components/admin/cms/CmsIcons";
import { cn } from "@/lib/utils";
import { readApiError, toastIfNotOk, toastNetworkError } from "@/lib/api-toast";
import { toast } from "@/lib/toast";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { useSiteBranding } from "@/components/SiteBranding";

interface AdZoneRow {
  _id: string;
  key: string;
  name: string;
  position: string;
  size: string;
  active: boolean;
  slot: string;
  imageUrl: string;
  linkUrl: string;
  impressions: string;
  ctr: string;
  revenue: string;
}

interface AdSummary {
  impressions: number;
  revenueFcfa: number;
  ctr: number;
  activeCount: number;
  totalCount: number;
}

const SLOT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Not displayed —" },
  { value: "home-below", label: "Home — banner below sections" },
  { value: "home-sidebar", label: "Home — side rectangle" },
  { value: "article-right", label: "Article — large image on the right" },
  { value: "article-below", label: "Article — banner below content" },
];

const SLOT_SIZES: Record<string, string> = {
  "home-below": "970 × 250 px",
  "home-sidebar": "300 × 250 px",
  "article-right": "300 × 600 px",
  "article-below": "970 × 250 px",
};

function slotLabel(slot: string) {
  return SLOT_OPTIONS.find((o) => o.value === slot)?.label ?? "— Not displayed —";
}

interface AdForm {
  name: string;
  slot: string;
  linkUrl: string;
  imageUrl: string;
}

const EMPTY_FORM: AdForm = { name: "", slot: "", linkUrl: "", imageUrl: "" };

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-US");
}

function fetchPublicites() {
  return fetch("/api/admin/publicites")
    .then(async (response) => {
      if (!response.ok) {
        toast.error(await readApiError(response, "Unable to load ad zones"));
        return { zones: [] as AdZoneRow[], summary: null as AdSummary | null };
      }
      return (await response.json()) as {
        zones?: AdZoneRow[];
        summary?: AdSummary | null;
      };
    })
    .catch(() => {
      toastNetworkError();
      return { zones: [] as AdZoneRow[], summary: null as AdSummary | null };
    });
}

export function CmsPublicitesView() {
  const { siteName } = useSiteBranding();
  const [zones, setZones] = useState<AdZoneRow[]>([]);
  const [summary, setSummary] = useState<AdSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editZoneId, setEditZoneId] = useState<string | null>(null);
  const [form, setForm] = useState<AdForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicites();
      setZones(data.zones ?? []);
      setSummary(data.summary ?? null);
    } catch {
      toastNetworkError();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicites()
      .then((data) => {
        if (!cancelled) {
          setZones(data.zones ?? []);
          setSummary(data.summary ?? null);
        }
      })
      .catch(() => {
        toastNetworkError();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openCreate = () => {
    setEditorMode("create");
    setEditZoneId(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (zone: AdZoneRow) => {
    setEditorMode("edit");
    setEditZoneId(zone._id);
    setForm({
      name: zone.name,
      slot: zone.slot ?? "",
      linkUrl: zone.linkUrl ?? "",
      imageUrl: zone.imageUrl ?? "",
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving || uploading) return;
    setEditorOpen(false);
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadAdminMedia(file, form.name || "Ad");
      setForm((prev) => ({ ...prev, imageUrl: url }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveEditor = async () => {
    if (!form.name.trim()) {
      toast.warning("A name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editorMode === "create") {
        const res = await fetch("/api/admin/publicites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slot: form.slot,
            position: slotLabel(form.slot),
            size: SLOT_SIZES[form.slot] ?? "—",
            imageUrl: form.imageUrl,
            linkUrl: form.linkUrl,
          }),
        });
        if (await toastIfNotOk(res, "Unable to create zone")) return;
        toast.success("Ad zone created");
      } else if (editZoneId) {
        const res = await fetch("/api/admin/publicites", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zoneId: editZoneId,
            name: form.name.trim(),
            slot: form.slot,
            position: slotLabel(form.slot),
            size: SLOT_SIZES[form.slot] ?? undefined,
            imageUrl: form.imageUrl,
            linkUrl: form.linkUrl,
          }),
        });
        if (await toastIfNotOk(res, "Unable to update zone")) return;
        toast.success("Ad zone updated");
      }
      setEditorOpen(false);
      await load();
    } catch {
      toastNetworkError();
    } finally {
      setSaving(false);
    }
  };

  const toggleZone = async (zone: AdZoneRow) => {
    try {
      const res = await fetch("/api/admin/publicites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: zone._id, active: !zone.active }),
      });
      if (await toastIfNotOk(res, "Unable to update zone")) return;
      toast.success(zone.active ? "Zone paused" : "Zone activated");
      load();
    } catch {
      toastNetworkError();
    }
  };

  const deleteZone = async (zone: AdZoneRow) => {
    if (!confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/publicites/${encodeURIComponent(zone._id)}`, {
        method: "DELETE",
      });
      if (await toastIfNotOk(res, "Unable to delete zone")) return;
      toast.success("Zone deleted");
      load();
    } catch {
      toastNetworkError();
    }
  };

  const exportReport = () => {
    if (!summary) {
      toast.warning("No data to export.");
      return;
    }
    const lines = [
      `Ad revenue report — ${siteName}`,
      `Impressions: ${summary.impressions}`,
      `Revenue: ${summary.revenueFcfa} FCFA`,
      `Average CTR: ${summary.ctr.toFixed(1)}%`,
      "",
      ...zones.map((z) => `${z.name} | ${z.active ? "Active" : "Pause"} | ${z.revenue}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ad-revenue-report.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  return (
    <CmsPage className="cms-ads-page">
      <div className="vhead">
        <div>
          <div className="vh1">Advertising</div>
          <div className="vh2">
            {summary?.activeCount ?? 0} active zones · Revenue this month:{" "}
            {summary ? `${formatCompact(summary.revenueFcfa)} FCFA` : "—"}
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-gold" onClick={exportReport}>
            Revenue report
          </button>
          <button type="button" className="btn btn-red" onClick={openCreate}>
            + New zone
          </button>
        </div>
      </div>

      <div className="kgrid mb20">
        <div className="kpi k-blue">
          <div className="klbl">Total impressions</div>
          <div className="kval">{summary ? formatCompact(summary.impressions) : "—"}</div>
        </div>
        <div className="kpi k-green">
          <div className="klbl">Revenue (FCFA)</div>
          <div className="kval">{summary ? formatCompact(summary.revenueFcfa) : "—"}</div>
        </div>
        <div className="kpi k-amber">
          <div className="klbl">Click-through rate (CTR)</div>
          <div className="kval">{summary ? `${summary.ctr.toFixed(1)}%` : "—"}</div>
        </div>
        <div className="kpi k-purple">
          <div className="klbl">Active zones</div>
          <div className="kval">
            {summary ? `${summary.activeCount} / ${summary.totalCount}` : "—"}
          </div>
        </div>
      </div>

      {loading && <p className="cms-empty">Loading zones…</p>}

      <div className="azgrid">
        {zones.map((zone) => (
          <div key={zone._id} className={cn("az", zone.active ? "active" : "paused")}>
            <div className="azhead">
              <span className={cn("badge", zone.active ? "b-pub" : "b-draft")}>
                {zone.active ? "Active" : "Paused"}
              </span>
              <div className="azhead-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-icon"
                  title="Edit zone"
                  onClick={() => openEdit(zone)}
                >
                  <CmsActionIcons.edit size={14} className="cms-icon" aria-hidden />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs btn-icon az-del-btn"
                  title="Delete zone"
                  onClick={() => void deleteZone(zone)}
                >
                  <CmsActionIcons.delete size={14} className="cms-icon cms-icon--error" aria-hidden />
                </button>
                <button
                  type="button"
                  className={cn("tog", zone.active && "on")}
                  onClick={() => void toggleZone(zone)}
                  aria-label={`Toggle ${zone.name}`}
                />
              </div>
            </div>
            {zone.imageUrl ? (
              <div className="azimg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={zone.imageUrl} alt={zone.name} loading="lazy" />
              </div>
            ) : (
              <div className="azprev">{zone.size || "No image"}</div>
            )}
            <div className="azname">{zone.name}</div>
            <div className="azpos">{slotLabel(zone.slot)}</div>
            <div className="azstats">
              <div className="azs">
                <div className="azsv">{zone.impressions}</div>
                <div className="azsl">Impressions</div>
              </div>
              <div className="azs">
                <div className="azsv">{zone.ctr}</div>
                <div className="azsl">CTR</div>
              </div>
              <div className="azs">
                <div className="azsv azsv--sm">{zone.revenue}</div>
                <div className="azsl">Revenue</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editorOpen && (
        <div className="cms-ad-modal-overlay" role="dialog" aria-modal="true" aria-label="Ad zone">
          <div className="cms-ad-modal">
            <div className="cms-ad-modal-head">
              <h3>{editorMode === "create" ? "New ad zone" : "Edit ad zone"}</h3>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-icon"
                onClick={closeEditor}
                aria-label="Close"
              >
                <X size={16} className="cms-icon" aria-hidden />
              </button>
            </div>

            <div className="cms-ad-field">
              <label className="lbl" htmlFor="ad-name">
                Name <span className="req">*</span>
              </label>
              <input
                id="ad-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Partner banner"
              />
            </div>

            <div className="cms-ad-field">
              <label className="lbl" htmlFor="ad-slot">
                Placement
              </label>
              <select
                id="ad-slot"
                className="input sel"
                value={form.slot}
                onChange={(e) => setForm((p) => ({ ...p, slot: e.target.value }))}
              >
                {SLOT_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                    {SLOT_SIZES[o.value] ? ` (${SLOT_SIZES[o.value]})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="cms-ad-field">
              <label className="lbl" htmlFor="ad-link">
                Click-through link (http/https)
              </label>
              <input
                id="ad-link"
                className="input"
                value={form.linkUrl}
                onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>

            <div className="cms-ad-field">
              <span className="lbl">Image</span>
              {form.imageUrl ? (
                <div className="cms-ad-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="Preview" />
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              <label className="btn btn-outline cms-ad-upload">
                {uploading ? "Uploading…" : form.imageUrl ? "Replace image" : "Upload image"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={uploading}
                  onChange={(e) => void handleUpload(e)}
                />
              </label>
            </div>

            <div className="cms-ad-modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeEditor} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-red"
                onClick={() => void saveEditor()}
                disabled={saving || uploading}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </CmsPage>
  );
}
