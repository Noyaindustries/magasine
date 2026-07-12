import { DEFAULT_NEWSLETTER_EMAIL } from "@/lib/homepage-sections";
import { getSiteUrl } from "@/lib/site";
import type { PublicSiteSettings } from "@/lib/site-settings";

export function toAbsoluteSiteAssetUrl(path: string): string {
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function formatNewsletterDefaultSubject(template: string, siteName: string): string {
  const resolved = template.trim() || DEFAULT_NEWSLETTER_EMAIL.defaultSubject;
  return resolved.replace(/\{siteName\}/g, siteName).trim();
}

export function resolveNewsletterEmailHeaderTitle(
  settings: Pick<PublicSiteSettings, "newsletterEmailHeaderTitle" | "siteName">
): string {
  const custom = settings.newsletterEmailHeaderTitle?.trim();
  return custom || settings.siteName;
}

export function resolveNewsletterDefaultSubject(
  settings: Pick<PublicSiteSettings, "newsletterDefaultSubject" | "siteName">
): string {
  return formatNewsletterDefaultSubject(
    settings.newsletterDefaultSubject || DEFAULT_NEWSLETTER_EMAIL.defaultSubject,
    settings.siteName
  );
}

export function resolveNewsletterEmailLogoUrl(
  settings: Pick<PublicSiteSettings, "siteLogo">
): string {
  return toAbsoluteSiteAssetUrl(settings.siteLogo);
}
