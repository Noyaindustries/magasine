export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61589375453724",
  youtube: "https://www.youtube.com/@GlobalSouthWatch-k9w",
  bluesky: "https://bsky.app/profile/globalsouthwatch.bsky.social",
  linkedin: "https://www.linkedin.com/company/globalsouthwatch",
  whatsapp: "https://wa.me/22500000000",
} as const;

export type SocialNetwork = keyof typeof SOCIAL_LINKS;

/** Networks shown in header, footer, and top bar */
export const SITE_SOCIAL_NETWORKS = ["facebook", "youtube", "bluesky"] as const satisfies readonly SocialNetwork[];

export const HEADER_SOCIAL_NETWORKS = [...SITE_SOCIAL_NETWORKS, "linkedin"] as const satisfies readonly SocialNetwork[];
