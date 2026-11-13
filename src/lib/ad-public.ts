import { loadAdZones, resolveZoneSlot } from "@/lib/ad-zones-storage";
import { AD_SLOTS, type AdSlotId, type PublicAd } from "@/lib/ad-slots";
import { resolveMediaUrl } from "@/lib/media-url";

export {
  AD_SLOTS,
  AD_SLOT_LABELS,
  AD_SLOT_DIMENSIONS,
  isAdSlot,
} from "@/lib/ad-slots";
export type { AdSlotId, PublicAd } from "@/lib/ad-slots";

/**
 * Retourne la premi├¿re publicit├® active dot├®e d'une image pour l'emplacement
 * demand├®, ou null. Best-effort : ne jette jamais (le rendu du site ne doit pas
 * d├®pendre du succ├¿s de cette lecture).
 */
export async function getActiveAdBySlot(slot: AdSlotId): Promise<PublicAd | null> {
  try {
    const zones = await loadAdZones();
    const withImage = zones.filter(
      (z) => z.active && !!z.imageUrl && z.imageUrl.trim().length > 0
    );
    const taken = new Set<AdSlotId>();
    const placed = new Map<AdSlotId, (typeof withImage)[number]>();

    for (const zone of withImage) {
      const resolved = resolveZoneSlot(zone);
      if (!resolved || taken.has(resolved)) continue;
      taken.add(resolved);
      placed.set(resolved, zone);
    }
    for (const zone of withImage) {
      if (resolveZoneSlot(zone)) continue;
      const free = AD_SLOTS.find((candidate) => !taken.has(candidate));
      if (!free) break;
      taken.add(free);
      placed.set(free, zone);
    }

    const zone = placed.get(slot);
    if (!zone?.imageUrl) return null;
    return {
      key: zone.key,
      slot,
      name: zone.name,
      imageUrl: resolveMediaUrl(zone.imageUrl),
      linkUrl: zone.linkUrl && zone.linkUrl.trim().length > 0 ? zone.linkUrl : undefined,
    };
  } catch {
    return null;
  }
}
