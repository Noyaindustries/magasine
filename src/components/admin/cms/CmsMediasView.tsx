"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CmsPage } from "@/components/admin/cms/CmsPage";
import { CmsActionIcons, CmsMediaKindIcon } from "@/components/admin/cms/CmsIcons";
import { CMS_MEDIA_GRADIENTS } from "@/lib/cms-mock-data";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface MediaItem {
  _id: string;
  title: string;
  url: string;
  kind: string;
  sizeBytes: number;
}

interface MediaStats {
  totalCount: number;
  usedBytes: number;
  quotaBytes: number;
  breakdown: { kind: string; bytes: number }[];
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${bytes} o`;
}

const KIND_LABELS: Record<string, string> = {
  image: "Images (JPG / WebP)",
  video: "Vidéos (MP4)",
  podcast: "Podcasts (MP3)",
  document: "Documents (PDF)",
};

const KIND_COLORS: Record<string, string> = {
  image: "var(--blue)",
  video: "var(--purple)",
  podcast: "var(--amber)",
  document: "var(--green)",
};

function fetchMedias(query: string, kind: string, sort: string) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (kind) params.set("kind", kind);
  if (sort) params.set("sort", sort);

  return fetch(`/api/admin/medias?${params}`).then((r) => r.json()) as Promise<{
    items?: MediaItem[];
    stats?: MediaStats | null;
  }>;
}

export function CmsMediasView() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats | null>(null);
  const [selected, setSelected] = useState(0);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    void fetchMedias(query, kind, sort)
      .then((data) => {
        setItems(data.items ?? []);
        setStats(data.stats ?? null);
      })
      .finally(() => setLoading(false));
  }, [query, kind, sort]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    void fetchMedias(query, kind, sort)
      .then((data) => {
        if (!cancelled) {
          setItems(data.items ?? []);
          setStats(data.stats ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, kind, sort]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("title", file.name);
        await fetch("/api/admin/medias", { method: "POST", body: form });
      }
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Supprimer « ${item.title} » ?`)) return;
    const res = await fetch(`/api/admin/medias/${item._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast.error(data.error ?? "Suppression impossible.");
      return;
    }
    toast.success("Média supprimé");
    setSelected(0);
    load();
  };

  const deleteSelected = async () => {
    const item = items[selected];
    if (!item) return;
    await deleteMedia(item);
  };

  const usedPct = stats ? Math.min(100, Math.round((stats.usedBytes / stats.quotaBytes) * 100)) : 0;
  const breakdown =
    stats?.breakdown.map((row) => ({
      label: KIND_LABELS[row.kind] ?? row.kind,
      value: formatBytes(row.bytes),
      pct: stats.usedBytes > 0 ? Math.round((row.bytes / stats.usedBytes) * 100) : 0,
      color: KIND_COLORS[row.kind] ?? "var(--t3)",
    })) ?? [];

  return (
    <CmsPage className="cms-medias-page">
      <div className="vhead">
        <div>
          <div className="vh1">Médiathèque</div>
          <div className="vh2">
            {stats?.totalCount.toLocaleString("fr-FR") ?? "—"} fichiers ·{" "}
            {stats ? formatBytes(stats.usedBytes) : "—"} utilisés sur{" "}
            {stats ? formatBytes(stats.quotaBytes) : "20 Go"}
          </div>
        </div>
        <div className="vacts">
          <button type="button" className="btn btn-out" onClick={deleteSelected} disabled={!items.length}>
            Supprimer la sélection
          </button>
          <button
            type="button"
            className="btn btn-red"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Envoi…" : "+ Ajouter des médias"}
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/mp4,audio/mpeg,application/pdf"
            className="cms-hidden-input"
            onChange={(e) => void uploadFiles(e.target.files)}
          />
        </div>
      </div>

      <div className="fbar">
        <div className="fsearch">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="5" cy="5" r="3.5" stroke="var(--t3)" strokeWidth="1.5" />
            <path d="M8 8l2.5 2.5" stroke="var(--t3)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Rechercher un média…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="fsel" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Tous les types</option>
          <option value="image">Images</option>
          <option value="video">Vidéos</option>
          <option value="podcast">Podcasts</option>
          <option value="document">Documents</option>
        </select>
        <select className="fsel" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Plus récents</option>
          <option value="oldest">Plus anciens</option>
          <option value="largest">Plus grands</option>
        </select>
      </div>

      <div className="card mb20">
        <div className="card-header">
          <span className="card-title">Bibliothèque</span>
          <button type="button" className="card-act" onClick={load}>
            Actualiser
          </button>
        </div>
        <div className="card-body">
          {loading && <p className="cms-empty">Chargement…</p>}
          {!loading && items.length === 0 && (
            <p className="cms-empty">Aucun média. Ajoutez votre premier fichier.</p>
          )}
          <div className="mgrid">
            {items.map((cell, index) => (
              <div key={cell._id} className="mcell-wrap">
                <button
                  type="button"
                  className={cn("mcell", selected === index && "sel")}
                  onClick={() => setSelected(index)}
                  title={cell.title}
                >
                  {cell.url && cell.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cell.url} alt="" className="mcell-img" />
                  ) : (
                    <div
                      className="mph"
                      style={{
                        background: CMS_MEDIA_GRADIENTS[index % CMS_MEDIA_GRADIENTS.length]!.bg,
                      }}
                    >
                      <CmsMediaKindIcon kind={cell.kind} />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  className="mcell-del btn btn-ghost btn-xs btn-icon"
                  title="Supprimer"
                  onClick={() => void deleteMedia(cell)}
                >
                  <CmsActionIcons.delete size={12} className="cms-icon cms-icon--error" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="g21 ga">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Stockage utilisé</span>
          </div>
          <div className="card-body">
            {(breakdown.length ? breakdown : [{ label: "Images", value: "0 Mo", pct: 0, color: "var(--blue)" }]).map(
              (row) => (
                <div key={row.label} className="gauge">
                  <div className="gtop">
                    <span className="glbl">{row.label}</span>
                    <span className="gval">{row.value}</span>
                  </div>
                  <div className="gbar">
                    <div className="gfill" style={{ width: `${row.pct}%`, background: row.color }} />
                  </div>
                </div>
              )
            )}
            <div className="cms-storage-total">
              <span>Total utilisé</span>
              <span className="cms-storage-total-val">
                {stats ? `${formatBytes(stats.usedBytes)} / ${formatBytes(stats.quotaBytes)}` : "—"}
              </span>
            </div>
            <div className="gbar cms-storage-bar">
              <div
                className="gfill"
                style={{
                  width: `${usedPct}%`,
                  background: "linear-gradient(90deg,var(--green),var(--blue))",
                }}
              />
            </div>
          </div>
        </div>
        <div />
      </div>
    </CmsPage>
  );
}
