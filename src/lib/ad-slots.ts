/**
 * Constantes et types des emplacements publicitaires — SANS dépendance serveur
 * (aucun import de base de données), pour pouvoir être importé côté client.
 */

export const AD_SLOTS = [
  "home-below",
  "home-sidebar",
  "article-right",
  "article-below",
] as const;

export type AdSlotId = (typeof AD_SLOTS)[number];

export const AD_SLOT_LABELS: Record<AdSlotId, string> = {
  "home-below": "Home — banner below sections",
  "home-sidebar": "Home — side rectangle",
  "article-right": "Article — large image on the right",
  "article-below": "Article — banner below content",
};

/** Dimensions de référence par emplacement (ratio conservé, largeur fluide). */
export const AD_SLOT_DIMENSIONS: Record<AdSlotId, { width: number; height: number }> = {
  "home-below": { width: 970, height: 250 },
  "home-sidebar": { width: 300, height: 250 },
  "article-right": { width: 300, height: 600 },
  "article-below": { width: 970, height: 250 },
};

export function isAdSlot(value: string): value is AdSlotId {
  return (AD_SLOTS as readonly string[]).includes(value);
}

export interface PublicAd {
  key: string;
  slot: AdSlotId;
  name: string;
  imageUrl: string;
  linkUrl?: string;
}
