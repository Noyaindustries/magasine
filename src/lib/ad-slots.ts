/**
 * Constantes et types des emplacements publicitaires ÔÇö SANS d├®pendance serveur
 * (aucun import de base de donn├®es), pour pouvoir ├¬tre import├® c├┤t├® client.
 */

export const AD_SLOTS = [
  "home-below",
  "home-sidebar",
  "article-right",
  "article-below",
] as const;

export type AdSlotId = (typeof AD_SLOTS)[number];

export const AD_SLOT_LABELS: Record<AdSlotId, string> = {
  "home-below": "Home ÔÇö banner below sections",
  "home-sidebar": "Home ÔÇö side rectangle",
  "article-right": "Article ÔÇö large image on the right",
  "article-below": "Article ÔÇö banner below content",
};

/** Dimensions de r├®f├®rence par emplacement (ratio conserv├®, largeur fluide). */
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
