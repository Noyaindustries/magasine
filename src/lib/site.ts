/** Publisher and site-wide constants */
export const PUBLISHER_NAME = "Noya Industries";
export const SITE_NAME = "Global South Watch";
export const SITE_TAGLINE =
  "Independent journalism for Africa and the Global South";
export const SITE_EMAIL = "contact@globalsouthwatch.com";
export const PRIVACY_EMAIL = "privacy@globalsouthwatch.com";
export const ACCESSIBILITY_EMAIL = "accessibility@globalsouthwatch.com";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getSiteHostname(): string {
  try {
    return new URL(getSiteUrl()).hostname;
  } catch {
    return "localhost";
  }
}

export function getFeedUrl(): string {
  return `${getSiteUrl()}/feed.xml`;
}

export function getSitemapUrl(): string {
  return `${getSiteUrl()}/sitemap.xml`;
}
