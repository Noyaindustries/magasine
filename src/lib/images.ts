/** URLs d'images éditoriales (Unsplash) — réutilisées sur l'accueil et dans les articles */
export const IMG = {
  finance: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=800&fit=crop",
  fintech: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&h=800&fit=crop",
  football: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=800&fit=crop",
  tech: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop",
  africa: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1200&h=800&fit=crop",
  investigation: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=800&fit=crop",
  cacao: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1200&h=800&fit=crop",
  health: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=1200&h=800&fit=crop",
  datacenter: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=800&fit=crop",
  agriculture: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&h=800&fit=crop",
  economy: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=800&fit=crop",
  diaspora: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=800&fit=crop",
  port: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&h=800&fit=crop",
  heritage: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=1200&h=800&fit=crop",
  un: "https://images.unsplash.com/photo-1540914124281-342587941389?w=1200&h=800&fit=crop",
  stadium: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&h=800&fit=crop",
  forest: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&h=800&fit=crop",
  politics: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&h=800&fit=crop",
  portrait1: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop",
  portrait2: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
  portrait3: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  latinAmerica: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&h=800&fit=crop",
  southAsia: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&h=800&fit=crop",
  westAsia: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=800&fit=crop",
  sahel: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=800&fit=crop",
} as const;

export { DEFAULT_SITE_LOGO as SITE_LOGO } from "@/lib/branding";

/** Photos Unsplash retirées — remplacement par ID (indépendant des query params). */
const REMOVED_UNSPLASH_PHOTO_IDS: Record<string, string> = {
  "photo-1574943325722-55f388851e73": IMG.agriculture,
  "photo-1611162617474-5b21e939e113": IMG.tech,
  "photo-1509316785289-025f5b846b8e": IMG.sahel,
  "photo-1524492412937-280c33fd95dd": IMG.southAsia,
};

export function resolveFeaturedImage(url: string | undefined | null): string {
  if (!url) return IMG.finance;

  const trimmed = url.trim();
  for (const [photoId, replacement] of Object.entries(REMOVED_UNSPLASH_PHOTO_IDS)) {
    if (trimmed.includes(photoId)) {
      return replacement;
    }
  }

  return trimmed;
}

export function getAuthorAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
}

export function resolveAuthorAvatar(avatar: string | undefined | null, seed: string): string {
  if (!avatar || avatar.includes("/svg?")) {
    return getAuthorAvatarUrl(seed);
  }
  return avatar;
}
