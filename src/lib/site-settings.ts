import { cache } from "react";
import { connectDB } from "@/lib/mongodb";
import { getOrCreateSiteSettings, SiteSettings, type ISiteSettings } from "@/models/SiteSettings";
import {
  DEFAULT_CLOSING_STATS,
  DEFAULT_HOME_SECTIONS,
  DEFAULT_MASTHEAD_BADGE,
  DEFAULT_NEWSLETTER_COPY,
  DEFAULT_PULSE_STATS,
  DEFAULT_TRUST_PARTNERS,
  DEFAULT_TRUST_STRIP_LABEL,
  type HomeSectionId,
  type TrustPartnerItem,
} from "@/lib/homepage-sections";
import { resolveFavicon, resolveSiteLogo } from "@/lib/branding";
import { getSiteUrl } from "@/lib/site";

export interface PulseStat {
  value: string;
  label: string;
}

export interface ClosingStat {
  num: string;
  suffix: string;
  label: string;
}

export type TrustPartner = TrustPartnerItem;

export interface PublicSiteSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  siteLogo: string;
  favicon: string;
  breakingAlertEnabled: boolean;
  commentsEnabled: boolean;
  newsletterEnabled: boolean;
  maintenanceMode: boolean;
  homeSections: Record<HomeSectionId, boolean>;
  pulseStats: PulseStat[];
  closingStats: ClosingStat[];
  newsletterTitle: string;
  newsletterTitleEm: string;
  newsletterDescription: string;
  newsletterBenefits: string[];
  mastheadVolume: string;
  mastheadCities: string;
  mastheadBadge: string;
  trustStripLabel: string;
  trustStripEnabled: boolean;
  trustPartners: TrustPartner[];
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
  mailchimpConnected: boolean;
  brevoConnected: boolean;
  updatedAt?: Date;
}

function mergeHomeSections(
  raw?: Partial<Record<HomeSectionId, boolean>>
): Record<HomeSectionId, boolean> {
  const safe: Partial<Record<HomeSectionId, boolean>> = {};
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "boolean") {
        safe[key as HomeSectionId] = value;
      }
    }
  }
  return { ...DEFAULT_HOME_SECTIONS, ...safe };
}

export function mapSiteSettings(doc: ISiteSettings): PublicSiteSettings {
  const allPartners = doc.trustPartners?.length ? doc.trustPartners : DEFAULT_TRUST_PARTNERS;

  return {
    siteName: doc.siteName,
    tagline: doc.tagline,
    contactEmail: doc.contactEmail,
    siteLogo: resolveSiteLogo(doc.siteLogo),
    favicon: resolveFavicon(doc.favicon),
    breakingAlertEnabled: doc.breakingAlertEnabled,
    commentsEnabled: doc.commentsEnabled,
    newsletterEnabled: doc.newsletterEnabled,
    maintenanceMode: doc.maintenanceMode,
    homeSections: mergeHomeSections(doc.homeSections),
    pulseStats: doc.pulseStats?.length ? doc.pulseStats : DEFAULT_PULSE_STATS,
    closingStats: doc.closingStats?.length ? doc.closingStats : DEFAULT_CLOSING_STATS,
    newsletterTitle: doc.newsletterTitle ?? DEFAULT_NEWSLETTER_COPY.title,
    newsletterTitleEm: doc.newsletterTitleEm ?? DEFAULT_NEWSLETTER_COPY.titleEm,
    newsletterDescription: doc.newsletterDescription ?? DEFAULT_NEWSLETTER_COPY.description,
    newsletterBenefits: doc.newsletterBenefits?.length
      ? doc.newsletterBenefits
      : DEFAULT_NEWSLETTER_COPY.benefits,
    mastheadVolume: doc.mastheadVolume ?? "Vol. XII · N° 1847",
    mastheadCities: doc.mastheadCities ?? "Abidjan · Dakar · Nairobi",
    mastheadBadge: doc.mastheadBadge ?? DEFAULT_MASTHEAD_BADGE,
    trustStripLabel: doc.trustStripLabel ?? DEFAULT_TRUST_STRIP_LABEL,
    trustStripEnabled: doc.trustStripEnabled ?? false,
    trustPartners: allPartners,
    seoTitle: doc.seoTitle ?? doc.siteName,
    seoDescription: doc.seoDescription ?? doc.tagline,
    ogImage: doc.ogImage ?? "",
    canonicalUrl: doc.canonicalUrl ?? getSiteUrl(),
    mailchimpConnected: doc.mailchimpConnected ?? false,
    brevoConnected: doc.brevoConnected ?? false,
    updatedAt: doc.updatedAt,
  };
}

