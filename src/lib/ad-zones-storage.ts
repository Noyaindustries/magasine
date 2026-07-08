import { CMS_AD_ZONES } from "@/lib/cms-mock-data";
import { connectDB } from "@/lib/mongodb";
import { Category } from "@/models/Category";
import { SiteSettings, type AdZoneDoc } from "@/models/SiteSettings";

const AD_ZONES_CATEGORY_SLUG = "__cms-ad-zones__";

function parseRevenue(value: string): number {
  if (value === "En pause" || value === "—") return 0;
  const digits = value.replace(/\D/g, "");
  return Number(digits) || 0;
}

function parseImpressions(value: string): number {
  if (value === "—") return 0;
  const normalized = value.toLowerCase().replace(/\s/g, "");
  if (normalized.endsWith("k")) {
    return Math.round(parseFloat(normalized) * 1000);
  }
  if (normalized.endsWith("m")) {
    return Math.round(parseFloat(normalized) * 1_000_000);
  }
  return Number(normalized.replace(/\D/g, "")) || 0;
}

export function defaultAdZones(): AdZoneDoc[] {
  return CMS_AD_ZONES.map((zone) => {
    const impressions = parseImpressions(zone.impressions);
    return {
      key: zone.id,
      name: zone.name,
      position: zone.position,
      size: zone.size,
      active: zone.active,
      impressions,
      clicks: Math.round(impressions * 0.038),
      revenueFcfa: parseRevenue(zone.revenue),
    };
  });
}

function parseStoredZones(raw: string | undefined | null): AdZoneDoc[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AdZoneDoc[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

async function loadFromSiteSettings(): Promise<AdZoneDoc[] | null> {
  const settings = await SiteSettings.findOne().lean();
  if (settings?.adZones?.length) {
    return settings.adZones;
  }
  return null;
}

async function loadFromCategory(): Promise<AdZoneDoc[] | null> {
  const doc = await Category.findOne({ slug: AD_ZONES_CATEGORY_SLUG }).lean();
  return parseStoredZones(doc?.description);
}

async function saveToSiteSettings(zones: AdZoneDoc[]): Promise<boolean> {
  const settings = await SiteSettings.findOne().lean();
  if (!settings) return false;
  await SiteSettings.updateOne({ _id: settings._id }, { $set: { adZones: zones } });
  return true;
}

async function saveToCategory(zones: AdZoneDoc[]): Promise<void> {
  await Category.findOneAndUpdate(
    { slug: AD_ZONES_CATEGORY_SLUG },
    {
      $set: {
        name: "CMS — Zones publicitaires",
        description: JSON.stringify(zones),
        color: "#1a1a2e",
        order: -1,
        isActive: false,
      },
      $setOnInsert: { slug: AD_ZONES_CATEGORY_SLUG },
    },
    { upsert: true }
  );
}

export async function loadAdZones(): Promise<AdZoneDoc[]> {
  try {
    await connectDB();

    const fromSettings = await loadFromSiteSettings();
    if (fromSettings) return fromSettings;

    const fromCategory = await loadFromCategory();
    if (fromCategory) return fromCategory;

    const defaults = defaultAdZones();
    try {
      const savedInSettings = await saveToSiteSettings(defaults);
      if (!savedInSettings) {
        await saveToCategory(defaults);
      }
    } catch (error) {
      console.warn("Impossible de persister les zones publicitaires par défaut:", error);
    }
    return defaults;
  } catch (error) {
    console.error("loadAdZones:", error);
    return defaultAdZones();
  }
}

export async function saveAdZones(zones: AdZoneDoc[]): Promise<void> {
  await connectDB();

  try {
    const savedInSettings = await saveToSiteSettings(zones);
    if (savedInSettings) return;
    await saveToCategory(zones);
  } catch (error) {
    console.error("saveAdZones:", error);
    throw error;
  }
}

/**
 * Incrémente une métrique (impressions ou clics) d'une zone donnée.
 * Silencieux si la zone n'existe pas (tracking best-effort).
 */
export async function incrementAdMetric(
  key: string,
  field: "impressions" | "clicks"
): Promise<void> {
  try {
    const zones = await loadAdZones();
    const index = zones.findIndex((z) => z.key === key);
    if (index < 0) return;
    zones[index] = {
      ...zones[index],
      [field]: (zones[index][field] ?? 0) + 1,
    };
    await saveAdZones(zones);
  } catch (error) {
    console.warn("incrementAdMetric:", error);
  }
}

/** @deprecated Utiliser loadAdZones */
export async function ensureAdZonesSeeded(): Promise<AdZoneDoc[]> {
  return loadAdZones();
}
