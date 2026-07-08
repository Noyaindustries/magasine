import { loadAdZones } from "@/lib/ad-zones-storage";
import type { AdSlotId, PublicAd } from "@/lib/ad-slots";

export {
  AD_SLOTS,
  AD_SLOT_LABELS,
  AD_SLOT_DIMENSIONS,
  isAdSlot,
} from "@/lib/ad-slots";
export type { AdSlotId, PublicAd } from "@/lib/ad-slots";

/**
 * Retourne la première publicité active dotée d'une image pour l'emplacement
 * demandé, ou null. Best-effort : ne jette jamais (le rendu du site ne doit pas
 * dépendre du succès de cette lecture).
 */
export async function getActiveAdBySlot(slot: AdSlotId): Promise<PublicAd | null> {
  try {
    const zones = await loadAdZones();
    const zone = zones.find(
      (z) => z.active && z.slot === slot && !!z.imageUrl && z.imageUrl.trim().length > 0
    );
    if (!zone || !zone.imageUrl) return null;
    return {
      key: zone.key,
      slot,
      name: zone.name,
      imageUrl: zone.imageUrl,
      linkUrl: zone.linkUrl && zone.linkUrl.trim().length > 0 ? zone.linkUrl : undefined,
    };
  } catch {
    return null;
  }
}