export function getActiveTrustPartners(settings: PublicSiteSettings): TrustPartner[] {
  if (!settings.trustStripEnabled) return [];
  return settings.trustPartners.filter((p) => p.isActive !== false);
}

export const getPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  try {
    await connectDB();
    const doc = await getOrCreateSiteSettings();
    return mapSiteSettings(doc);
  } catch {
    return mapSiteSettings({
      _id: undefined as never,
      siteName: "Global South Watch",
      tagline: "Decolonizing media",
      contactEmail: "contact@globalsouthwatch.com",
      siteLogo: resolveSiteLogo(undefined),
      favicon: resolveFavicon(undefined),
      breakingAlertEnabled: false,
      commentsEnabled: true,
      newsletterEnabled: true,
      maintenanceMode: false,
      homeSections: {},
      pulseStats: [],
      closingStats: [],
      newsletterTitle: DEFAULT_NEWSLETTER_COPY.title,
      newsletterTitleEm: DEFAULT_NEWSLETTER_COPY.titleEm,
      newsletterDescription: DEFAULT_NEWSLETTER_COPY.description,
      newsletterBenefits: [],
      mastheadVolume: "Vol. XII · N° 1847",
      mastheadCities: "Abidjan · Dakar · Nairobi",
      mastheadBadge: DEFAULT_MASTHEAD_BADGE,
      trustStripLabel: DEFAULT_TRUST_STRIP_LABEL,
      trustStripEnabled: false,
      trustPartners: [],
      seoTitle: "",
      seoDescription: "",
      ogImage: "",
      canonicalUrl: getSiteUrl(),
      mailchimpConnected: false,
      brevoConnected: false,
      adZones: [],
      updatedAt: new Date(),
    });
  }
});

export type UpdateSiteSettingsInput = Omit<Partial<PublicSiteSettings>, "homeSections"> & {
  homeSections?: Partial<Record<HomeSectionId, boolean>>;
};

export type HomepageSettingsInput = Pick<
  UpdateSiteSettingsInput,
  | "tagline"
  | "mastheadVolume"
  | "mastheadCities"
  | "mastheadBadge"
  | "pulseStats"
  | "trustStripLabel"
  | "trustStripEnabled"
  | "trustPartners"
  | "homeSections"
  | "closingStats"
  | "newsletterTitle"
  | "newsletterTitleEm"
  | "newsletterDescription"
>;

export async function updateSiteSettings(patch: UpdateSiteSettingsInput) {
  await connectDB();
  const existing = await getOrCreateSiteSettings();
  const doc = await SiteSettings.findById(existing._id);
  if (!doc) throw new Error("Settings not found");

  applySettingsPatch(doc, patch);
  await doc.save();
  return mapSiteSettings(doc.toObject());
}

export async function updateHomepageSettings(patch: HomepageSettingsInput) {
  return updateSiteSettings(patch);
}

function applySettingsPatch(
  doc: ISiteSettings,
  patch: UpdateSiteSettingsInput
) {
  const assignable: (keyof PublicSiteSettings)[] = [
    "siteName",
    "tagline",
    "contactEmail",
    "siteLogo",
    "favicon",
    "breakingAlertEnabled",
    "commentsEnabled",
    "newsletterEnabled",
    "maintenanceMode",
    "pulseStats",
    "closingStats",
    "newsletterTitle",
    "newsletterTitleEm",
    "newsletterDescription",
    "newsletterBenefits",
    "mastheadVolume",
    "mastheadCities",
    "mastheadBadge",
    "trustStripLabel",
    "trustStripEnabled",
    "trustPartners",
    "seoTitle",
    "seoDescription",
    "ogImage",
    "canonicalUrl",
    "mailchimpConnected",
    "brevoConnected",
  ];

  for (const key of assignable) {
    if (patch[key] !== undefined) {
      (doc as unknown as Record<string, unknown>)[key] = patch[key];
    }
  }

  if (patch.homeSections) {
    doc.homeSections = { ...doc.homeSections, ...patch.homeSections };
  }
}
