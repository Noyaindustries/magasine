"use client";

import { useCallback, useEffect, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons } from "@/components/admin/cms/CmsIcons";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useSiteBranding } from "@/components/SiteBranding";

interface AdZoneRow {
  _id: string;
  key: string;
  name: string;
  position: string;
  size: string;
  active: boolean;
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

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return n.toLocaleString("en-US");
}

function fetchPublicites() {
  return fetch("/api/admin/publicites").then(async (response) => {
    if (!response.ok) {
      console.error("Ads:", response.status, await response.text());
      return { zones: [] as AdZoneRow[], summary: null as AdSummary | null };
    }
    return (await response.json()) as {
      zones?: AdZoneRow[];
      summary?: AdSummary | null;
    };
  });
}

export function CmsPublicitesView() {
  const { siteName } = useSiteBranding();
  const [zones, setZones] = useState<AdZoneRow[]>([]);
  const [summary, setSummary] = useState<AdSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicites();
      setZones(data.zones ?? []);
      setSummary(data.summary ?? null);
    } catch (error) {
      console.error("Ads:", error);
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
      .catch((error) => {
        console.error("Ads:", error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleZone = async (zone: AdZoneRow) => {
    await fetch("/api/admin/publicites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zoneId: zone._id, active: !zone.active }),
    });
    load();
  };

  const addZone = async () => {
    const name = window.prompt("Ad zone name");
    if (!name?.trim()) return;
    const position = window.prompt("Placement on site") ?? "Article page";
    const size = window.prompt("Dimensions (e.g. 300 × 250 px)") ?? "300 × 250 px";
    await fetch("/api/admin/publicites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), position, size }),
    });
    load();
  };

  const deleteZone = async (zone: AdZoneRow) => {
    if (!confirm(`Delete zone "${zone.name}"?`)) return;
    const res = await fetch(`/api/admin/publicites/${encodeURIComponent(zone._id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Delete failed.");
      return;
    }
    toast.success("Ad zone deleted");
    load();
  };

  const exportReport = () => {
    if (!summary) return;
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
          <button type="button" className="btn btn-red" onClick={() => void addZone()}>
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
            <div className="azprev">{zone.size}</div>
            <div className="azname">{zone.name}</div>
            <div className="azpos">{zone.position}</div>
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
    </CmsPage>
  );
}
