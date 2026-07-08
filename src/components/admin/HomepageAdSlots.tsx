"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { AD_SLOTS, AD_SLOT_LABELS, type AdSlotId } from "@/lib/ad-slots";
import { uploadAdminMedia } from "@/lib/admin-upload";
import { toast } from "@/lib/toast";
import { toastIfNotOk, toastNetworkError } from "@/lib/api-toast";

interface AdZoneRow {
  _id: string;
  slot: string;
  name: string;
  active: boolean;
  imageUrl: string;
  linkUrl: string;
}

const SLOT_SIZES: Record<AdSlotId, string> = {
  "home-below": "970 × 250 px",
  "home-sidebar": "300 × 250 px",
  "article-right": "300 × 600 px",
  "article-below": "970 × 250 px",
};

interface SlotState {
  zoneId: string | null;
  active: boolean;
  imageUrl: string;
  linkUrl: string;
}

const EMPTY_SLOT: SlotState = { zoneId: null, active: true, imageUrl: "", linkUrl: "" };

export function HomepageAdSlots() {
  const [slots, setSlots] = useState<Record<AdSlotId, SlotState>>(() => {
    const initial = {} as Record<AdSlotId, SlotState>;
    for (const s of AD_SLOTS) initial[s] = { ...EMPTY_SLOT };
    return initial;
  });
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<AdSlotId | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<AdSlotId | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/publicites");
      if (!res.ok) {
        toastNetworkError();
        return;
      }
      const data = (await res.json()) as { zones?: AdZoneRow[] };
      const next = {} as Record<AdSlotId, SlotState>;
      for (const s of AD_SLOTS) next[s] = { ...EMPTY_SLOT };
      for (const zone of data.zones ?? []) {
        if ((AD_SLOTS as readonly string[]).includes(zone.slot)) {
          const slot = zone.slot as AdSlotId;
          // Première zone rencontrée pour ce slot fait foi
          if (next[slot].zoneId === null) {
            next[slot] = {
              zoneId: zone._id,
              active: zone.active,
              imageUrl: zone.imageUrl ?? "",
              linkUrl: zone.linkUrl ?? "",
            };
          }
        }
      }
      setSlots(next);
    } catch {
      toastNetworkError();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patchSlot = (slot: AdSlotId, patch: Partial<SlotState>) => {
    setSlots((prev) => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
  };

  const handleUpload = async (slot: AdSlotId, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingSlot(slot);
    try {
      const { url } = await uploadAdminMedia(file, AD_SLOT_LABELS[slot]);
      patchSlot(slot, { imageUrl: url });
      toast.success("Image téléversée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec du téléversement");
    } finally {
      setUploadingSlot(null);
    }
  };

  const saveSlot = async (slot: AdSlotId) => {
    const state = slots[slot];
    setSavingSlot(slot);
    try {
      if (state.zoneId) {
        const res = await fetch("/api/admin/publicites", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zoneId: state.zoneId,
            slot,
            active: state.active,
            imageUrl: state.imageUrl,
            linkUrl: state.linkUrl,
            position: AD_SLOT_LABELS[slot],
            size: SLOT_SIZES[slot],
          }),
        });
        if (await toastIfNotOk(res, "Enregistrement impossible")) return;
      } else {
        const res = await fetch("/api/admin/publicites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: AD_SLOT_LABELS[slot],
            slot,
            position: AD_SLOT_LABELS[slot],
            size: SLOT_SIZES[slot],
            imageUrl: state.imageUrl,
            linkUrl: state.linkUrl,
          }),
        });
        if (await toastIfNotOk(res, "Création impossible")) return;
      }
      toast.success("Emplacement enregistré");
      await load();
    } catch {
      toastNetworkError();
    } finally {
      setSavingSlot(null);
    }
  };

  return (
    <div className="hpg-panel-card">
      <div className="hpg-panel-head">
        <div>
          <h3 className="hpg-panel-title">Grandes images (emplacements)</h3>
          <p className="hpg-panel-desc">
            Téléverse une image, ajoute un lien cliquable et active l&apos;emplacement. Les images
            s&apos;affichent automatiquement sur le site public (accueil et articles).
          </p>
        </div>
      </div>

      {loading ? (
        <p className="hpg-slot-empty">Chargement des emplacements…</p>
      ) : (
        <div className="hpg-partners">
          {AD_SLOTS.map((slot) => {
            const state = slots[slot];
            const isSaving = savingSlot === slot;
            const isUploading = uploadingSlot === slot;
            return (
              <div
                key={slot}
                className={`hpg-partner-card${state.active && state.imageUrl ? " hpg-partner-card--active" : ""}`}
              >
                <div className="hpg-partner-head">
                  <label className="hpg-switch" title="Activer" aria-label={`Activer ${AD_SLOT_LABELS[slot]}`}>
                    <input
                      type="checkbox"
                      checked={state.active}
                      onChange={(e) => patchSlot(slot, { active: e.target.checked })}
                    />
                    <span className="hpg-switch-track" aria-hidden />
                  </label>
                  <span className="hpg-adslot-name">{AD_SLOT_LABELS[slot]}</span>
                  <code className="hpg-section-flag hpg-adslot-size">{SLOT_SIZES[slot]}</code>
                </div>

                {state.imageUrl && (
                  <div className="hpg-partner-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={state.imageUrl} alt={AD_SLOT_LABELS[slot]} />
                  </div>
                )}

                <div className="hpg-form-grid-2">
                  <div className="hpg-field">
                    <label>Image</label>
                    <div className="hpg-logo-upload">
                      <code>{state.imageUrl ? "Image définie" : "Aucune image"}</code>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        disabled={isUploading}
                        onClick={() => fileInputs.current[slot]?.click()}
                      >
                        {isUploading ? "Téléversement…" : state.imageUrl ? "Remplacer" : "Téléverser"}
                      </button>
                    </div>
                    <input
                      ref={(el) => {
                        fileInputs.current[slot] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hpg-hidden-file"
                      aria-label={`Téléverser une image pour ${AD_SLOT_LABELS[slot]}`}
                      onChange={(e) => void handleUpload(slot, e)}
                    />
                  </div>
                  <div className="hpg-field">
                    <label>Lien cliquable (http/https)</label>
                    <input
                      value={state.linkUrl}
                      onChange={(e) => patchSlot(slot, { linkUrl: e.target.value })}
                      placeholder="https://exemple.com"
                    />
                  </div>
                </div>

                <div className="hpg-section-actions hpg-adslot-actions">
                  {state.imageUrl && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm admin-btn--secondary"
                      onClick={() => patchSlot(slot, { imageUrl: "" })}
                    >
                      Retirer l&apos;image
                    </button>
                  )}
                  <button
                    type="button"
                    className="hpg-btn-gold"
                    disabled={isSaving || isUploading}
                    onClick={() => void saveSlot(slot)}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Enregistrer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
