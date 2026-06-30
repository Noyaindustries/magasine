import mongoose, { Schema, type Model } from "mongoose";
import type { HomeSectionId } from "@/lib/homepage-sections";
import { getSiteUrl } from "@/lib/site";

export interface PulseStatDoc {
  value: string;
  label: string;
}

export interface ClosingStatDoc {
  num: string;
  suffix: string;
  label: string;
}

export interface TrustPartnerDoc {
  name: string;
  logo: string;
  width: number;
  height: number;
  url?: string;
  isActive: boolean;
}

export interface AdZoneDoc {
  key: string;
  name: string;
  position: string;
  size: string;
  active: boolean;
  impressions: number;
  clicks: number;
  revenueFcfa: number;
}

export interface ISiteSettings {
  _id: mongoose.Types.ObjectId;
  siteName: string;
  tagline: string;
  contactEmail: string;
  siteLogo: string;
  favicon: string;
  breakingAlertEnabled: boolean;
  commentsEnabled: boolean;
  newsletterEnabled: boolean;
  maintenanceMode: boolean;
  homeSections: Partial<Record<HomeSectionId, boolean>>;
  pulseStats: PulseStatDoc[];
  closingStats: ClosingStatDoc[];
  newsletterTitle: string;
  newsletterTitleEm: string;
  newsletterDescription: string;
  newsletterBenefits: string[];
  mastheadVolume: string;
  mastheadCities: string;
  mastheadBadge: string;
  trustStripLabel: string;
  trustStripEnabled: boolean;
  trustPartners: TrustPartnerDoc[];
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
  mailchimpConnected: boolean;
  brevoConnected: boolean;
  typographyPreset: string;
  adZones: AdZoneDoc[];
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: { type: String, default: "Global South Watch" },
    tagline: {
      type: String,
      default: "Decolonizing media",
    },
    contactEmail: { type: String, default: "contact@globalsouthwatch.com" },
    siteLogo: { type: String, default: "/images/logo-global-south-watch.png" },
    favicon: { type: String, default: "/images/logo-global-south-watch.png" },
    breakingAlertEnabled: { type: Boolean, default: true },
    commentsEnabled: { type: Boolean, default: true },
    newsletterEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
    homeSections: { type: Schema.Types.Mixed, default: {} },
    pulseStats: { type: [{ value: String, label: String }], default: [] },
    closingStats: { type: [{ num: String, suffix: String, label: String }], default: [] },
    newsletterTitle: {
      type: String,
      default: "",
    },
    newsletterTitleEm: {
      type: String,
      default: "delivered straight to your inbox.",
    },
    newsletterDescription: {
      type: String,
      default:
        "An editorial selection of the most important news from Africa and the Global South, curated by our newsroom.",
    },
    newsletterBenefits: {
      type: [String],
      default: [
        "Daily briefing every morning",
        "Regional editions you choose",
        "Investigation alerts — always free",
      ],
    },
    mastheadVolume: { type: String, default: "Vol. XII · N° 1847" },
    mastheadCities: { type: String, default: "Abidjan · Dakar · Nairobi" },
    mastheadBadge: { type: String, default: "Today's Edition" },
    trustStripLabel: { type: String, default: "As seen in" },
    trustStripEnabled: { type: Boolean, default: true },
    trustPartners: {
      type: [
        {
          name: String,
          logo: String,
          width: Number,
          height: Number,
          url: String,
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: getSiteUrl },
    mailchimpConnected: { type: Boolean, default: false },
    brevoConnected: { type: Boolean, default: false },
    typographyPreset: { type: String, default: "canela-editorial" },
    adZones: {
      type: [
        {
          key: String,
          name: String,
          position: String,
          size: String,
          active: { type: Boolean, default: true },
          impressions: { type: Number, default: 0 },
          clicks: { type: Number, default: 0 },
          revenueFcfa: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ??
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export async function getOrCreateSiteSettings() {
  let settings = await SiteSettings.findOne().lean();
  if (!settings) {
    const created = await SiteSettings.create({});
    settings = created.toObject();
  }
  return settings;
}
